import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ScrapeLog from '../models/ScrapeLog.js';

dotenv.config({ path: './server/.env' });

async function checkLogs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const logs = await ScrapeLog.find({}).sort({ createdAt: -1 }).limit(20);
    console.log('Recent Logs:', JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

checkLogs();
