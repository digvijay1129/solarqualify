import app from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.PORT, () => {
  console.log(`SolarQualify API listening on http://127.0.0.1:${env.PORT}`);
  console.log(`Health check: http://127.0.0.1:${env.PORT}${env.API_PREFIX}/health`);
});

function shutdown(signal) {
  console.log(`${signal} received. Shutting down SolarQualify API...`);
  server.close((error) => {
    if (error) {
      console.error('Error while closing the API server:', error);
      process.exitCode = 1;
    }
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export default server;
