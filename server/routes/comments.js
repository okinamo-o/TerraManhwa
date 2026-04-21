import { Router } from 'express';
import Comment from '../models/Comment.js';
import Manhwa from '../models/Manhwa.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { commentValidation } from '../middleware/validate.js';

const router = Router();

/* GET /api/manhwa/:slug/comments — mounted in server.js under /api/comments but we re-route */
/* We handle both /api/manhwa/:slug/comments (via manhwa routes) and /api/comments/:id */

/* GET /api/comments — get comments for a manhwa (pass slug as query) */
router.get('/', async (req, res) => {
  try {
    const { slug, sort = 'newest', page = 1, limit = 20 } = req.query;
    if (!slug) return res.status(400).json({ message: 'slug query param required' });

    const manhwa = await Manhwa.findOne({ slug });
    if (!manhwa) return res.status(404).json({ message: 'Manhwa not found' });

    const sortOpts = sort === 'top' ? { likes: -1 } : { createdAt: -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const comments = await Comment.find({ manhwaId: manhwa._id, parentId: null, isDeleted: false })
      .sort(sortOpts).skip(skip).limit(parseInt(limit))
      .populate('userId', 'username avatar');

    // Fetch replies
    const commentIds = comments.map((c) => c._id);
    const replies = await Comment.find({ parentId: { $in: commentIds }, isDeleted: false })
      .sort({ createdAt: 1 })
      .populate('userId', 'username avatar');

    const data = comments.map((c) => ({
      ...c.toObject(),
      replies: replies.filter((r) => r.parentId.toString() === c._id.toString()),
    }));

    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch comments', error: err.message });
  }
});

/* GET /api/comments/user/:username — get all comments by a specific user */
router.get('/user/:username', async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const comments = await Comment.find({ userId: user._id, isDeleted: false })
      .sort({ createdAt: -1 })
      .populate('manhwaId', 'title slug cover');

    res.json({ data: comments });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user comments', error: err.message });
  }
});

/* POST /api/comments — create comment */
router.post('/', authenticate, commentValidation, async (req, res) => {
  try {
    const { slug, content, parentId } = req.body;
    const manhwa = await Manhwa.findOne({ slug });
    if (!manhwa) return res.status(404).json({ message: 'Manhwa not found' });

    const comment = await Comment.create({
      manhwaId: manhwa._id,
      userId: req.user._id,
      content,
      parentId: parentId || null,
    });

    const populated = await comment.populate('userId', 'username avatar');
    res.status(201).json({ data: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create comment', error: err.message });
  }
});

/* PUT /api/comments/:id */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    comment.content = req.body.content;
    await comment.save();
    res.json({ data: comment });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update comment', error: err.message });
  }
});

/* DELETE /api/comments/:id */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    comment.isDeleted = true;
    await comment.save();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete comment', error: err.message });
  }
});

export default router;
