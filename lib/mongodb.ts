import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ormas_db';

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

const cached = global.mongooseCache ?? { conn: null, promise: null };
if (!global.mongooseCache) global.mongooseCache = cached;

export async function connectMongoDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: true,
      serverSelectionTimeoutMS: 10000,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export { mongoose };
