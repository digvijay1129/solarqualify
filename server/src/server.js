import mongoose from 'mongoose';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';

async function startServer() {
  try {
    // Connect to MongoDB before accepting requests.
    await connectDatabase();

    const server = app.listen(env.PORT, () => {
      console.log(
        `SolarQualify API listening on http://127.0.0.1:${env.PORT}`
      );
      console.log(
        `Health check: http://127.0.0.1:${env.PORT}${env.API_PREFIX}/health`
      );
    });

    function shutdown(signal) {
      console.log(
        `${signal} received. Shutting down SolarQualify API...`
      );

      server.close(async (error) => {
        if (error) {
          console.error('Error while closing API server:', error);
          process.exitCode = 1;
        }

        try {
          await mongoose.disconnect();
          console.log('MongoDB disconnected successfully.');
        } catch (disconnectError) {
          console.error(
            'Error while disconnecting MongoDB:',
            disconnectError.message
          );
          process.exitCode = 1;
        }
      });
    }

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));

    return server;
  } catch (error) {
    console.error('Unable to start SolarQualify API:', error.message);
    process.exitCode = 1;
    return null;
  }
}

const server = await startServer();

export default server;