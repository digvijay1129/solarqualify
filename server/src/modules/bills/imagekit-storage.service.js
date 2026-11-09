import ImageKit, { toFile } from '@imagekit/nodejs';
import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';

let imageKitClient;

const STORAGE_FOLDER = '/solarqualify/bills';
const MAX_DOCUMENT_BYTES = (env.MAX_UPLOAD_MB || 10) * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 20_000;

const ALLOWED_EXTENSIONS = new Set([
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'webp',
]);

function getImageKitClient() {
  if (imageKitClient) {
    return imageKitClient;
  }

  if (!env.IMAGEKIT_PRIVATE_KEY) {
    throw new Error('ImageKit private key is not configured.');
  }

  imageKitClient = new ImageKit({
    privateKey: env.IMAGEKIT_PRIVATE_KEY,
  });

  return imageKitClient;
}

function validateExpiry(expireSeconds) {
  if (
    !Number.isInteger(expireSeconds) ||
    expireSeconds < 30 ||
    expireSeconds > 900
  ) {
    throw new TypeError(
      'URL expiry must be between 30 and 900 seconds.'
    );
  }
}

function validateStoragePath(filePath) {
  const prefix = `${STORAGE_FOLDER}/`;

  if (
    typeof filePath !== 'string' ||
    !filePath.startsWith(prefix) ||
    filePath.includes('..') ||
    /[?#\\%]/.test(filePath)
  ) {
    throw new TypeError('Invalid ImageKit document path.');
  }

  const filename = filePath.slice(prefix.length);

  if (
    !/^[0-9a-f-]{36}\.(pdf|jpe?g|png|webp)$/i.test(filename)
  ) {
    throw new TypeError('Invalid ImageKit document filename.');
  }
}

export async function uploadEncryptedDocument(buffer, extension) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new TypeError(
      'Document content must be a non-empty Buffer.'
    );
  }

  if (buffer.length > MAX_DOCUMENT_BYTES) {
    throw new RangeError('Document exceeds the maximum upload size.');
  }

  const normalizedExtension =
    typeof extension === 'string'
      ? extension.trim().toLowerCase().replace(/^\./, '')
      : '';

  if (!ALLOWED_EXTENSIONS.has(normalizedExtension)) {
    throw new TypeError('Unsupported document extension.');
  }

  const client = getImageKitClient();
  const fileName = `${randomUUID()}.${normalizedExtension}`;

  const result = await client.files.upload({
    file: await toFile(buffer, fileName),
    fileName,
    folder: STORAGE_FOLDER,
    useUniqueFileName: false,
    isPrivateFile: true,
    responseFields: ['isPrivateFile'],
  });

  if (
    !result.fileId ||
    !result.filePath ||
    result.isPrivateFile !== true
  ) {
    if (result.fileId) {
      try {
        await client.files.delete(result.fileId);
      } catch (cleanupError) {
        throw new AggregateError(
          [
            new Error(
              'ImageKit did not confirm private document storage.'
            ),
            cleanupError,
          ],
          'Upload validation failed and ImageKit cleanup also failed.'
        );
      }
    }

    throw new Error(
      'ImageKit did not confirm the required private document metadata.'
    );
  }

  try {
    validateStoragePath(result.filePath);
  } catch (error) {
    try {
      await client.files.delete(result.fileId);
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        'Invalid ImageKit path and remote cleanup failed.'
      );
    }

    throw error;
  }

  return {
    storageProvider: 'imagekit',
    storageFileId: result.fileId,
    storagePath: result.filePath,
    documentSize: buffer.length,
    storageFileType: result.fileType,
  };
}

export async function deleteStoredDocument(fileId) {
  if (typeof fileId !== 'string' || !fileId.trim()) {
    throw new TypeError('A valid ImageKit file ID is required.');
  }

  try {
    return await getImageKitClient().files.delete(fileId.trim());
  } catch (error) {
    // A previous deletion may have succeeded even if the
    // application did not complete its MongoDB cleanup.
    // ImageKit's 404 means this file ID no longer exists.
    if (error?.status === 404) {
      return { alreadyDeleted: true };
    }

    throw error;
  }
}

/**
 * Downloads the encrypted document on the server.
 * The caller must decrypt the returned Buffer before serving it.
 * Never expose the generated signed URL to the browser.
 */
export async function downloadEncryptedDocument(
  filePath,
  expireSeconds = 300
) {
  validateStoragePath(filePath);
  validateExpiry(expireSeconds);

  if (!env.IMAGEKIT_URL_ENDPOINT) {
    throw new Error('ImageKit URL endpoint is not configured.');
  }

  const client = getImageKitClient();

  const signedUrl = client.helper.buildSrc({
    urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
    src: filePath,
    signed: true,
    expiresIn: expireSeconds,
  });

  const response = await fetch(signedUrl, {
    signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(
      `ImageKit document download failed with status ${response.status}.`
    );
  }

  const contentLength = Number(
    response.headers.get('content-length')
  );

  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_DOCUMENT_BYTES
  ) {
    throw new RangeError(
      'Stored document exceeds the maximum allowed size.'
    );
  }

  const encryptedBuffer = Buffer.from(
    await response.arrayBuffer()
  );

  if (
    encryptedBuffer.length === 0 ||
    encryptedBuffer.length > MAX_DOCUMENT_BYTES
  ) {
    throw new RangeError(
      'Downloaded document is empty or exceeds the allowed size.'
    );
  }

  return encryptedBuffer;
}