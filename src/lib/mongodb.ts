import mongoose from 'mongoose';

type ConnectionCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

// Ensure the MONGODB_URI is read and trimmed.
const MONGODB_URI = process.env.MONGODB_URI?.trim();

if (!MONGODB_URI) {
  const errorMessage = 'Error: MONGODB_URI environment variable is not defined or is empty. Please define it in your .env file (e.g., MONGODB_URI="mongodb://localhost:27017/mydatabase").';
  console.error(errorMessage);
  // For server-side errors that should halt execution if critical config is missing
  if (typeof window === 'undefined') {
    throw new Error(errorMessage);
  }
}
// console.log(`MongoDB URI from env: '${MONGODB_URI}'`); // Debugging line

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
    // console.log('Using cached database connection.');
    return cached.conn;
  }

  if (!MONGODB_URI) {
    // This case should ideally be caught by the initial check, but as a safeguard:
    const errorMsg = "MongoDB URI is not configured. Cannot connect to database.";
    console.error(errorMsg);
    // Avoid throwing here directly if called multiple times, let the initial check handle startup failure.
    // Or, if this function is the single point of truth for connection, throwing is appropriate.
    // For now, let's ensure the promise is null and an error is thrown if no promise can be made.
     cached.promise = null;
     throw new Error(errorMsg);
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, 
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    // console.log(`Attempting to connect to MongoDB with URI: ${MONGODB_URI}`);
    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log('MongoDB connected successfully.');
        return mongooseInstance;
      })
      .catch(err => {
        console.error('MongoDB connection error:', err.message);
        // console.error('Full error object:', err);
        
        // Mask credentials in URI for logging
        let uriToLog = MONGODB_URI;
        try {
            const parsedUri = new URL(MONGODB_URI);
            if (parsedUri.username || parsedUri.password) {
                parsedUri.username = '****';
                parsedUri.password = '****';
                uriToLog = parsedUri.toString();
            }
        } catch (parseError) {
            // If URI is invalid, log a generic message or the original URI carefully
            // console.error("Could not parse MONGODB_URI for safe logging:", parseError);
        }
        console.error(`Failed to connect with MONGODB_URI (credentials masked if present): ${uriToLog}`);
        console.error("Please ensure your MongoDB server is running and the MONGODB_URI in your .env file is correct.");
        
        cached.conn = null; // Explicitly set conn to null on error
        cached.promise = null; // Reset promise on error to allow retry
        throw err; // Re-throw the error to be caught by the caller
      });
  }

  try {
    // console.log('Awaiting MongoDB connection promise...');
    cached.conn = await cached.promise;
  } catch (e: any) {
    // console.error('Failed to establish MongoDB connection:', e.message);
    cached.promise = null; // Reset promise on error
    cached.conn = null; // Ensure connection is null
    throw e; // Re-throw to indicate connection failure
  }
  
  if (!cached.conn) {
    // This should ideally not be reached if errors are thrown correctly above
    const errorMsg = "MongoDB connection failed and cached.conn is null.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  return cached.conn;
}

export default connectToDatabase;
