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

  // Otherwise, create new connection
  const opts = {
    bufferCommands: false,
  };

  await mongoose.connect(MONGODB_URI, opts);
  console.log('✅ MongoDB connected');
  
  return mongoose;
}

export default connectDB;