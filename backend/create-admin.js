import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define Schema
const superAdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  role: { type: String, default: 'superadmin' },
  createdAt: { type: Date, default: Date.now }
});

const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema);

async function createAdmin() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    console.log('URI:', process.env.MONGO_URI ? 'Found' : '❌ Missing in .env');
    
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('✅ Connected to MongoDB Atlas');

    // Check if admin exists
    const existing = await SuperAdmin.findOne({ email: 'admin@naina.ai' });
    
    if (existing) {
      console.log('\n⚠️  Admin already exists. Deleting...');
      await SuperAdmin.deleteOne({ email: 'admin@naina.ai' });
      console.log('✅ Old admin deleted');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    // Create new admin
    const admin = new SuperAdmin({
      email: 'admin@naina.ai',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'superadmin'
    });

    await admin.save();
    
    console.log('\n🎉 SUPERADMIN CREATED SUCCESSFULLY!\n');
    console.log('┌─────────────────────────────────┐');
    console.log('│  Login Credentials:             │');
    console.log('│  📧 Email: admin@naina.ai       │');
    console.log('│  🔑 Password: Admin@123         │');
    console.log('└─────────────────────────────────┘\n');
    console.log('✅ You can now login at: http://localhost:3000/admin/login\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.error('\n⚠️  MongoDB Atlas Authentication Failed');
      console.error('   Check your username/password in .env');
    }
    
    if (error.message.includes('ENOTFOUND')) {
      console.error('\n⚠️  Cannot reach MongoDB Atlas');
      console.error('   Check your internet connection');
      console.error('   Verify cluster URL in .env');
    }
    
    process.exit(1);
  }
}

// Run the function
createAdmin();
