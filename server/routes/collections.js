import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import Collection from '../models/Collection.js';

const router = Router();

/* GET /api/collections — Browse public collections */
router.get('/', async (req, res) => {
  try {
    const data = await Collection.find({ isPublic: true })
      .populate('owner', 'username avatar')
      .populate('manhwas', 'title cover slug')
      .sort({ views: -1 })
      .limit(20);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch collections', error: err.message });
  }
});

/* GET /api/collections/me — Fetch authenticated user's collections */
router.get('/me', authenticate, async (req, res) => {
  try {
    const data = await Collection.find({ owner: req.user._id })
      .populate('manhwas', 'title cover slug')
      .sort({ updatedAt: -1 });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch your collections', error: err.message });
  }
});

/* POST /api/collections — Create new collection */
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, manhwas, isPublic } = req.body;
    const collection = await Collection.create({
      title,
      description,
      manhwas,
      isPublic,
      owner: req.user._id
    });
    res.status(201).json({ data: collection });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create collection', error: err.message });
  }
});

/* GET /api/collections/:id — Get details of a single collection */
router.get('/:id', async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id)
      .populate('owner', 'username avatar')
      .populate('manhwas', 'title cover slug latestChapter rating');
    
    if (!collection) return res.status(404).json({ message: 'Collection not found' });
    
    // Increment views safely
    collection.views += 1;
    await collection.save();
    
    res.json({ data: collection });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch collection', error: err.message });
  }
});

/* PUT /api/collections/:id — Update collection */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const collection = await Collection.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true }
    );
    if (!collection) return res.status(404).json({ message: 'Collection not found or unauthorized' });
    res.json({ data: collection });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update collection', error: err.message });
  }
});

/* POST /api/collections/:id/like — Toggle like */
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) return res.status(404).json({ message: 'Collection not found' });

    const userId = req.user._id.toString();
    const idx = collection.likes.findIndex(id => id.toString() === userId);
    
    if (idx === -1) {
      collection.likes.push(req.user._id);
    } else {
      collection.likes.splice(idx, 1);
    }
    
    await collection.save();
    res.json({ data: { liked: idx === -1, likesCount: collection.likes.length } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle like', error: err.message });
  }
});

/* POST /api/collections/:id/manhwas — Add manhwa to collection */
router.post('/:id/manhwas', authenticate, async (req, res) => {
  try {
    const { manhwaId } = req.body;
    const collection = await Collection.findOne({ _id: req.params.id, owner: req.user._id });
    if (!collection) return res.status(404).json({ message: 'Collection not found or unauthorized' });

    if (!collection.manhwas.includes(manhwaId)) {
      collection.manhwas.push(manhwaId);
      await collection.save();
    }

    const populated = await collection.populate('manhwas', 'title cover slug');
    res.json({ data: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add manhwa', error: err.message });
  }
});

/* DELETE /api/collections/:id/manhwas/:manhwaId — Remove manhwa from collection */
router.delete('/:id/manhwas/:manhwaId', authenticate, async (req, res) => {
  try {
    const collection = await Collection.findOne({ _id: req.params.id, owner: req.user._id });
    if (!collection) return res.status(404).json({ message: 'Collection not found or unauthorized' });

    collection.manhwas = collection.manhwas.filter(id => id.toString() !== req.params.manhwaId);
    await collection.save();

    const populated = await collection.populate('manhwas', 'title cover slug');
    res.json({ data: populated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove manhwa', error: err.message });
  }
});

/* DELETE /api/collections/:id — Delete collection */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await Collection.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!result) return res.status(404).json({ message: 'Collection not found or unauthorized' });
    res.json({ message: 'Collection deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete collection', error: err.message });
  }
});

export default router;
