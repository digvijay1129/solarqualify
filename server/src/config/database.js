import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  if (!env.MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is missing. Configure it in server/.env.'
    );
  }

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    const { host, name } = mongoose.connection;

    console.log(
      `MongoDB connected successfully: ${host}/${name}`
    );

    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
}