import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import apiRoutes from './routes/index.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin: env.CLIENT_ORIGIN,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
// Public project status tokens are bearer credentials. Never write them to access logs.
morgan.token('safe-url', (req) => {
  const url = req.originalUrl ?? req.url ?? '';
  return url.replace(
    /(\/public\/project-status\/)[A-Za-z0-9_-]{43}(?=\?|$)/g,
    '$1[REDACTED]'
  );
});

const accessLogFormat = env.NODE_ENV === 'production'
  ? ':remote-addr - :method :safe-url :status :res[content-length] - :response-time ms'
  : ':method :safe-url :status :response-time ms';

app.use(morgan(accessLogFormat));

app.use(env.API_PREFIX, apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
