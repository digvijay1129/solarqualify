
import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { errorHandler } from '../src/middleware/errorHandler.js';
import { uploadBill } from '../src/modules/bills/bill-upload.middleware.js';

const app = express();

app.post('/upload', uploadBill, (req, res) => {
  return res.status(200).json({
    success: true,
    file: {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      detectedMimeType: req.file.detectedMimeType,
      detectedExtension: req.file.detectedExtension,
      size: req.file.size,
    },
  });
});

app.use(errorHandler);

const PDF_BUFFER = Buffer.from(
  '%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF'
);

const JPEG_BUFFER = Buffer.from([
  0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00,
]);

const PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47,
  0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52,
]);

const WEBP_BUFFER = Buffer.from(
  'RIFF\x00\x00\x00\x00WEBPVP8 '
);

describe('Bill Upload Middleware', () => {
  it('should accept a valid PDF document', async () => {
    const response = await request(app)
      .post('/upload')
      .attach('bill', PDF_BUFFER, {
        filename: 'electricity-bill.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(200);
    expect(response.body.file.detectedMimeType).toBe(
      'application/pdf'
    );
    expect(response.body.file.detectedExtension).toBe('pdf');
  });

  it('should accept a valid JPEG image', async () => {
    const response = await request(app)
      .post('/upload')
      .attach('bill', JPEG_BUFFER, {
        filename: 'electricity-bill.jpg',
        contentType: 'image/jpeg',
      });

    expect(response.status).toBe(200);
    expect(response.body.file.detectedMimeType).toBe('image/jpeg');
    expect(response.body.file.detectedExtension).toBe('jpg');
  });

  it('should accept a valid PNG image', async () => {
    const response = await request(app)
      .post('/upload')
      .attach('bill', PNG_BUFFER, {
        filename: 'electricity-bill.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(200);
    expect(response.body.file.detectedMimeType).toBe('image/png');
    expect(response.body.file.detectedExtension).toBe('png');
  });

  it('should accept a valid WebP image', async () => {
    const response = await request(app)
      .post('/upload')
      .attach('bill', WEBP_BUFFER, {
        filename: 'electricity-bill.webp',
        contentType: 'image/webp',
      });

    expect(response.status).toBe(200);
    expect(response.body.file.detectedMimeType).toBe('image/webp');
    expect(response.body.file.detectedExtension).toBe('webp');
  });

  it('should trust the actual file signature instead of browser MIME and extension', async () => {
    const response = await request(app)
      .post('/upload')
      .attach('bill', PDF_BUFFER, {
        filename: 'misleading-image.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(200);
    expect(response.body.file.originalName).toBe(
      'misleading-image.png'
    );
    expect(response.body.file.mimeType).toBe('application/pdf');
    expect(response.body.file.detectedExtension).toBe('pdf');
  });

  it('should reject a missing bill document', async () => {
    const response = await request(app).post('/upload');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'A bill document is required.'
    );
  });

  it('should reject an empty document', async () => {
    const response = await request(app)
      .post('/upload')
      .attach('bill', Buffer.alloc(0), {
        filename: 'empty.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(400);
  });

  it('should reject invalid document signatures', async () => {
    const response = await request(app)
      .post('/upload')
      .attach('bill', Buffer.from('not a real PDF'), {
        filename: 'fake.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(415);
    expect(response.body.message).toBe(
      'Unsupported or invalid document content.'
    );
  });

  it('should reject unsupported document types', async () => {
    const response = await request(app)
      .post('/upload')
      .attach('bill', Buffer.from('PK\x03\x04archive'), {
        filename: 'archive.zip',
        contentType: 'application/zip',
      });

    expect(response.status).toBe(415);
  });

  it('should reject files exceeding the configured size limit', async () => {
    const oversizedBuffer = Buffer.alloc(
      5 * 1024 * 1024 + 1
    );

    const response = await request(app)
      .post('/upload')
      .attach('bill', oversizedBuffer, {
        filename: 'oversized.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(413);
    expect(response.body.message).toBe(
      'Bill document exceeds the maximum allowed size.'
    );
  });

  it('should reject unexpected multipart field names', async () => {
    const response = await request(app)
      .post('/upload')
      .attach('document', PDF_BUFFER, {
        filename: 'bill.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'Upload exactly one file using the "bill" field.'
    );
  });

  it('should reject multiple uploaded files', async () => {
    const response = await request(app)
      .post('/upload')
      .attach('bill', PDF_BUFFER, {
        filename: 'bill-one.pdf',
        contentType: 'application/pdf',
      })
      .attach('bill', PDF_BUFFER, {
        filename: 'bill-two.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should reject additional multipart text fields', async () => {
    const response = await request(app)
      .post('/upload')
      .field('description', 'Electricity bill')
      .attach('bill', PDF_BUFFER, {
        filename: 'bill.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
