import { createCanvas } from '@napi-rs/canvas';
import {
  getDocument,
} from 'pdfjs-dist/legacy/build/pdf.mjs';

import {
  recognizeBillImage,
} from './bill-ocr.service.js';

const MAX_PDF_PAGES = 10;
const MIN_EMBEDDED_TEXT_CHARS = 20;

const RENDER_SCALE = 1.5;
const MAX_RENDER_DIMENSION = 2800;
const MAX_RENDER_PIXELS = 6_000_000;

const PDFJS_PACKAGE_ROOT = new URL(
  '../../',
  import.meta.resolve('pdfjs-dist/legacy/build/pdf.mjs')
);

const CMAP_URL = new URL(
  'cmaps/',
  PDFJS_PACKAGE_ROOT
).href;

const STANDARD_FONT_DATA_URL = new URL(
  'standard_fonts/',
  PDFJS_PACKAGE_ROOT
).href;

/**
 * Application-level error for PDF processing failures.
 */
export class BillPdfProcessingError extends Error {
  constructor(message, code, cause) {
    super(message, cause ? { cause } : undefined);

    this.name = 'BillPdfProcessingError';
    this.code = code;
  }
}

/**
 * Custom CanvasFactory for PDF.js using @napi-rs/canvas.
 *
 * PDF.js uses this factory for additional canvases
 * required internally while rendering PDF pages.
 */
class NapiCanvasFactory {
  create(width, height) {
    this.validateDimensions(width, height);

    const canvas = createCanvas(
      Math.ceil(width),
      Math.ceil(height)
    );

    const context = canvas.getContext('2d', {
      alpha: false,
    });

    if (!context) {
      throw new Error('Unable to create a PDF canvas context.');
    }

    return {
      canvas,
      context,
    };
  }

  reset(canvasAndContext, width, height) {
    if (!canvasAndContext?.canvas) {
      throw new Error('Invalid canvas instance.');
    }

    this.validateDimensions(width, height);

    canvasAndContext.canvas.width = Math.ceil(width);
    canvasAndContext.canvas.height = Math.ceil(height);

    canvasAndContext.context =
      canvasAndContext.canvas.getContext('2d', {
        alpha: false,
      });
  }

  destroy(canvasAndContext) {
    if (!canvasAndContext) {
      return;
    }

    if (canvasAndContext.canvas) {
      canvasAndContext.canvas.width = 0;
      canvasAndContext.canvas.height = 0;
    }

    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }

  getNoAlphaContext(canvas) {
    if (!canvas || typeof canvas.getContext !== 'function') {
      throw new TypeError(
        'A valid canvas is required to create a 2D context.'
      );
    }

    const context = canvas.getContext('2d', {
      alpha: false,
    });

    if (!context) {
      throw new Error(
        'Unable to create a 2D canvas context for PDF rendering.'
      );
    }

    return context;
  }

  validateDimensions(width, height) {
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    ) {
      throw new RangeError(
        'PDF canvas dimensions must be positive numbers.'
      );
    }
  }
}

/**
 * Validates the basic PDF file signature.
 */
function validatePdfBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new TypeError(
      'PDF input must be a non-empty Buffer.'
    );
  }

  const header = buffer
    .subarray(0, 1024)
    .toString('latin1');

  if (!header.includes('%PDF-')) {
    throw new BillPdfProcessingError(
      'The uploaded document is not a valid PDF file.',
      'INVALID_PDF'
    );
  }
}

/**
 * Builds readable lines from PDF.js text items.
 *
 * PDF.js provides text positions. We use their vertical
 * positions to preserve separate bill rows.
 */
function extractPageText(items = []) {
  const entries = items
    .map((item, index) => {
      if (
        typeof item?.str !== 'string' ||
        !item.str.trim()
      ) {
        return null;
      }

      const transform = item.transform;

      return {
        text: item.str,
        index,
        x: Number(transform?.[4]),
        y: Number(transform?.[5]),
        width: Number(item.width),
        fontSize: Math.abs(Number(transform?.[3])) || 10,
        hasPosition:
          Array.isArray(transform) &&
          Number.isFinite(Number(transform[4])) &&
          Number.isFinite(Number(transform[5])),
        hasEOL: Boolean(item.hasEOL),
      };
    })
    .filter(Boolean);

  if (entries.length === 0) {
    return '';
  }

  // Fallback for text items without coordinates.
  if (entries.some((entry) => !entry.hasPosition)) {
    let output = '';

    for (const entry of entries) {
      const text = entry.text;

      if (
        output &&
        !/\s$/.test(output) &&
        !/^\s/.test(text)
      ) {
        output += ' ';
      }

      output += text;

      if (entry.hasEOL) {
        output += '\n';
      }
    }

    return output.trim();
  }

  // PDF coordinates start at the bottom-left.
  // Therefore, descending Y gives top-to-bottom reading order.
  entries.sort(
    (a, b) =>
      b.y - a.y ||
      a.x - b.x ||
      a.index - b.index
  );

  const lines = [];

  for (const entry of entries) {
    const tolerance = Math.max(
      2,
      Math.min(entry.fontSize * 0.25, 4)
    );

    let line = lines.find(
      (candidate) =>
        Math.abs(candidate.y - entry.y) <= tolerance
    );

    if (!line) {
      line = {
        y: entry.y,
        entries: [],
      };

      lines.push(line);
    }

    line.entries.push(entry);
  }

  return lines
    .map((line) => {
      line.entries.sort((a, b) => a.x - b.x);

      let text = '';
      let previous = null;

      for (const entry of line.entries) {
        if (previous) {
          const previousEnd =
            previous.x + Math.max(previous.width, 0);

          const gap = entry.x - previousEnd;

          const threshold = Math.max(
            1.5,
            entry.fontSize * 0.2
          );

          if (
            gap > threshold &&
            !/\s$/.test(text) &&
            !/^\s/.test(entry.text)
          ) {
            text += ' ';
          }
        }

        text += entry.text;
        previous = entry;
      }

      return text.trim();
    })
    .filter(Boolean)
    .join('\n');
}

/**
 * Renders a single PDF page into a PNG Buffer.
 *
 * Rendering dimensions are capped to control memory usage.
 */
async function renderPdfPageToPng(page) {
  const originalViewport = page.getViewport({
    scale: 1,
  });

  const width = originalViewport.width;
  const height = originalViewport.height;

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new Error('PDF page dimensions are invalid.');
  }

  const largestDimension = Math.max(width, height);
  const originalPixels = width * height;

  const dimensionScale =
    MAX_RENDER_DIMENSION / largestDimension;

  const pixelScale = Math.sqrt(
    MAX_RENDER_PIXELS / originalPixels
  );

  const scale = Math.min(
    RENDER_SCALE,
    dimensionScale,
    pixelScale
  );

  const viewport = page.getViewport({ scale });

  if (
    viewport.width > MAX_RENDER_DIMENSION + 1 ||
    viewport.height > MAX_RENDER_DIMENSION + 1 ||
    viewport.width * viewport.height > MAX_RENDER_PIXELS + 10_000
  ) {
    throw new Error(
      'PDF page exceeds the allowed rendering dimensions.'
    );
  }

  const canvasFactory = new NapiCanvasFactory();

  let canvasAndContext;

  try {
    canvasAndContext = canvasFactory.create(
      viewport.width,
      viewport.height
    );

    const renderTask = page.render({
      canvas: canvasAndContext.canvas,
      viewport,
    });

    await renderTask.promise;

    const pngBuffer = canvasAndContext.canvas.toBuffer(
      'image/png'
    );

    if (!pngBuffer || pngBuffer.length === 0) {
      throw new Error('PDF page rendering returned an empty image.');
    }

    return Buffer.from(pngBuffer);
  } finally {
    canvasFactory.destroy(canvasAndContext);
  }
}

/**
 * Processes digital and scanned PDF documents.
 *
 * Digital pages:
 * Extract embedded text directly.
 *
 * Scanned pages:
 * Render the page to PNG and run Tesseract OCR.
 *
 * Mixed PDFs:
 * Process each page independently.
 */
export async function processBillPdf(buffer) {
  validatePdfBuffer(buffer);

  let loadingTask;

  try {
    loadingTask = getDocument({
      data: new Uint8Array(buffer),

      CanvasFactory: NapiCanvasFactory,

      cMapUrl: CMAP_URL,
      cMapPacked: true,

      standardFontDataUrl: STANDARD_FONT_DATA_URL,

      useSystemFonts: true,
      isEvalSupported: false,
    });

    const pdfDocument = await loadingTask.promise;

    const pageCount = pdfDocument.numPages;

    if (
      !Number.isInteger(pageCount) ||
      pageCount < 1
    ) {
      throw new BillPdfProcessingError(
        'The PDF does not contain any readable pages.',
        'INVALID_PDF'
      );
    }

    if (pageCount > MAX_PDF_PAGES) {
      throw new BillPdfProcessingError(
        `PDF documents cannot exceed ${MAX_PDF_PAGES} pages.`,
        'PDF_PAGE_LIMIT_EXCEEDED'
      );
    }

    const processedPages = [];

    for (
      let pageNumber = 1;
      pageNumber <= pageCount;
      pageNumber += 1
    ) {
      let page;

      try {
        page = await pdfDocument.getPage(pageNumber);

        const textContent = await page.getTextContent();

        const embeddedText = extractPageText(
          textContent?.items ?? []
        );

        const embeddedCharacterCount = embeddedText
          .replace(/\s/g, '')
          .length;

        if (
          embeddedCharacterCount >= MIN_EMBEDDED_TEXT_CHARS
        ) {
          processedPages.push({
            pageNumber,
            extractionMethod: 'embedded_text',
            text: embeddedText,
            confidence: null,
          });

          continue;
        }

        // Insufficient embedded text indicates a potentially
        // scanned page. Render it and process the resulting image.
        let imageBuffer;

        try {
          imageBuffer = await renderPdfPageToPng(page);

          const ocrResult = await recognizeBillImage(
            imageBuffer,
            'image/png'
          );

          processedPages.push({
            pageNumber,
            extractionMethod: 'ocr',
            text: ocrResult.text,
            confidence: ocrResult.confidence,
          });
        } catch (error) {
          throw new BillPdfProcessingError(
            `OCR processing failed on PDF page ${pageNumber}.`,
            'PDF_PAGE_OCR_FAILED',
            error
          );
        }
      } finally {
        page?.cleanup?.();
      }
    }

    const pageMethods = [
      ...new Set(
        processedPages.map(
          (page) => page.extractionMethod
        )
      ),
    ];

    const confidenceValues = processedPages
      .filter(
        (page) =>
          page.extractionMethod === 'ocr' &&
          typeof page.confidence === 'number'
      )
      .map((page) => page.confidence);

    const ocrConfidence =
      confidenceValues.length > 0
        ? Number(
            (
              confidenceValues.reduce(
                (total, value) => total + value,
                0
              ) / confidenceValues.length
            ).toFixed(4)
          )
        : null;

    return {
      text: processedPages
        .map((page) => page.text)
        .filter(Boolean)
        .join('\n\n'),

      pageCount,

      extractionMethod:
        pageMethods.length === 1
          ? pageMethods[0]
          : 'mixed',

      ocrConfidence,

      pages: processedPages,
    };
  } catch (error) {
    if (error instanceof BillPdfProcessingError) {
      throw error;
    }

    if (error?.name === 'PasswordException') {
      throw new BillPdfProcessingError(
        'Password-protected PDFs are not supported.',
        'PDF_PASSWORD_REQUIRED',
        error
      );
    }

    if (
      error?.name === 'InvalidPDFException' ||
      error?.name === 'FormatError'
    ) {
      throw new BillPdfProcessingError(
        'The PDF document is invalid or corrupted.',
        'INVALID_PDF',
        error
      );
    }

    throw new BillPdfProcessingError(
      'Unable to process the PDF document.',
      'PDF_PROCESSING_FAILED',
      error
    );
  } finally {
    // Ensure PDF.js resources and workers are released.
    if (loadingTask?.destroy) {
      try {
        await loadingTask.destroy();
      } catch {
        // Do not replace the original processing result
        // or error with a secondary cleanup error.
      }
    }
  }
}