import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './models/User.js';
import Manhwa from './models/Manhwa.js';

async function testBookmarks() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  
  const user = await User.findOne({ email: 'admin@terra.com' });
  console.log('User:', user?.email);
  if (user && user.bookmarks.length > 0) {
    const bookmarks = await Manhwa.find({ _id: { $in: user.bookmarks } });
    console.log('Bookmarks:', bookmarks.map(b => b.slug));
  } else {
    console.log('No bookmarks found for user');
  }
  process.exit(0);
}

testBookmarks();
