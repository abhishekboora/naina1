import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

async function cleanDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Drop collections
    try {
      await mongoose.connection.db.collection('products').drop();
      console.log('✅ Products collection dropped');
    } catch (e) {
      console.log('ℹ️  Products collection doesn\'t exist or already empty');
    }

    try {
      await mongoose.connection.db.collection('policies').drop();
      console.log('✅ Policies collection dropped');
    } catch (e) {
      console.log('ℹ️  Policies collection doesn\'t exist or already empty');
    }

    console.log('✅ Database cleaned successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanDatabase();
