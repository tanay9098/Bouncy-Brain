import mongoose from 'mongoose';

let cachedPromise: Promise<typeof mongoose> | null = null;

export async function connectMongoDB(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;

  if (cachedPromise) {
    await cachedPromise;
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not defined');

  cachedPromise = mongoose.connect(uri, { bufferCommands: false });

  try {
    await cachedPromise;
    console.log('[MongoDB] Connected');
  } catch (err) {
    cachedPromise = null;
    throw err;
  }
}
