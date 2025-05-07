import mongoose from 'mongoose';

type ConnectionCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env file'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during development.
 */
let cached = (global as any).mongoose as ConnectionCache;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    console.log('Using cached database connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable Mongoose's buffering mechanism
      // useNewUrlParser: true, // No longer needed in new Mongoose versions
      // useUnifiedTopology: true, // No longer needed
    };

    console.log('Creating new database connection promise');
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
      console.log('Database connected successfully');
      return mongooseInstance;
    }).catch(err => {
      console.error('Database connection error:', err);
      cached.promise = null; // Reset promise on error to allow retry
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // Reset promise on error
    throw e;
  }
  
  return cached.conn;
}

export default connectToDatabase;
