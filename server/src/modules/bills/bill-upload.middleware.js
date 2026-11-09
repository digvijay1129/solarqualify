
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/AppError.js';

const MAX_UPLOAD_BYTES = env.MAX_UPLOAD_MB * 1024 * 1024;

const ALLOWED_DOCUMENT_TYPES = new Map([
  ['application/pdf', 'pdf'],
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 1,
    fields: 0,
    parts: 1,
    fieldNameSize: 100,
  },
});

const parseBillUpload = upload.single('bill');

function normalizeMulterError(error) {
  if (!(error instanceof multer.MulterError)) {
    return error;
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    return new AppError(
      'Bill document exceeds the maximum allowed size.',
      413
    );
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError(
      'Upload exactly one file using the "bill" field.',
      400
    );
  }

  if (
    error.code === 'LIMIT_FILE_COUNT' ||
    error.code === 'LIMIT_PART_COUNT' ||
    error.code === 'LIMIT_FIELD_COUNT' ||
    error.code === 'LIMIT_FIELD_KEY' ||
    error.code === 'LIMIT_FIELD_VALUE'
  ) {
    return new AppError(
      'Invalid upload request. Only one bill document is allowed.',
      400
    );
  }

  return new AppError('Invalid bill upload request.', 400);
}

async function validateBillSignature(req) {
  if (!req.file) {
    throw new AppError('A bill document is required.', 400);
  }

  if (
    !Buffer.isBuffer(req.file.buffer) ||
    req.file.buffer.length === 0
  ) {
    throw new AppError('Uploaded document is empty.', 400);
  }

  const detectedType = await fileTypeFromBuffer(req.file.buffer);

  if (!detectedType) {
    throw new AppError(
      'Unsupported or invalid document content.',
      415
    );
  }

  const detectedExtension = ALLOWED_DOCUMENT_TYPES.get(
    detectedType.mime
  );

  if (!detectedExtension) {
    throw new AppError(
      'Only PDF, JPEG, PNG, and WebP documents are allowed.',
      415
    );
  }

  // Replace the browser-provided MIME type with the detected MIME type.
  req.file.mimetype = detectedType.mime;

  // Store the trusted extension separately.
  req.file.detectedExtension = detectedExtension;
  req.file.detectedMimeType = detectedType.mime;
}

export function uploadBill(req, res, next) {
  parseBillUpload(req, res, async (error) => {
    if (error) {
      return next(normalizeMulterError(error));
    }

    try {
      await validateBillSignature(req);
      return next();
    } catch (validationError) {
      return next(validationError);
    }
  });
}
