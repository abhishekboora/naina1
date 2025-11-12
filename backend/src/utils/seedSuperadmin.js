import SuperAdmin from '../models/SuperAdmin.js';
import connectDB from '../db.js';
import dotenv from 'dotenv';

dotenv.config();

async function seedSuperadmin() {
  try {
    await connectDB();
    
    // Check if superadmin exists
    const existing = await SuperAdmin.findOne({ email: 'admin@naina.ai' });
    
    if (existing) {
      console.log('\n⚠️  Superadmin already exists!');
      console.log('   Email: admin@naina.ai');
      console.log('   You can login with the existing password\n');
      process.exit(0);
    }
    
    // Create new superadmin
    const admin = new SuperAdmin({
      email: 'admin@naina.ai',
      password: 'Admin@123',  // Will be hashed automatically
      name: 'Super Admin'
    });
    
    await admin.save();
    
    console.log('\n✅ Superadmin created successfully!\n');
    console.log('📧 Email: admin@naina.ai');
    console.log('🔑 Password: Admin@123');
    console.log('\n⚠️  IMPORTANT: Change this password after first login!\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error creating superadmin:', error.message);
    process.exit(1);
  }
}

seedSuperadmin();
