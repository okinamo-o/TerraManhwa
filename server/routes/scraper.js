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
  try {
    isScraperRunning = true;
    (async () => {
      try {
        console.log('🚀 Background Meta-Heal Started');
        const Manhwa = (await import('../models/Manhwa.js')).default;
        const { scrapeManhwa } = await import('../scraper/scrapeManhwa.js');
        
        // More aggressive filter to catch ANY placeholder or missing metadata
        const manhwas = await Manhwa.find({
          $or: [
            { genres: { $exists: false } },
            { genres: { $size: 0 } },
            { genres: null },
            { author: { $in: [null, '', 'N/A', 'n/a', 'Unknown', 'unknown', 'N/A ', ' n/a'] } },
            { artist: { $in: [null, '', 'N/A', 'n/a', 'Unknown', 'unknown', 'N/A ', ' n/a'] } },
            { author: /n\/a/i },
            { artist: /n\/a/i },
            { author: /unknown/i },
            { artist: /unknown/i }
          ]
        }).select('slug sourceUrl title'); // Need title for hint
        console.log(`Found ${manhwas.length} manhwas needing metadata healing...`);
        
        let healed = 0;
        for (const m of manhwas) {
          try {
            // Pass title as hint for smart-search if 404
            const detail = await scrapeManhwa(m.sourceUrl, m.title);
            
            if (detail.author === 'Unknown' || detail.artist === 'Unknown') {
               console.log(`  ⚠️ [Heal Warning] ${m.slug}: Source site returned "n/a" or placeholder. Saved as "Unknown".`);
            } else {
               console.log(`  ✅ [Heal Success] ${m.slug}: Author: ${detail.author}, Artist: ${detail.artist}`);
            }
            
            const updateData = {
              status: detail.status,
              genres: detail.genres,
              author: detail.author,
              artist: detail.artist,
              synopsis: detail.synopsis,
            };

            // If the URL changed (smart search found the correct one), update it in DB!
            if (detail.sourceUrl && detail.sourceUrl !== m.sourceUrl) {
              console.log(`  ✨ Healing sourceUrl for ${m.slug}: ${m.sourceUrl} -> ${detail.sourceUrl}`);
              updateData.sourceUrl = detail.sourceUrl;
            }

            await Manhwa.findByIdAndUpdate(m._id, updateData);
            healed++;
            if (healed % 10 === 0) console.log(`[Heal Progress] ${healed}/${manhwas.length} verified.`);
          } catch(e) {
            console.error(`[Heal Error] Failed on ${m.slug}: ${e.message}`);
          }
          await new Promise(r => setTimeout(r, 200)); 
        }
        console.log(`✅ Background Meta-Heal Finished. Verified ${healed} items.`);
      } catch (err) {
        console.error('Background Heal Error:', err);
      } finally {
        isScraperRunning = false;
      }
    })();
    res.json({ message: 'Background metadata heal job started! Check Render logs for progress.' });
  } catch (err) {
    isScraperRunning = false;
    res.status(500).json({ message: 'Failed to start heal', error: err.message });
  }
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
