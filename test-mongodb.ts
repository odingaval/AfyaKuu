// test-mongodb.ts
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testMongoDBConnection() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env file');
    process.exit(1);
  }

  console.log('🔍 Testing MongoDB connection...');
  console.log(`🔗 Connection string: ${process.env.MONGODB_URI.replace(/:([^:]*?)@/, ':*****@')}`);

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as any);

    console.log('Successfully connected to MongoDB');
    
    // List all collections in the database
    const db = mongoose.connection.db;
    if (db) {
      const collections = await db.listCollections().toArray();
      console.log('\n Collections in the database:');
      collections.forEach((collection: any) => {
        console.log(`- ${collection.name}`);
      });

      // Check if users collection exists
      const userCollections = collections.filter((c: any) => c.name === 'users');
      if (userCollections.length > 0) {
        console.log('\nUsers collection exists. Fetching sample user...');
        const User = mongoose.model('User', new mongoose.Schema({}));
        const sampleUser = await User.findOne();
        console.log('Sample user:', sampleUser || 'No users found');
      } else {
        console.log('\n Users collection does not exist yet.');
      }
    }

  } catch (error: any) {
    console.error('Failed to connect to MongoDB:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\nMongoDB connection closed');
    }
  }
}

// Run the test
testMongoDBConnection().catch(console.error);