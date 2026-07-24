import mongoose from 'mongoose';
import { config } from './index.js';

export async function connectMongo() {
  try {
    await mongoose.connect(config.mongo.uri);
    console.log('✅ MongoDB Atlas connected');
  } catch (err) {
    console.error('❌ MongoDB Atlas connection error:', err.message);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB runtime error:', err.message);
  });
}
