import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkLogs() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://louayhamdi438:frivE789456123@cluster0.zox9c.mongodb.net/TerraManhwa?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    
    const ScrapeLog = mongoose.model('ScrapeLog', new mongoose.Schema({}, {strict: false}));
    
    console.log('--- LATEST ERROR LOGS ---');
    const logs = await ScrapeLog.find({ status: 'error' }).sort({ createdAt: -1 }).limit(10);
    
    if (logs.length === 0) {
      console.log('No error logs found in database.');
    } else {
      logs.forEach(log => {
        console.log(`[${log.createdAt}] ${log.type}: ${log.message}`);
      });
    }

  } catch (err) {
    console.error('Failed to connect or query:', err.message);
  } finally {
    process.exit();
  }
}
checkLogs();
