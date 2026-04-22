import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import ScrapeLog from '../models/ScrapeLog.js';
import { fullMetadataSeed, scrapeSingle } from '../scraper/index.js';

const router = Router();

/* GET /api/scraper/status */
router.get('/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const lastRun = await ScrapeLog.findOne().sort({ createdAt: -1 });
    const totalLogs = await ScrapeLog.countDocuments();
    const errorCount = await ScrapeLog.countDocuments({ status: 'error' });
    res.json({
      lastRun: lastRun?.createdAt || null,
      totalRuns: totalLogs,
      errors: errorCount,
      status: 'idle',
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get scraper status', error: err.message });
  }
});

/* Concurrency guard — prevent multiple batch scrapes from running at once */
let isScraperRunning = false;

/* POST /api/scraper/run — trigger full scrape */
router.post('/run', authenticate, requireAdmin, async (req, res) => {
  if (isScraperRunning) {
    return res.status(409).json({ message: 'A scrape job is already running. Please wait for it to finish.' });
  }
  try {
    isScraperRunning = true;
    fullMetadataSeed()
      .catch(err => console.error('Background Scrape Error:', err))
      .finally(() => { isScraperRunning = false; });
    res.json({ message: 'Massive Batch Scrape started in the background!', jobId: Date.now().toString() });
  } catch (err) {
    isScraperRunning = false;
    res.status(500).json({ message: 'Failed to start scraper', error: err.message });
  }
});

/* POST /api/scraper/single — scrape single manhwa */
router.post('/single', authenticate, requireAdmin, async (req, res) => {
  try {
    const { slug } = req.body;
    if (!slug) return res.status(400).json({ message: 'Slug required' });

    // Run in background
    scrapeSingle(slug).catch(err => console.error('Single Scrape Error:', err));
    
    res.json({ message: `Scrape job for ${slug} started in background.` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to start scrape', error: err.message });
  }
});

/* GET /api/scraper/logs */
router.get('/logs', authenticate, requireAdmin, async (req, res) => {
  try {
    const logs = await ScrapeLog.find().sort({ createdAt: -1 }).limit(50);
    res.json({ data: logs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch logs', error: err.message });
  }
});

export default router;
