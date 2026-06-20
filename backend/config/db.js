const mongoose = require('mongoose');
// MongoMemoryServer imported dynamically when needed

let mongoServer;
let connectingPromise = null;

const connectDB = async () => {
  if (connectingPromise) {
    return connectingPromise;
  }

  connectingPromise = (async () => {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    try {
      let mongoUri = process.env.MONGO_URI;

      // Start in-memory MongoDB for testing, or if no URI is set, or if it's the default offline localhost URI
      if (process.env.NODE_ENV === 'test' || !mongoUri || mongoUri.includes('127.0.0.1:62300') || mongoUri.includes('localhost:27017')) {
        console.log('🌱 Starting in-memory MongoDB server for development/testing...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoServer = await MongoMemoryServer.create();
        mongoUri = mongoServer.getUri();
        console.log(`🌱 In-memory MongoDB URI: ${mongoUri}`);
      }

      const conn = await mongoose.connect(mongoUri);
      console.log(`MongoDB Connected: ${conn.connection.host}`);

      // Auto-seed if database is empty or in dev/test mode
      const User = require('../models/User');
      const userCount = await User.countDocuments().catch(() => 0);
      
      if (userCount === 0 || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        try {
          const seed = require('../utils/seedData');
          console.log('🌱 Seeding demo data...');
          await seed(true);
        } catch (seedErr) {
          console.error(`🌱 Seeding failed: ${seedErr.message}`);
        }
      }

      return conn;
    } catch (error) {
      console.error(`MongoDB Connection Error: ${error.message}`);
      process.exit(1);
    }
  })();

  return connectingPromise;
};

const closeDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
      console.log('🌱 In-memory MongoDB stopped.');
    }
    connectingPromise = null;
  } catch (error) {
    console.error(`Error closing MongoDB: ${error.message}`);
  }
};

module.exports = { connectDB, closeDB };
