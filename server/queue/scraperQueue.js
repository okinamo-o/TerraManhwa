import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import Chapter from '../models/Chapter.js';
import { scrapeChapter } from '../scraper/scrapeChapter.js';
import dotenv from 'dotenv';
dotenv.config();

const connection = new IORedis(process.env.REDIS_URI || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

export const scraperQueue = new Queue('scraperQueue', { connection });

export const scraperWorker = new Worker('scraperQueue', async (job) => {
  const { chapterId, sourceUrl } = job.data;
  
  try {
    console.log(`[WORKER] Starting scrape for chapter ${chapterId}...`);
    
    // Perform the scrape
    const images = await scrapeChapter(sourceUrl);
    
    if (images && images.length > 0) {
      const pages = images.map((url, i) => ({ url, order: i }));
      
      // Update DB atomically
      await Chapter.updateOne(
        { _id: chapterId },
        { $set: { pages } }
      );
      
      console.log(`[WORKER] Finished scraping ${images.length} pages for chapter ${chapterId}`);
      return { success: true, pagesCount: images.length };
    } else {
      console.log(`[WORKER] Scrape returned 0 pages for chapter ${chapterId}`);
      throw new Error('Scrape returned 0 pages');
    }
  } catch (err) {
    console.error(`[WORKER] Scrape failed for chapter ${chapterId}:`, err.message);
    throw err;
  }
}, { connection, concurrency: 3 });

scraperWorker.on('completed', (job) => {
  console.log(`[WORKER] Job ${job.id} has completed!`);
});

scraperWorker.on('failed', (job, err) => {
  console.log(`[WORKER] Job ${job.id} has failed with ${err.message}`);
});
