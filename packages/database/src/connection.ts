// packages/database/src/connection.ts

/// <reference types="node" />

import mongoose, { Mongoose, ConnectOptions } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

declare global {
  var mongoose: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
  };
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB(): Promise<Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    // ✅ SECURITY FIX: Disable automatic index creation globally
    mongoose.set('autoIndex', false);

    const opts: ConnectOptions = {
      bufferCommands: true, // Allow buffering until connection is ready
      maxPoolSize: 100,
      minPoolSize: 10,
      socketTimeoutMS: 60000,
      serverSelectionTimeoutMS: 30000,
      maxIdleTimeMS: 60000,
      waitQueueTimeoutMS: 30000, // Significant increase to avoid timeouts under load
      retryWrites: true,
      retryReads: true,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      console.log('✅ MongoDB connected (autoIndex: OFF - manual indexes required)');
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
