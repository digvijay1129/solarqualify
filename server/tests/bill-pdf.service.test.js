
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const {
  getDocumentMock,
  createCanvasMock,
  recognizeBillImageMock,
} = vi.hoisted(() => ({
  getDocumentMock: vi.fn(),
  createCanvasMock: vi.fn(),
  recognizeBillImageMock: vi.fn(),
}));

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument: getDocumentMock,
}));

vi.mock('@napi-rs/canvas', () => ({
  createCanvas: createCanvasMock,
}));

vi.mock(
  '../src/modules/bill-analysis/bill-ocr.service.js',
  () => ({
    recognizeBillImage: recognizeBillImageMock,
  })
);

import {
  BillPdfProcessingError,
  processBillPdf,
} from '../src/modules/bill-analysis/bill-pdf.service.js';

const PDF_BUFFER = Buffer.from(
  '%PDF-1.7\nTest document'
);

const PNG_BUFFER = Buffer.from('rendered-png-content');

function createPage(items = []) {
  return {
    getTextContent: vi.fn().mockResolvedValue({
      items,
    }),

    getViewport: vi.fn(({ scale }) => ({
      width: 600 * scale,
      height: 800 * scale,
    })),

    render: vi.fn().mockReturnValue({
      promise: Promise.resolve(),
    }),

    cleanup: vi.fn(),
  };
}

function createPdfDocument(pages) {
  const document = {
    numPages: pages.length,

    getPage: vi.fn(async (pageNumber) => {
      return pages[pageNumber - 1];
    }),
  };

  const loadingTask = {
    promise: Promise.resolve(document),
    destroy: vi.fn().mockResolvedValue(undefined),
  };

  getDocumentMock.mockReturnValue(loadingTask);

  return {
    document,
    loadingTask,
  };
}

function createTextItems() {
  return [
    {
      str: 'Consumer No:',
      transform: [1, 0, 0, 12, 10, 700],
      width: 72,
    },
    {
      str: 'ABC123456',
      transform: [1, 0, 0, 12, 86, 700],
      width: 60,
    },
    {
      str: 'Tariff Category:',
      transform: [1, 0, 0, 12, 10, 680],
      width: 82,
    },
    {
      str: 'LT-I Domestic',
      transform: [1, 0, 0, 12, 96, 680],
      width: 80,
    },
    {
      str: 'Sanctioned Load:',
      transform: [1, 0, 0, 12, 10, 660],
      width: 90,
    },
    {
      str: '3 kW',
      transform: [1, 0, 0, 12, 103, 660],
      width: 30,
    },
    {
      str: 'Units Consumed:',
      transform: [1, 0, 0, 12, 10, 640],
      width: 85,
    },
    {
      str: '340',
      transform: [1, 0, 0, 12, 100, 640],
      width: 20,
    },
  ];
}

describe('Bill PDF Processing Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getDocumentMock.mockReset();
    createCanvasMock.mockReset();
    recognizeBillImageMock.mockReset();

    createCanvasMock.mockImplementation((width, height) => {
      const context = {};

      return {
        width,
        height,

        getContext: vi.fn(() => context),

        toBuffer: vi.fn(() => PNG_BUFFER),
      };
    });
  });

  it('should reject an empty or invalid input buffer', async () => {
    await expect(
      processBillPdf(Buffer.alloc(0))
    ).rejects.toThrow(
      'PDF input must be a non-empty Buffer.'
    );

    await expect(
      processBillPdf('not-a-buffer')
    ).rejects.toThrow(
      'PDF input must be a non-empty Buffer.'
    );

    expect(getDocumentMock).not.toHaveBeenCalled();
  });

  it('should reject a document without a PDF signature', async () => {
    await expect(
      processBillPdf(Buffer.from('not a PDF document'))
    ).rejects.toMatchObject({
      name: 'BillPdfProcessingError',
      code: 'INVALID_PDF',
    });

    expect(getDocumentMock).not.toHaveBeenCalled();
  });

  it('should extract embedded text without invoking OCR', async () => {
    const page = createPage(createTextItems());

    const { loadingTask } = createPdfDocument([page]);

    const result = await processBillPdf(PDF_BUFFER);

    expect(getDocumentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        useSystemFonts: true,
        isEvalSupported: false,
        cMapPacked: true,
        CanvasFactory: expect.any(Function),
      })
    );

    expect(result.pageCount).toBe(1);

    expect(result.extractionMethod).toBe(
      'embedded_text'
    );

    expect(result.ocrConfidence).toBeNull();

    expect(result.text).toContain(
      'Consumer No: ABC123456'
    );

    expect(result.text).toContain(
      'Sanctioned Load: 3 kW'
    );

    expect(result.text).toContain(
      'Units Consumed: 340'
    );

    expect(result.pages[0]).toMatchObject({
      pageNumber: 1,
      extractionMethod: 'embedded_text',
      confidence: null,
    });

    expect(recognizeBillImageMock).not.toHaveBeenCalled();

    expect(page.cleanup).toHaveBeenCalledTimes(1);
    expect(loadingTask.destroy).toHaveBeenCalledTimes(1);
  });

  it('should render and OCR scanned PDF pages', async () => {
    const page = createPage([]);

    createPdfDocument([page]);

    recognizeBillImageMock.mockResolvedValue({
      text: 'Consumer No: ABC123456',
      confidence: 0.92,
    });

    const result = await processBillPdf(PDF_BUFFER);

    expect(createCanvasMock).toHaveBeenCalledWith(
      900,
      1200
    );

    expect(page.render).toHaveBeenCalledTimes(1);

    expect(recognizeBillImageMock).toHaveBeenCalledWith(
      PNG_BUFFER,
      'image/png'
    );

    expect(result.extractionMethod).toBe('ocr');

    expect(result.ocrConfidence).toBe(0.92);

    expect(result.text).toBe(
      'Consumer No: ABC123456'
    );

    expect(result.pages[0]).toMatchObject({
      pageNumber: 1,
      extractionMethod: 'ocr',
      confidence: 0.92,
    });
  });

  it('should process mixed digital and scanned PDF pages', async () => {
    const digitalPage = createPage(createTextItems());
    const scannedPage = createPage([]);

    createPdfDocument([
      digitalPage,
      scannedPage,
    ]);

    recognizeBillImageMock.mockResolvedValue({
      text: 'Units Consumed: 340',
      confidence: 0.88,
    });

    const result = await processBillPdf(PDF_BUFFER);

    expect(result.pageCount).toBe(2);

    expect(result.extractionMethod).toBe('mixed');

    expect(result.pages).toHaveLength(2);

    expect(result.pages[0].extractionMethod).toBe(
      'embedded_text'
    );

    expect(result.pages[1].extractionMethod).toBe(
      'ocr'
    );

    expect(result.ocrConfidence).toBe(0.88);

    expect(recognizeBillImageMock).toHaveBeenCalledTimes(1);
  });

  it('should average OCR confidence across scanned pages', async () => {
    const pages = [
      createPage([]),
      createPage([]),
    ];

    createPdfDocument(pages);

    recognizeBillImageMock
      .mockResolvedValueOnce({
        text: 'Page one',
        confidence: 0.9,
      })
      .mockResolvedValueOnce({
        text: 'Page two',
        confidence: 0.8,
      });

    const result = await processBillPdf(PDF_BUFFER);

    expect(result.ocrConfidence).toBe(0.85);
  });

  it('should reject PDFs containing more than 10 pages', async () => {
    const pages = Array.from(
      { length: 11 },
      () => createPage([])
    );

    const { document, loadingTask } =
      createPdfDocument(pages);

    await expect(
      processBillPdf(PDF_BUFFER)
    ).rejects.toMatchObject({
      name: 'BillPdfProcessingError',
      code: 'PDF_PAGE_LIMIT_EXCEEDED',
    });

    expect(document.getPage).not.toHaveBeenCalled();

    expect(loadingTask.destroy).toHaveBeenCalledTimes(1);
  });

  it('should reject invalid or corrupted PDF documents', async () => {
    const error = new Error('Invalid PDF structure');
    error.name = 'InvalidPDFException';

    const loadingTask = {
      promise: Promise.reject(error),
      destroy: vi.fn().mockResolvedValue(undefined),
    };

    getDocumentMock.mockReturnValue(loadingTask);

    await expect(
      processBillPdf(PDF_BUFFER)
    ).rejects.toMatchObject({
      name: 'BillPdfProcessingError',
      code: 'INVALID_PDF',
    });

    expect(loadingTask.destroy).toHaveBeenCalledTimes(1);
  });

  it('should reject password-protected PDFs', async () => {
    const error = new Error('Password required');
    error.name = 'PasswordException';

    const loadingTask = {
      promise: Promise.reject(error),
      destroy: vi.fn().mockResolvedValue(undefined),
    };

    getDocumentMock.mockReturnValue(loadingTask);

    await expect(
      processBillPdf(PDF_BUFFER)
    ).rejects.toMatchObject({
      name: 'BillPdfProcessingError',
      code: 'PDF_PASSWORD_REQUIRED',
    });
  });

  it('should report errors when scanned page OCR fails', async () => {
    const page = createPage([]);

    createPdfDocument([page]);

    recognizeBillImageMock.mockRejectedValue(
      new Error('OCR engine failed')
    );

    await expect(
      processBillPdf(PDF_BUFFER)
    ).rejects.toMatchObject({
      name: 'BillPdfProcessingError',
      code: 'PDF_PAGE_OCR_FAILED',
    });

    expect(page.cleanup).toHaveBeenCalledTimes(1);
  });

  it('should release PDF page resources after extraction', async () => {
    const page = createPage(createTextItems());

    const { loadingTask } = createPdfDocument([page]);

    await processBillPdf(PDF_BUFFER);

    expect(page.cleanup).toHaveBeenCalledTimes(1);
    expect(loadingTask.destroy).toHaveBeenCalledTimes(1);
  });

  it('should release the PDF document after a page-processing failure', async () => {
    const page = createPage([]);

    page.getTextContent.mockRejectedValue(
      new Error('Unable to read page text')
    );

    const { loadingTask } = createPdfDocument([page]);

    await expect(
      processBillPdf(PDF_BUFFER)
    ).rejects.toMatchObject({
      name: 'BillPdfProcessingError',
      code: 'PDF_PROCESSING_FAILED',
    });

    expect(page.cleanup).toHaveBeenCalledTimes(1);
    expect(loadingTask.destroy).toHaveBeenCalledTimes(1);
  });

  it('should expose a custom CanvasFactory with create, reset and destroy', async () => {
    const page = createPage([]);
    createPdfDocument([page]);

    recognizeBillImageMock.mockResolvedValue({
      text: 'Scanned bill',
      confidence: 0.9,
    });

    await processBillPdf(PDF_BUFFER);

    const options = getDocumentMock.mock.calls[0][0];
    const Factory = options.CanvasFactory;
    const factory = new Factory();

    expect(typeof factory.create).toBe('function');
    expect(typeof factory.reset).toBe('function');
    expect(typeof factory.destroy).toBe('function');

    const instance = factory.create(100, 200);

    expect(instance.canvas.width).toBe(100);
    expect(instance.canvas.height).toBe(200);

    factory.reset(instance, 300, 400);

    expect(instance.canvas.width).toBe(300);
    expect(instance.canvas.height).toBe(400);

    factory.destroy(instance);

    expect(instance.canvas).toBeNull();
    expect(instance.context).toBeNull();
  });
});
