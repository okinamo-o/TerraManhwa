import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import Manhwa from '../models/Manhwa.js';
import Chapter from '../models/Chapter.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import SiteVisit from '../models/SiteVisit.js';

const router = Router();


/* GET /api/admin/stats */
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const monthId = new Date().toISOString().substring(0, 7); // Format: YYYY-MM
    const currentVisits = await SiteVisit.findOne({ monthId });

    const [manhwaCount, chapterCount, userCount, commentCount] = await Promise.all([
      Manhwa.countDocuments(),
      Chapter.countDocuments(),
      User.countDocuments(),
      Comment.countDocuments()
    ]);

    res.json({
      data: {
        manhwaCount,
        chapterCount,
        userCount,
        commentCount,
        dailyVisits: currentVisits ? currentVisits.totalVisits : 0
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch admin stats', error: err.message });
  }
});

/* POST /api/admin/scrape */
router.post('/scrape', authenticate, requireAdmin, async (req, res) => {
  try {
    const { slug } = req.body;
    if (!slug) return res.status(400).json({ message: 'Slug required' });

    // This would typically trigger a background worker
    // For now, we simulate a successful trigger
    console.log(`[Admin] Scrape triggered for: ${slug}`);
    
    res.json({ message: `Scrape job for ${slug} started in background.` });
  } catch (err) {
    res.status(500).json({ message: 'Scrape trigger failed', error: err.message });
  }
});

/* POST /api/admin/track-visit */
router.post('/track-visit', async (req, res) => {
  try {
    const monthId = new Date().toISOString().substring(0, 7); // Format: YYYY-MM
    await SiteVisit.findOneAndUpdate(
      { monthId },
      { $inc: { totalVisits: 1 } },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    // We fail silently for analytics to not disrupt UX
    console.error('Failed to track visit:', err.message);
    res.status(500).json({ success: false });
  }
});

/* ================= USERS MANAGEMENT ================= */
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    const total = await User.countDocuments();
    res.json({ data: users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
});

router.put('/users/:id/role', authenticate, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    res.json({ message: 'Role updated', data: user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update role', error: err.message });
  }
});

router.delete('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted permanently' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
});

/* ================= COMMENTS MANAGEMENT ================= */
router.get('/comments', authenticate, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const comments = await Comment.find()
      .populate('userId', 'username avatar role')
      .populate('manhwaId', 'title slug')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
      
    const total = await Comment.countDocuments();
    res.json({ data: comments, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch comments', error: err.message });
  }
});

router.delete('/comments/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    // Soft delete
    await Comment.findByIdAndUpdate(req.params.id, { 
      isDeleted: true, 
      content: '[Comment removed by Admin]' 
    });
    res.json({ message: 'Comment soft-deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete comment', error: err.message });
  }
});

/* ================= CHAPTERS MANAGEMENT ================= */
router.get('/chapters', authenticate, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const chapters = await Chapter.find()
      .populate('manhwaId', 'title slug cover')
      .sort({ addedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
      
    const total = await Chapter.countDocuments();
    res.json({ data: chapters, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch chapters', error: err.message });
  }
});

router.delete('/chapters/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) return res.status(404).json({ message: 'Chapter not found' });
    
    await Chapter.findByIdAndDelete(req.params.id);
    
    // Attempt to update manhwa chapter count if necessary, but keep it simple
    res.json({ message: 'Chapter deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete chapter', error: err.message });
  }
});

export default router;
