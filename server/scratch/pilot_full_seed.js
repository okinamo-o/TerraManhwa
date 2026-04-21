import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { scrapeListMode } from '../scraper/scrapeCatalog.js';
import { scrapeManhwa } from '../scraper/scrapeManhwa.js';
import Manhwa from '../models/Manhwa.js';

async function pilot() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB for Pilot Run');
  
  const catalog = await scrapeListMode();
  const sample = catalog.slice(0, 3);
  console.log(`🚀 Starting pilot for ${sample.length} items...`);
  
  for (const item of sample) {
    console.log(`  📖 Processing: ${item.title}`);
    const detail = await scrapeManhwa(item.sourceUrl);
    await Manhwa.findOneAndUpdate(
      { slug: item.slug },
      {
        $set: {
          title: detail.title,
          slug: item.slug,
          cover: detail.cover || item.cover,
          synopsis: detail.synopsis,
          author: detail.author,
          artist: detail.artist,
          genres: detail.genres,
          status: detail.status,
          releaseYear: new Date().getFullYear(),
          rating: { score: 4.5 + Math.random(), votes: Math.floor(Math.random() * 1000) },
          sourceUrl: item.sourceUrl,
          latestChapter: detail.chapters.length > 0 ? detail.chapters[detail.chapters.length - 1].chapterNumber : 0,
        }
      },
      { upsert: true, new: true }
    );
    console.log(`  ✅ Cached: ${item.title}`);
  }
  
  await mongoose.disconnect();
  console.log('🏁 Pilot complete!');
  process.exit(0);
}
pilot();
