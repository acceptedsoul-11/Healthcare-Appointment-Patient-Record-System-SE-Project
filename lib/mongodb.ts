
import mongoose, { type Mongoose } from "mongoose";

function getMongoURI(): string {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Please define MONGODB_URI in .env.local");
  }

  return uri;
}

const MONGODB_URI = getMongoURI();

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

type MongooseCache = {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached = (globalThis.mongooseCache ??= {
  conn: null,
  promise: null,
});

export async function connectDB(): Promise<Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}
