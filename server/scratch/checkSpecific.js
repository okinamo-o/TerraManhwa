import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Manhwa from '../models/Manhwa.js';
import Chapter from '../models/Chapter.js';

dotenv.config({ path: './server/.env' });

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const m = await Manhwa.findOne({ slug: 'the-villains-precious-daughter' });
    if (!m) {
      console.log('Manhwa not found');
      return;
    }
    const count = await Chapter.countDocuments({ manhwaId: m._id });
    console.log(`Manhwa: ${m.title}`);
    console.log(`Chapters count: ${count}`);
    console.log(`Source URL: ${m.sourceUrl}`);
  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

check();
