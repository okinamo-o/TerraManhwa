import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Manhwa from '../models/Manhwa.js';

async function research() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const list = await Manhwa.find({ latestChapter: { $gt: 10000 } }).select('title latestChapter slug');
    console.log(`Found ${list.length} items with buggy chapter numbers.`);
    if (list.length > 0) {
      console.log('Sample buggy items:');
      list.slice(0, 10).forEach(item => {
        console.log(`- ${item.title} (${item.latestChapter})`);
      });
    }
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}
research();
