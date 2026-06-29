import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Manhwa from '../models/Manhwa.js';

dotenv.config({ path: './server/.env' });

async function find() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const found = await Manhwa.findOne({ title: /Terminally-Ill Genius Dark Knight/i }, 'title slug');
    console.log('Found:', JSON.stringify(found));
  } catch (err) {
    console.error('Find failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

find();
