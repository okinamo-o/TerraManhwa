import cron from 'node-cron';
import { updateScrape } from './index.js';

/**
 * Start the cron scheduler for automatic scraping
 */
export function startScheduler() {
  // Run incremental update every hour
  cron.schedule('0 * * * *', async () => {
    console.log('\n⏰ Scheduled scrape starting...');
    try {
      await updateScrape();
    } catch (err) {
      console.error('❌ Scheduled scrape failed:', err.message);
    }
  });

  console.log('📅 Scraper scheduler started (every hour)');
}
