// packages/database/src/connection.ts

import mongoose, { Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

async function connectDB(): Promise<Mongoose> {
  // If already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // If connecting, wait for it
  if (mongoose.connection.readyState === 2) {
    await new Promise((resolve) => {
      mongoose.connection.once('connected', resolve);
    });
    return mongoose;
  }

  // Otherwise, create new connection WITH OPTIMIZED POOLING
  const opts = {
    bufferCommands: false,
    maxPoolSize: 100,              // ← INCREASE to 100 (safe with 500 limit)
    minPoolSize: 20,               // ← Keep 20 ready connections
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 10000,
    maxIdleTimeMS: 30000,          // ← Close idle after 30s
    waitQueueTimeoutMS: 5000,      // ← Fail fast if no connection available
    retryWrites: true,             // ← Automatic retry on write failures
    retryReads: true,              // ← Automatic retry on read failures
  };

  await mongoose.connect(MONGODB_URI, opts);
  console.log('✅ MongoDB connected with pool size:', opts.maxPoolSize);
  
  return mongoose;
}

export default connectDB;