import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Manhwa from './models/Manhwa.js';
import User from './models/User.js';
import Chapter from './models/Chapter.js';
import Comment from './models/Comment.js';

async function runTests() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('--- STARTING FEATURE TESTS ---');

  // 1. Search Test
  const searchQuery = 'Solo Leveling';
  const searchResults = await Manhwa.find({ $text: { $search: searchQuery } })
    .select('title slug')
    .limit(5);
  console.log('Search Results for "Solo Leveling":', searchResults.map(m => m.title));
  if (searchResults.length > 0) console.log('✅ Search Test Passed');
  else console.log('❌ Search Test Failed');

  // 2. Auth & Persistence Test
  // Create / Find test user
  let user = await User.findOne({ username: 'test_verifier' });
  if (!user) {
    user = await User.create({ 
      username: 'test_verifier', 
      email: 'test@verifier.com', 
      passwordHash: 'dummy' 
    });
  }
  
  const targetManhwa = searchResults[0] || await Manhwa.findOne();
  const targetChapter = await Chapter.findOne({ manhwaId: targetManhwa._id });

  // Simulation Bookmark
  await User.findByIdAndUpdate(user._id, { $addToSet: { bookmarks: targetManhwa._id } });
  console.log(`✅ Bookmarked "${targetManhwa.title}"`);

  // Simulation History
  await User.findByIdAndUpdate(user._id, {
    readingHistory: [{
      manhwaId: targetManhwa._id,
      chapterId: targetChapter._id,
      lastPage: 5,
      updatedAt: new Date()
    }]
  });
  console.log(`✅ Saved Reading Progress for "${targetManhwa.title}" Ch.${targetChapter.chapterNumber} P.6`);

  // Verify Profile Population
  const profile = await User.findById(user._id)
    .populate('bookmarks', 'title slug')
    .populate('readingHistory.manhwaId', 'title slug')
    .populate('readingHistory.chapterId', 'chapterNumber');
  
  console.log('Profile Bookmarks Count:', profile.bookmarks.length);
  console.log('Last Read Manhwa:', profile.readingHistory[0]?.manhwaId?.title);
  if (profile.bookmarks.length > 0 && profile.readingHistory.length > 0) console.log('✅ Persistence Sync Passed');
  else console.log('❌ Persistence Sync Failed');

  // 3. Comments Test
  const comment = await Comment.create({
    manhwaId: targetManhwa._id,
    userId: user._id,
    content: 'Great chapter!'
  });
  console.log('✅ Created Comment');

  const reply = await Comment.create({
    manhwaId: targetManhwa._id,
    userId: user._id,
    parentId: comment._id,
    content: 'Totally agree!'
  });
  console.log('✅ Created Reply');

  // Verify Nesting
  const fetchedComments = await Comment.find({ manhwaId: targetManhwa._id, parentId: null });
  const fetchedReplies = await Comment.find({ parentId: comment._id });
  console.log('Nesting Check - Main Comment Content:', fetchedComments[0].content);
  console.log('Nesting Check - Reply Count:', fetchedReplies.length);
  if (fetchedReplies.length > 0) console.log('✅ Comment Nesting Passed');
  else console.log('❌ Comment Nesting Failed');

  console.log('--- TESTS COMPLETE ---');
  process.exit(0);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
