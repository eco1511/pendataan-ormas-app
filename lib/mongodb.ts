import mongoose from 'mongoose';

const LOCAL_MONGODB_URI = 'mongodb://127.0.0.1:27017/ormas_db';

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

const cached = global.mongooseCache ?? { conn: null, promise: null };
if (!global.mongooseCache) global.mongooseCache = cached;

export async function connectMongoDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const uri = process.env.MONGODB_URI?.trim() || LOCAL_MONGODB_URI;
    cached.promise = mongoose.connect(uri, {
      bufferCommands: true,
      serverSelectionTimeoutMS: 10000,
    }).catch((error) => {
      cached.promise = null;
      throw error;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export { mongoose };
