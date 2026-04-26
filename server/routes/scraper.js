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

// Reset on startup (safeguard for server restarts/deploys)
isScraperRunning = false; 
console.log('🚀 Scraper Concurrency Guard Reset.');

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

/* POST /api/scraper/heal-meta — safe background job to fix genres and status */
router.post('/heal-meta', authenticate, requireAdmin, async (req, res) => {
  if (isScraperRunning) {
    return res.status(409).json({ message: 'A scrape job is already running.' });
  }

  isScraperRunning = true;
  
  // Respond immediately
  res.json({ message: 'Background library repair job started! Check Render logs for progress.' });

  // Run in background
  (async () => {
    try {
      console.log('🚀 Background Library Repair Started');
      const Manhwa = (await import('../models/Manhwa.js')).default;
      const { scrapeSingle } = await import('../scraper/index.js');
      
      const manhwas = await Manhwa.find({
        $or: [
          { genres: { $size: 0 } },
          { author: { $in: [null, '', 'Unknown', 'unknown'] } },
          { author: /n\/a/i },
          { latestChapter: 0 },
          { latestChapter: { $exists: false } }
        ]
      }).select('slug title sourceUrl');

      console.log(`🚀 Starting Full Library Repair for ${manhwas.length} items...`);
      
      let repaired = 0;
      for (const m of manhwas) {
        try {
          console.log(`\n[Repair ${repaired + 1}/${manhwas.length}] Processing: ${m.title} (${m.slug})`);
          await scrapeSingle(m.slug);
          repaired++;
          await new Promise(r => setTimeout(r, 1000)); // Safer delay
        } catch(e) {
          console.error(`  ❌ Repair failed for ${m.slug}: ${e.message}`);
        }
      }
      console.log(`✅ Library Repair Finished. Successfully processed ${repaired} items.`);
    } catch (err) {
      console.error('Library Repair Task Error:', err);
    } finally {
      isScraperRunning = false;
    }
  })();
});

/* POST /api/scraper/single — scrape single manhwa */
router.post('/single', authenticate, requireAdmin, async (req, res) => {
  try {
    const { slug, sourceUrl } = req.body;
    if (!slug) return res.status(400).json({ message: 'Slug required' });

    // If a manual source URL is provided, update the manhwa document first
    if (sourceUrl) {
      const Manhwa = (await import('../models/Manhwa.js')).default;
      await Manhwa.findOneAndUpdate({ slug }, { sourceUrl });
      console.log(`[Admin] Updated sourceUrl for ${slug} to ${sourceUrl}`);
    }

    // Run in background
    scrapeSingle(slug).catch(err => console.error('Single Scrape Error:', err));
    
    res.json({ message: `Scrape job for ${slug} started in background${sourceUrl ? ' with new source URL' : ''}.` });
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
