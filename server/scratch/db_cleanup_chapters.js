import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Manhwa from '../models/Manhwa.js';

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for cleanup');
    
    // Reset any latestChapter that is realistically impossible
    const result = await Manhwa.updateMany(
      { latestChapter: { $gt: 10000 } },
      { $set: { latestChapter: 0 } }
    );
    
    console.log(`🧹 Cleaned up ${result.modifiedCount} manhwa entries.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}
cleanup();
