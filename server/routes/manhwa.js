import { Router } from 'express';
import slugify from 'slugify';
import Manhwa from '../models/Manhwa.js';
import Chapter from '../models/Chapter.js';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth.js';
import { manhwaValidation } from '../middleware/validate.js';
import { scrapeSingle } from '../scraper/index.js';

const router = Router();

/* GET /api/manhwa/meta — dynamic genres & statuses */
router.get('/meta', async (req, res) => {
  try {
    const [genres, statuses] = await Promise.all([
      Manhwa.distinct('genres'),
      Manhwa.distinct('status')
    ]);
    res.json({ genres: genres.sort(), statuses: statuses.sort() });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch metadata', error: err.message });
  }
});

/* GET /api/manhwa/featured */
router.get('/featured', async (req, res) => {
  try {
    let data = await Manhwa.find({ isFeatured: true }).limit(5);
    if (data.length === 0) {
      data = await Manhwa.find().sort({ views: -1 }).limit(5);
    }
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch featured manhwa' });
  }
});

/* GET /api/manhwa/trending */
router.get('/trending', async (req, res) => {
  try {
    const data = await Manhwa.find().sort({ views: -1 }).limit(10);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch trending manhwa' });
  }
});

/* GET /api/manhwa/latest */
router.get('/latest', async (req, res) => {
  try {
    const data = await Manhwa.find().sort({ updatedAt: -1 }).limit(20);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch latest manhwa' });
  }
});

/* GET /api/manhwa/popular */
router.get('/popular', async (req, res) => {
  try {
    const data = await Manhwa.find().sort({ 'rating.score': -1 }).limit(20);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch popular manhwa' });
  }
});

/* GET /api/manhwa — list with filters & pagination */
router.get('/', async (req, res) => {
  try {
    const { genre, status, sort = 'latest', page = 1, limit = 24, search } = req.query;
    const filter = {};

    if (genre) {
      const genres = genre.split(',').map((g) => g.trim());
      filter.genres = { $in: genres };
    }
    if (status) filter.status = status;
    if (search) filter.$text = { $search: search };

    const sortOptions = {
      latest: { updatedAt: -1 },
      views: { views: -1 },
      rating: { 'rating.score': -1 },
      bookmarks: { bookmarkCount: -1 },
      new: { createdAt: -1 },
      az: { title: 1 },
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [data, total] = await Promise.all([
      Manhwa.find(filter)
        .sort(sortOptions[sort] || sortOptions.latest)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-chapters -synopsis'),
      Manhwa.countDocuments(filter),
    ]);

    res.json({ data, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch manhwa', error: err.message });
  }
});

/* POST /api/manhwa/list — fetch multiple by slugs */
router.post('/list', async (req, res) => {
  try {
    const { slugs } = req.body;
    if (!slugs || !Array.isArray(slugs)) {
      return res.status(400).json({ message: 'Invalid slugs array' });
    }
    const data = await Manhwa.find({ slug: { $in: slugs } })
      .select('title slug cover genres status rating views latestChapter');
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch manhwa list', error: err.message });
  }
});

/* GET /api/manhwa/:slug */
router.get('/:slug', async (req, res) => {
  try {
    const manhwa = await Manhwa.findOne({ slug: req.params.slug });
    if (!manhwa) return res.status(404).json({ message: 'Manhwa not found' });

    // Increment views
    manhwa.views += 1;
    await manhwa.save();

    let chapters = await Chapter.find({ manhwaId: manhwa._id })
      .sort({ chapterNumber: -1 })
      .select('-pages');

    // AUTO-HEAL: If 0 chapters found, trigger a quick metadata scrape
    if (chapters.length === 0 && manhwa.sourceUrl) {
      console.log(`[AUTO-HEAL] No chapters for ${manhwa.title}, triggering scrape...`);
      try {
        await scrapeSingle(manhwa.slug);
        // Re-fetch after scrape
        chapters = await Chapter.find({ manhwaId: manhwa._id })
          .sort({ chapterNumber: -1 })
          .select('-pages');
      } catch (e) {
        console.error(`[AUTO-HEAL] Failed: ${e.message}`);
      }
    }

    res.json({ data: manhwa, chapters });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch manhwa', error: err.message });
  }
});

/* POST /api/manhwa — admin create */
router.post('/', authenticate, requireAdmin, manhwaValidation, async (req, res) => {
  try {
    const slug = slugify(req.body.title, { lower: true, strict: true });
    const exists = await Manhwa.findOne({ slug });
    if (exists) return res.status(400).json({ message: 'Manhwa with this title already exists' });

    const manhwa = await Manhwa.create({ ...req.body, slug });
    res.status(201).json({ data: manhwa });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create manhwa', error: err.message });
  }
});

/* PUT /api/manhwa/:id — admin update */
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const manhwa = await Manhwa.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!manhwa) return res.status(404).json({ message: 'Manhwa not found' });
    res.json({ data: manhwa });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update manhwa', error: err.message });
  }
});

/* DELETE /api/manhwa/:id — admin delete */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const manhwa = await Manhwa.findByIdAndDelete(req.params.id);
    if (!manhwa) return res.status(404).json({ message: 'Manhwa not found' });
    await Chapter.deleteMany({ manhwaId: manhwa._id });
    res.json({ message: 'Manhwa deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete manhwa', error: err.message });
  }
});

export default router;
