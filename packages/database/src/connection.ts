// packages/database/src/connection.ts

/// <reference types="node" />

import mongoose, { Mongoose, ConnectOptions } from "mongoose";

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
    await new Promise<void>((resolve) => {
      mongoose.connection.once('connected', () => resolve());
    });
    return mongoose;
  }

  // ✅ SECURITY FIX: Disable automatic index creation globally
  mongoose.set('autoIndex', false);

  // Otherwise, create new connection WITH OPTIMIZED POOLING
  const opts: ConnectOptions = {
    bufferCommands: false,
    maxPoolSize: 100,
    minPoolSize: 20,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 10000,
    maxIdleTimeMS: 30000,
    waitQueueTimeoutMS: 5000,
    retryWrites: true,
    retryReads: true,
  };

  await mongoose.connect(MONGODB_URI, opts);
  console.log('✅ MongoDB connected (autoIndex: OFF - manual indexes required)');
  
  return mongoose;
}

export default connectDB;
