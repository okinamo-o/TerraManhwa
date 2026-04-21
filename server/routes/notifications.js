import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import Notification from '../models/Notification.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/* GET /api/notifications — Fetch current user notifications */
router.get('/', async (req, res) => {
  try {
    const data = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    
    const unreadCount = await Notification.countDocuments({ 
      user: req.user._id, 
      isRead: false 
    });

    res.json({ data, unreadCount });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: err.message });
  }
});

/* PATCH /api/notifications/read-all — Mark all as read */
router.patch('/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update notifications', error: err.message });
  }
});

/* PATCH /api/notifications/:id — Mark specific as read */
router.patch('/:id', async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { isRead: true } },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    res.json({ data: notif });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update notification', error: err.message });
  }
});

export default router;
