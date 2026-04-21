import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Manhwa from './models/Manhwa.js';
import Chapter from './models/Chapter.js';

async function c(){
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const m = await Manhwa.findOne({title: /^y/i});
    const ch = await Chapter.findOne({manhwaId: m._id, 'pages.0': {$exists: false}});
    console.log('Manhwa:', m.title);
    console.log('Chapter:', ch.chapterNumber);
    console.log('Slug:', m.slug);
    console.log('Empty Pages:', !ch.pages || ch.pages.length === 0);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
c();
