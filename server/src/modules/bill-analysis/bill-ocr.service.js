import { createWorker } from 'tesseract.js';

const OCR_LANGUAGE = 'eng';

const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

let workerPromise = null;

function getOcrWorker() {
  if (!workerPromise) {
    workerPromise = createWorker(OCR_LANGUAGE).catch((error) => {
      // Allow a future request to retry worker initialization.
      workerPromise = null;
      throw error;
    });
  }

  return workerPromise;
}

function normalizeConfidence(value) {
  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value > 100
  ) {
    return null;
  }

  // Tesseract reports confidence as a percentage.
  return Number((value / 100).toFixed(4));
}

/**
 * Recognizes text from an electricity-bill image.
 *
 * Supported formats:
 * JPEG, PNG and WebP.
 *
 * PDF processing is handled in a separate pipeline.
 */
export async function recognizeBillImage(buffer, documentType) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new TypeError(
      'OCR input must be a non-empty document Buffer.'
    );
  }

  if (!SUPPORTED_IMAGE_TYPES.has(documentType)) {
    throw new TypeError(
      'Image OCR supports JPEG, PNG and WebP documents only.'
    );
  }

  try {
    const worker = await getOcrWorker();

    const result = await worker.recognize(buffer);

    const text =
      typeof result?.data?.text === 'string'
        ? result.data.text.trim()
        : '';

    const confidence = normalizeConfidence(
      result?.data?.confidence
    );

    return {
      text,
      confidence,
    };
  } catch (error) {
    throw new Error(
      'Bill image OCR processing failed.',
      { cause: error }
    );
  }
}

/**
 * Terminates the shared OCR worker.
 *
 * Call this during graceful application shutdown.
 */
export async function terminateBillOcrWorker() {
  const currentWorkerPromise = workerPromise;

  workerPromise = null;

  if (!currentWorkerPromise) {
    return;
  }

  let worker;

  try {
    worker = await currentWorkerPromise;
  } catch {
    // The worker failed during initialization.
    // There is nothing to terminate.
    return;
  }

  await worker.terminate();
}