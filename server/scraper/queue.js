import Bull from 'bull';
import dotenv from 'dotenv';

dotenv.config();

let scrapeQueue = null;

try {
  scrapeQueue = new Bull('scrape-queue', process.env.REDIS_URL || 'redis://localhost:6379', {
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  });

  scrapeQueue.on('completed', (job) => {
    console.log(`✅ Scrape job ${job.id} completed`);
  });

  scrapeQueue.on('failed', (job, err) => {
    console.error(`❌ Scrape job ${job.id} failed: ${err.message}`);
  });

} catch (err) {
  console.log('⚠️ Redis not available — Bull queue disabled. Scraping will run directly.');
}

/**
 * Add a scrape job to the queue
 */
export function addScrapeJob(type, data = {}) {
  if (!scrapeQueue) {
    console.log('⚠️ Queue not available, running directly...');
    return null;
  }
  return scrapeQueue.add({ type, ...data });
}

/**
 * Get queue stats
 */
export async function getQueueStats() {
  if (!scrapeQueue) return { waiting: 0, active: 0, completed: 0, failed: 0 };
  const [waiting, active, completed, failed] = await Promise.all([
    scrapeQueue.getWaitingCount(),
    scrapeQueue.getActiveCount(),
    scrapeQueue.getCompletedCount(),
    scrapeQueue.getFailedCount(),
  ]);
  return { waiting, active, completed, failed };
}

export default scrapeQueue;
