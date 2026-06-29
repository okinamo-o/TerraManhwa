import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Manhwa from '../models/Manhwa.js';

dotenv.config({ path: './server/.env' });

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const sample = await Manhwa.find({}, 'title author artist slug').limit(10);
    console.log('DB Sample:', JSON.stringify(sample, null, 2));
  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

check();
