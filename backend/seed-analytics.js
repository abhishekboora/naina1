import Analytics from './src/models/Analytics.js';
import connectDB from './src/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function seedAnalytics() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');
    
    // Delete existing analytics
    await Analytics.deleteMany({});
    console.log('Cleared existing analytics data');
    
    // Create 90 days of sample data
    const data = [];
    for (let i = 90; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const totalChats = Math.floor(Math.random() * 50) + 20;
      const completedChats = Math.floor(totalChats * (0.7 + Math.random() * 0.2));
      const conversions = Math.floor(completedChats * (0.1 + Math.random() * 0.15));
      
      data.push({
        tenantId: 'platform',
        date: date,
        totalChats: totalChats,
        completedChats: completedChats,
        abandonedChats: totalChats - completedChats,
        highIntentChats: Math.floor(totalChats * 0.25),
        mediumIntentChats: Math.floor(totalChats * 0.45),
        lowIntentChats: Math.floor(totalChats * 0.30),
        totalConversions: conversions,
        totalRevenue: conversions * (800 + Math.floor(Math.random() * 1500)),
        productsViewed: Math.floor(totalChats * (2 + Math.random() * 3)),
        stageBreakdown: {
          hook: Math.floor(totalChats * 0.95),
          engage: Math.floor(totalChats * 0.80),
          confirm: Math.floor(totalChats * 0.60),
          recommend: Math.floor(totalChats * 0.45),
          convert: conversions,
          support: Math.floor(totalChats * 0.10)
        }
      });
    }
    
    await Analytics.insertMany(data);
    
    console.log('\n✅ Analytics data seeded successfully!');
    console.log(`   Created ${data.length} days of sample data`);
    console.log('\n📊 Sample Stats:');
    console.log(`   Total Chats: ${data.reduce((sum, d) => sum + d.totalChats, 0)}`);
    console.log(`   Total Conversions: ${data.reduce((sum, d) => sum + d.totalConversions, 0)}`);
    console.log(`   Total Revenue: ₹${data.reduce((sum, d) => sum + d.totalRevenue, 0).toLocaleString()}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedAnalytics();
