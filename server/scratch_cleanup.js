import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../server/.env') });

const ManhwaSchema = new mongoose.Schema({ 
  title: String, 
  slug: String, 
  latestChapter: Number,
  chapters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' }]
});

const ChapterSchema = new mongoose.Schema({
  manhwaId: mongoose.Schema.Types.ObjectId,
  chapterNumber: Number
});

async function run() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/terramanhwa';
    await mongoose.connect(mongoUri);
    
    const Manhwa = mongoose.model('Manhwa', ManhwaSchema);
    const Chapter = mongoose.model('Chapter', ChapterSchema);
    
    const m = await Manhwa.findOne({ title: /Beginning After the End/i });
    if (!m) {
      console.log('MANHWA_NOT_FOUND');
      return;
    }

    console.log('Found Manhwa:', m.title);

    // 1. Delete Chapter 1000
    const deleted = await Chapter.findOneAndDelete({ manhwaId: m._id, chapterNumber: 1000 });
    if (deleted) {
      console.log('Deleted Chapter 1000 document');
    } else {
      console.log('Chapter 1000 not found');
    }

    // 2. Remove reference from Manhwa
    if (deleted) {
      m.chapters = m.chapters.filter(id => !id.equals(deleted._id));
      await m.save();
      console.log('Removed Chapter 1000 reference from Manhwa record');
    }

    // 3. Recalculate latestChapter
    const remainingChapters = await Chapter.find({ manhwaId: m._id }).sort({ chapterNumber: -1 });
    const newLatest = remainingChapters.length > 0 ? remainingChapters[0].chapterNumber : 0;
    
    m.latestChapter = newLatest;
    await m.save();
    console.log('Updated latestChapter to:', newLatest);

    console.log('SUCCESS');

  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();
