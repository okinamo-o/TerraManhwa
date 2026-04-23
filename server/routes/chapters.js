import { Router } from 'express';
import Chapter from '../models/Chapter.js';
import Manhwa from '../models/Manhwa.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { scrapeChapter } from '../scraper/scrapeChapter.js';

const router = Router();

/* GET /api/chapters/:slug/:number */
router.get('/:slug/:number', async (req, res) => {
  try {
    const manhwa = await Manhwa.findOne({ slug: req.params.slug });
    if (!manhwa) return res.status(404).json({ message: 'Manhwa not found' });

    const number = parseFloat(req.params.number);
    const chapter = await Chapter.findOne({ manhwaId: manhwa._id, chapterNumber: number });
    
    if (!chapter) return res.status(404).json({ message: 'Chapter not found' });
    
    // ON-DEMAND LAZY LOAD (Re-scrape if empty OR if first page looks like a placeholder)
    const isPlaceholder = chapter.pages.length > 0 && 
                         (chapter.pages[0].url.startsWith('data:image') || chapter.pages[0].url.includes('blank'));
    
    if ((!chapter.pages || chapter.pages.length === 0 || isPlaceholder || req.query.refresh === 'true') && chapter.sourceUrl) {
      console.log(`[LAZY LOAD] Fetching images for ${manhwa.title} Chapter ${number}...`);
      const images = await scrapeChapter(chapter.sourceUrl);
      if (images && images.length > 0) {
        chapter.pages = images.map((url, i) => ({ url, order: i }));
        console.log(`[LAZY LOAD] Cached ${images.length} images. Ready.`);
      }
    }

    chapter.views += 1;
    await chapter.save();
    res.json(chapter);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch chapter', error: err.message });
  }
});

/* GET /api/chapters/:id (Legacy for object ID) */
router.get('/:id', async (req, res) => {
  // Ignore request if id looks like a slug/number combo which should have been caught above
  // but just in case
  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ message: 'Invalid ID format' });
  
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) return res.status(404).json({ message: 'Chapter not found' });
    
    // ON-DEMAND LAZY LOAD
    if ((!chapter.pages || chapter.pages.length === 0) && chapter.sourceUrl) {
      console.log(`[LAZY LOAD (ID API)] Fetching images for Chapter ID ${chapter._id}...`);
      const images = await scrapeChapter(chapter.sourceUrl);
      if (images && images.length > 0) {
        chapter.pages = images.map((url, i) => ({ url, order: i }));
        console.log(`[LAZY LOAD] Cached ${images.length} images. Ready.`);
      }
    }

    chapter.views += 1;
    await chapter.save();
    res.json(chapter);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch chapter', error: err.message });
  }
});

/* DELETE /api/chapters/:id — admin */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const chapter = await Chapter.findByIdAndDelete(req.params.id);
    if (!chapter) return res.status(404).json({ message: 'Chapter not found' });
    await Manhwa.findByIdAndUpdate(chapter.manhwaId, { $pull: { chapters: chapter._id } });
    res.json({ message: 'Chapter deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete chapter', error: err.message });
  }
});

export default router;
