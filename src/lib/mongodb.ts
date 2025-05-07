import mongoose from 'mongoose';

type ConnectionCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

const MONGODB_URI = process.env.MONGODB_URI?.trim();

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not defined or is empty after trimming.');
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env file with a valid connection string.'
  );
}
// console.log('Attempting to connect to MongoDB with URI:', MONGODB_URI); // For debugging

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
    // console.log('Using cached database connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable Mongoose's buffering mechanism
      // useNewUrlParser: true, // No longer needed in new Mongoose versions
      // useUnifiedTopology: true, // No longer needed
    };

    // console.log('Creating new database connection promise');
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
      console.log('Database connected successfully');
      return mongooseInstance;
    }).catch(err => {
      console.error('Database connection error:', err);
      // Log the URI that caused the error, but be careful with sensitive info in real logs
      // Avoid logging the full URI if it contains credentials in a production environment
      const uriToLog = MONGODB_URI!.includes('@') ? MONGODB_URI!.substring(0, MONGODB_URI!.indexOf('//') + 2) + '****:****@' + MONGODB_URI!.substring(MONGODB_URI!.indexOf('@') + 1) : MONGODB_URI;
      console.error('Failed to connect with MONGODB_URI (credentials masked if present):', uriToLog);
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
