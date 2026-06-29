import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './models/User.js';
import Manhwa from './models/Manhwa.js';
import Chapter from './models/Chapter.js';
import Notification from './models/Notification.js';
import { scrapeCatalog } from './scraper/scrapeCatalog.js';
import { updateScrape } from './scraper/index.js';

async function testAutoUpdate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  
  // 1. Get latest updated manhwa from KingOfShojo
  const catalog = await scrapeCatalog(1, 'update');
  if (catalog.length === 0) {
    console.log('No catalog found');
    process.exit(1);
  }
  
  // Find one that exists in our DB
  let targetManhwa = null;
  for (const item of catalog) {
    const existing = await Manhwa.findOne({ slug: item.slug });
    if (existing) {
      targetManhwa = existing;
      break;
    }
  }
  
  if (!targetManhwa) {
    console.log('Could not find any recently updated manhwa in our database to test with.');
    process.exit(1);
  }
  
  console.log(`Targeting Manhwa: ${targetManhwa.title} (${targetManhwa.slug})`);
  
  // 2. Ensure an admin user exists and bookmarks it
  let user = await User.findOne({ email: 'admin@terra.com' });
  if (!user) {
    user = new User({ email: 'admin@terra.com', password: 'password', username: 'admin' });
  }
  if (!user.bookmarks.includes(targetManhwa._id)) {
    user.bookmarks.push(targetManhwa._id);
    await user.save();
    console.log('Bookmarked the manhwa for admin user.');
  }
  
  // 3. Delete its latest chapter to simulate an update
  const latestChap = await Chapter.findOne({ manhwaId: targetManhwa._id }).sort({ chapterNumber: -1 });
  if (latestChap) {
    console.log(`Deleting chapter ${latestChap.chapterNumber} to simulate new update...`);
    await Chapter.deleteOne({ _id: latestChap._id });
    
    // Also delete any existing notifications for this chapter
    await Notification.deleteMany({ manhwaId: targetManhwa._id });
  }
  
  // 4. Run updateScrape()
  console.log('Running updateScrape()...');
  await updateScrape();
  
  // 5. Verify chapter was added and notification created
  const newLatest = await Chapter.findOne({ manhwaId: targetManhwa._id }).sort({ chapterNumber: -1 });
  console.log(`New latest chapter: ${newLatest?.chapterNumber}`);
  
  const notifs = await Notification.find({ user: user._id, manhwaId: targetManhwa._id });
  console.log(`Generated Notifications: ${notifs.length}`);
  if (notifs.length > 0) {
    console.log(`Notification Message: ${notifs[0].message}`);
  }
  
  process.exit(0);
}

testAutoUpdate();
