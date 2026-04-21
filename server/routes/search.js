import { Router } from 'express';
import Manhwa from '../models/Manhwa.js';

const router = Router();

/* GET /api/search?q=&genre=&status=&sort=&page= */
router.get('/', async (req, res) => {
  try {
    const { q, genre, status, sort = 'relevance', page = 1, limit = 24 } = req.query;
    const filter = {};

    if (q) {
      const terms = q.split(' ').map(t => t.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')).filter(Boolean);
      if (terms.length > 0) {
        filter.$and = terms.map(term => {
          const regex = new RegExp(term, 'i');
          return {
            $or: [
              { title: { $regex: regex } },
              { alternativeTitles: { $regex: regex } },
              { author: { $regex: regex } },
              { slug: { $regex: regex } }
            ]
          };
        });
      }
    }
    
    if (genre) filter.genres = { $in: genre.split(',').map((g) => g.trim()) };
    if (status) filter.status = status;

    const sortMap = {
      views: { views: -1 },
      rating: { 'rating.score': -1 },
      latest: { updatedAt: -1 },
      az: { title: 1 },
      relevance: { views: -1 } // Focus on most viewed for relevance when using partial text
    };

    const currentSort = sortMap[sort] || sortMap.views;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [data, total] = await Promise.all([
      Manhwa.find(filter)
        .sort(currentSort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('title slug cover genres status rating views latestChapter updatedAt'),
      Manhwa.countDocuments(filter),
    ]);

    res.json({ data, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
});

/* GET /api/search/suggest?q= */
router.get('/suggest', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ data: [] });

    const regex = new RegExp(q.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
    
    const data = await Manhwa.find({
      $or: [
        { title: { $regex: regex } },
        { slug: { $regex: regex } }
      ]
    })
    .limit(6)
    .select('title slug cover');

    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: 'Suggest failed', error: err.message });
  }
});

export default router;
