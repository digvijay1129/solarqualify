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
const allowedEnvironments = new Set(['development', 'test', 'production']);

if (!allowedEnvironments.has(nodeEnv)) {
  throw new Error('NODE_ENV must be development, test, or production.');
}

export const env = Object.freeze({
  NODE_ENV: nodeEnv,
  PORT: parsedPort,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? 'http://127.0.0.1:5173',
  API_PREFIX: '/api/v1',
});
