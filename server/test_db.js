import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const Chapter = mongoose.model('Chapter', new mongoose.Schema({}, {strict: false}), 'chapters');
    
    // Find chapters that have more than 0 pages
    const chapters = await Chapter.find({ 'pages.0': { $exists: true } }).sort({ _id: -1 }).limit(3);
    
    for (const c of chapters) {
      console.log(`\nChapter: ${c.title} (ManhwaID: ${c.manhwaId})`);
      console.log('Pages length:', c.pages.length);
      console.log('First 3 pages:');
      console.log(JSON.stringify(c.pages.slice(0, 3), null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
check();
