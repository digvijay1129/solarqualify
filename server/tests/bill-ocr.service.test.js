import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(),
}));

import { createWorker } from 'tesseract.js';

import {
  recognizeBillImage,
  terminateBillOcrWorker,
} from '../src/modules/bill-analysis/bill-ocr.service.js';

describe('Bill OCR Service', () => {
  let worker;

  const imageBuffer = Buffer.from('fake-image-content');

  beforeEach(async () => {
    await terminateBillOcrWorker();

    vi.clearAllMocks();

    worker = {
      recognize: vi.fn(),
      terminate: vi.fn().mockResolvedValue(undefined),
    };

    createWorker.mockResolvedValue(worker);
  });

  afterEach(async () => {
    await terminateBillOcrWorker();
  });

  it('should recognize text from a JPEG bill image', async () => {
    worker.recognize.mockResolvedValue({
      data: {
        text: ' Consumer No: ABC123456 ',
        confidence: 92.5,
      },
    });

    const result = await recognizeBillImage(
      imageBuffer,
      'image/jpeg'
    );

    expect(createWorker).toHaveBeenCalledWith('eng');

    expect(worker.recognize).toHaveBeenCalledWith(
      imageBuffer
    );

    expect(result).toEqual({
      text: 'Consumer No: ABC123456',
      confidence: 0.925,
    });
  });

  it('should reuse the same OCR worker for multiple images', async () => {
    worker.recognize
      .mockResolvedValueOnce({
        data: {
          text: 'First bill',
          confidence: 90,
        },
      })
      .mockResolvedValueOnce({
        data: {
          text: 'Second bill',
          confidence: 85,
        },
      });

    await recognizeBillImage(
      imageBuffer,
      'image/jpeg'
    );

    await recognizeBillImage(
      imageBuffer,
      'image/png'
    );

    expect(createWorker).toHaveBeenCalledTimes(1);
    expect(worker.recognize).toHaveBeenCalledTimes(2);
  });

  it('should return null confidence when OCR does not provide one', async () => {
    worker.recognize.mockResolvedValue({
      data: {
        text: 'Some bill text',
      },
    });

    const result = await recognizeBillImage(
      imageBuffer,
      'image/png'
    );

    expect(result).toEqual({
      text: 'Some bill text',
      confidence: null,
    });
  });

  it('should return empty text when no text is detected', async () => {
    worker.recognize.mockResolvedValue({
      data: {
        text: '   ',
        confidence: 0,
      },
    });

    const result = await recognizeBillImage(
      imageBuffer,
      'image/webp'
    );

    expect(result).toEqual({
      text: '',
      confidence: 0,
    });
  });

  it('should reject an empty or invalid input buffer', async () => {
    await expect(
      recognizeBillImage(Buffer.alloc(0), 'image/jpeg')
    ).rejects.toThrow(
      'OCR input must be a non-empty document Buffer.'
    );

    await expect(
      recognizeBillImage('not-a-buffer', 'image/jpeg')
    ).rejects.toThrow(
      'OCR input must be a non-empty document Buffer.'
    );

    expect(createWorker).not.toHaveBeenCalled();
  });

  it('should reject PDF documents in the image OCR service', async () => {
    await expect(
      recognizeBillImage(
        Buffer.from('fake-pdf'),
        'application/pdf'
      )
    ).rejects.toThrow(
      'Image OCR supports JPEG, PNG and WebP documents only.'
    );

    expect(createWorker).not.toHaveBeenCalled();
  });

  it('should allow worker initialization to be retried after failure', async () => {
    createWorker
      .mockRejectedValueOnce(
        new Error('Worker initialization failed')
      )
      .mockResolvedValueOnce(worker);

    await expect(
      recognizeBillImage(imageBuffer, 'image/jpeg')
    ).rejects.toMatchObject({
      message: 'Bill image OCR processing failed.',
      cause: expect.any(Error),
    });

    worker.recognize.mockResolvedValue({
      data: {
        text: 'Retry successful',
        confidence: 80,
      },
    });

    await expect(
      recognizeBillImage(imageBuffer, 'image/jpeg')
    ).resolves.toEqual({
      text: 'Retry successful',
      confidence: 0.8,
    });

    expect(createWorker).toHaveBeenCalledTimes(2);
  });

  it('should wrap OCR recognition errors', async () => {
    worker.recognize.mockRejectedValue(
      new Error('Internal OCR engine error')
    );

    await expect(
      recognizeBillImage(imageBuffer, 'image/jpeg')
    ).rejects.toMatchObject({
      message: 'Bill image OCR processing failed.',
      cause: expect.any(Error),
    });
  });

  it('should terminate the shared OCR worker', async () => {
    worker.recognize.mockResolvedValue({
      data: {
        text: 'Test',
        confidence: 90,
      },
    });

    await recognizeBillImage(
      imageBuffer,
      'image/jpeg'
    );

    await terminateBillOcrWorker();

    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });
});