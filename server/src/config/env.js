import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const envFilePath = resolve(currentDirectory, '../../.env');

dotenv.config({ path: envFilePath });

const parsedPort = Number(process.env.PORT ?? 5000);

if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

const nodeEnv = process.env.NODE_ENV ?? 'development';

const allowedEnvironments = new Set([
  'development',
  'test',
  'production',
]);

if (!allowedEnvironments.has(nodeEnv)) {
  throw new Error('NODE_ENV must be development, test, or production.');
}

const jwtSecret = process.env.JWT_SECRET?.trim() ?? '';

if (jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must contain at least 32 characters.');
}

const jwtExpiresIn = process.env.JWT_EXPIRES_IN?.trim() || '1h';

const maxUploadMb = Number(process.env.MAX_UPLOAD_MB ?? 5);

if (!Number.isFinite(maxUploadMb) || maxUploadMb <= 0 || maxUploadMb > 20) {
  throw new Error('MAX_UPLOAD_MB must be greater than 0 and no more than 20.');
}

const documentEncryptionKey =
  process.env.DOCUMENT_ENCRYPTION_KEY?.trim() ?? '';

const encryptionKeyBytes = Buffer.from(documentEncryptionKey, 'base64');

if (
  !documentEncryptionKey ||
  encryptionKeyBytes.length !== 32 ||
  encryptionKeyBytes.toString('base64') !== documentEncryptionKey
) {
  throw new Error(
    'DOCUMENT_ENCRYPTION_KEY must be a valid base64-encoded 32-byte key.'
  );
}

export const env = Object.freeze({
  NODE_ENV: nodeEnv,
  PORT: parsedPort,
  CLIENT_ORIGIN:
    process.env.CLIENT_ORIGIN ?? 'http://127.0.0.1:5173',
  API_PREFIX: '/api/v1',
  MONGODB_URI: process.env.MONGODB_URI?.trim() ?? '',
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: jwtExpiresIn,
  MAX_UPLOAD_MB: maxUploadMb,
  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY?.trim() ?? '',
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY?.trim() ?? '',
  IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT?.trim() ?? '',
  DOCUMENT_ENCRYPTION_KEY: documentEncryptionKey,
});