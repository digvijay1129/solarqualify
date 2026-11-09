import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'node:crypto';
import { env } from '../../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

const encryptionKey = Buffer.from(
  env.DOCUMENT_ENCRYPTION_KEY,
  'base64'
);

export function encryptDocument(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new TypeError('Document content must be a non-empty Buffer.');
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, encryptionKey, iv);

  const encrypted = Buffer.concat([
    cipher.update(buffer),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encryptedBuffer: encrypted,
    encryption: {
      algorithm: ALGORITHM,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    },
  };
}

export function decryptDocument(encryptedBuffer, encryption) {
  if (!Buffer.isBuffer(encryptedBuffer) || encryptedBuffer.length === 0) {
    throw new TypeError('Encrypted document must be a non-empty Buffer.');
  }

  if (
    encryption?.algorithm !== ALGORITHM ||
    typeof encryption.iv !== 'string' ||
    typeof encryption.authTag !== 'string'
  ) {
    throw new TypeError('Invalid document encryption metadata.');
  }

  const iv = Buffer.from(encryption.iv, 'base64');
  const authTag = Buffer.from(encryption.authTag, 'base64');

  if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
    throw new TypeError('Invalid document encryption metadata.');
  }

  const decipher = createDecipheriv(ALGORITHM, encryptionKey, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(encryptedBuffer),
    decipher.final(),
  ]);
}