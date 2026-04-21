import { Router } from 'express';
import User from '../models/User.js';
import Manhwa from '../models/Manhwa.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/* GET /api/users/:username — public profile */
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('username avatar bio bookmarks readingHistory createdAt')
      .populate('bookmarks', 'title slug cover status rating views latestChapter')
      .populate('readingHistory.manhwaId', 'title slug cover')
      .populate('readingHistory.chapterId', 'chapterNumber');
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    const Comment = (await import('../models/Comment.js')).default;
    const commentCount = await Comment.countDocuments({ userId: user._id, isDeleted: false });

    res.json({ 
      data: {
        ...user.toObject(),
        commentCount
      } 
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user', error: err.message });
  }
});

/* PUT /api/users/me — update own profile */
router.put('/me', authenticate, async (req, res) => {
  try {
    const { username, email, bio, avatar } = req.body;
    const updates = {};
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (bio !== undefined) updates.bio = bio;
    if (avatar) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ data: user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
});

/* POST /api/users/me/bookmark/:manhwaId */
router.post('/me/bookmark/:manhwaId', authenticate, async (req, res) => {
  try {
    const { manhwaId } = req.params;
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { bookmarks: manhwaId } });
    await Manhwa.findByIdAndUpdate(manhwaId, { $inc: { bookmarkCount: 1 } });
    res.json({ message: 'Bookmarked' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to bookmark', error: err.message });
  }
});

/* DELETE /api/users/me/bookmark/:manhwaId */
router.delete('/me/bookmark/:manhwaId', authenticate, async (req, res) => {
  try {
    const { manhwaId } = req.params;
    await User.findByIdAndUpdate(req.user._id, { $pull: { bookmarks: manhwaId } });
    await Manhwa.findByIdAndUpdate(manhwaId, { $inc: { bookmarkCount: -1 } });
    res.json({ message: 'Unbookmarked' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to unbookmark', error: err.message });
  }
});

/* POST /api/users/me/history — save reading progress */
router.post('/me/history', authenticate, async (req, res) => {
  try {
    const { manhwaId, chapterId, lastPage } = req.body;
    const user = await User.findById(req.user._id);
    const existing = user.readingHistory.find((h) => h.manhwaId.toString() === manhwaId);
    if (existing) {
      existing.chapterId = chapterId;
      existing.lastPage = lastPage;
      existing.updatedAt = new Date();
    } else {
      user.readingHistory.push({ manhwaId, chapterId, lastPage });
    }
    await user.save();
    res.json({ message: 'Progress saved' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save progress', error: err.message });
  }
});

export default router;
