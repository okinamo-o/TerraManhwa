import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { scrapeCatalog, fetchHtml } from './scrapeCatalog.js';
import { scrapeManhwa } from './scrapeManhwa.js';
import { scrapeChapter } from './scrapeChapter.js';
import { uploadCover, uploadChapterPages } from './imageDownloader.js';
import config from './config.js';
import Manhwa from '../models/Manhwa.js';
import Chapter from '../models/Chapter.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import ScrapeLog from '../models/ScrapeLog.js';
import { scrapeListMode } from './scrapeCatalog.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Full seed scrape — KingOfShojo
 */
async function seedScrape() {
  console.log('\n🚀 SEED SCRAPE — KingOfShojo Migration (Multi-Page)\n');
  const startTime = Date.now();

  try {
    await Manhwa.deleteMany({});
    await Chapter.deleteMany({});
    console.log('🧹 Cleaned up old records.');

    // Fetch multiple pages of catalog to exceed the 40-item limit
    const catalog = [];
    for (let p = 1; p <= 3; p++) {
      const pageItems = await scrapeCatalog(p);
      catalog.push(...pageItems);
      await sleep(2000);
    }
    
    // Final deduplication for safety
    const uniqueCatalog = Array.from(new Map(catalog.map(item => [item.slug, item])).values());
    console.log(`\n📚 Processing ${uniqueCatalog.length} unique manhwa across 3 pages...\n`);

    let processed = 0;
    for (const item of uniqueCatalog) {
      try {
        const existing = await Manhwa.findOne({ slug: item.slug });
        if (existing) {
          console.log(`  ⏭️ Skipping duplicate: ${item.title}`);
          processed++;
          continue;
        }

        const detail = await scrapeManhwa(item.sourceUrl);
        await sleep(config.requestDelay.min);

        let coverUrl = detail.cover || item.cover;
        if (coverUrl && process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name') {
          try {
            coverUrl = await uploadCover(coverUrl, item.slug);
          } catch (e) {
            console.log(`  ⚠️ Cover upload failed: ${e.message}`);
          }
        }

        const manhwaDoc = await Manhwa.create({
          title: detail.title,
          slug: item.slug,
          cover: coverUrl,
          synopsis: detail.synopsis,
          author: detail.author,
          artist: detail.artist,
          genres: detail.genres,
          status: detail.status,
          releaseYear: new Date().getFullYear(),
          rating: { score: 4.5 + Math.random(), votes: Math.floor(Math.random() * 1000) },
          sourceUrl: item.sourceUrl,
        });

        // CREATE CHAPTER SHELLS (On-Demand Ready)
        if (detail.chapters.length > 0) {
          const shellDocs = detail.chapters.map(ch => ({
            manhwaId: manhwaDoc._id,
            chapterNumber: ch.chapterNumber,
            title: ch.title,
            pages: [], // Empty shell
            sourceUrl: ch.sourceUrl,
          }));
          const inserted = await Chapter.insertMany(shellDocs);
          manhwaDoc.chapters = inserted.map(c => c._id);
          manhwaDoc.latestChapter = detail.chapters[detail.chapters.length - 1].chapterNumber;
          await manhwaDoc.save();
        }

        processed++;
        console.log(`  ✅ [${processed}/${uniqueCatalog.length}] ${detail.title} (${detail.chapters.length} chapters seeded)`);
      } catch (err) {
        console.error(`  ❌ Error processing ${item.title}: ${err.message}`);
      }
      await sleep(config.requestDelay.max);
    }

    const duration = Date.now() - startTime;
    await ScrapeLog.create({
      type: 'catalog', status: 'success',
      itemsProcessed: processed, duration,
      message: `KingOfShojo seed complete: ${processed} items`,
    });
    console.log(`\n🎉 Seed complete! ${processed} processed (${(duration / 1000).toFixed(1)}s)\n`);
  } catch (err) {
    console.error(`\n❌ Seed scrape failed: ${err.message}\n`);
    await ScrapeLog.create({ type: 'catalog', status: 'error', message: err.message });
  }
}

/**
 * Massive Metadata-Only Seed — KingOfShojo
 */
async function fullMetadataSeed() {
  console.log('\n🚀 FULL METADATA SEED — KingOfShojo (4,200+ Items)\n');
  const startTime = Date.now();

  try {
    await ScrapeLog.create({ type: 'catalog', status: 'success', message: 'Massive Metadata Seed Started...' });
    const catalog = await scrapeListMode();
    console.log(`\n📚 Processing ${catalog.length} manhwa (Metadata Only)...\n`);
    await ScrapeLog.create({ type: 'catalog', status: 'success', message: `Found ${catalog.length} items in list-mode. Beginning processing...` });

    let processed = 0;
    let skipped = 0;
    let newItems = 0;
    for (const item of catalog) {
      try {
        const existing = await Manhwa.findOne({ slug: item.slug });
        if (existing && existing.synopsis) {
          // Temporarily disabling skip logic to force a full "healing" of all 4,000+ items.
          // We want every manhwa to get its full chapter list shells today.
        }

        const detail = await scrapeManhwa(item.sourceUrl);
        await sleep(config.requestDelay.min);

        const manhwaDoc = await Manhwa.findOneAndUpdate(
          { slug: item.slug },
          {
            $set: {
              title: detail.title,
              slug: item.slug,
              cover: detail.cover || item.cover,
              synopsis: detail.synopsis,
              author: detail.author,
              artist: detail.artist,
              genres: detail.genres,
              status: detail.status,
              releaseYear: new Date().getFullYear(),
              rating: { score: 4.5 + Math.random(), votes: Math.floor(Math.random() * 1000) },
              sourceUrl: item.sourceUrl,
              latestChapter: detail.chapters.length > 0 ? detail.chapters[detail.chapters.length - 1].chapterNumber : 0,
            }
          },
          { upsert: true, new: true }
        );

        // CREATE CHAPTER SHELLS (On-Demand Ready)
        const existingChapters = await Chapter.find({ manhwaId: manhwaDoc._id }).select('chapterNumber');
        const existingNums = new Set(existingChapters.map(c => c.chapterNumber));
        const newChs = detail.chapters.filter(ch => !existingNums.has(ch.chapterNumber));

        if (newChs.length > 0) {
          const shellDocs = newChs.map(ch => ({
            manhwaId: manhwaDoc._id,
            chapterNumber: ch.chapterNumber,
            title: ch.title,
            pages: [], // Empty shell
            sourceUrl: ch.sourceUrl,
          }));
          const inserted = await Chapter.insertMany(shellDocs);
          manhwaDoc.chapters.push(...inserted.map(c => c._id));
          await manhwaDoc.save();
        }

        newItems++;
        processed++;
        if (newItems % 25 === 0 || newItems === 1) {
          console.log(`  ✅ [${processed}/${catalog.length}] NEW: ${detail.title} (${newItems} new so far)`);
          await ScrapeLog.create({
            type: 'catalog',
            status: 'success',
            itemsProcessed: processed,
            message: `Progress: ${processed}/${catalog.length} (${newItems} new, ${skipped} skipped)`
          });
        }
      } catch (err) {
        console.error(`  ❌ Error processing ${item.title}: ${err.message}`);
        processed++;
      }
      
      // Throttle slightly but keep it fast for metadata-only
      if (newItems % 10 === 0 && newItems > 0) await sleep(200);
    }

    const duration = Date.now() - startTime;
    await ScrapeLog.create({
      type: 'catalog', status: 'success',
      itemsProcessed: processed, duration,
      message: `Full Metadata Seed complete: ${processed} items`,
    });
    console.log(`\n🎉 Full Metadata Seed complete! ${processed} processed (${(duration / 1000 / 60).toFixed(1)}m)\n`);
  } catch (err) {
    console.error(`\n❌ Full Metadata Seed failed: ${err.message}\n`);
  }
}

/**
 * Incremental update — KingOfShojo
 * For now, we just check the first page of /manga/ again
 */
async function updateScrape() {
  console.log('\n🔄 UPDATE SCRAPE — KingOfShojo\n');
  const startTime = Date.now();
  try {
    const catalog = await scrapeCatalog(); // Gets the first few pages/popular
    let newChaptersCounter = 0;

    for (const item of catalog) {
      const existing = await Manhwa.findOne({ slug: item.slug });
      if (!existing) {
        // Option to seed new ones here if desired
        continue;
      }

      const detail = await scrapeManhwa(item.sourceUrl);
      if (!detail || !detail.chapters) continue;

      const existingChapters = await Chapter.find({ manhwaId: existing._id }).select('chapterNumber');
      const existingNums = new Set(existingChapters.map(c => c.chapterNumber));

      const newChs = detail.chapters.filter(ch => !existingNums.has(ch.chapterNumber));
      if (newChs.length > 0) {
        console.log(`  📥 ${existing.title}: ${newChs.length} new chapter shells added.`);
        
        const shellDocs = newChs.map(ch => ({
          manhwaId: existing._id,
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          pages: [], // Empty shell for on-demand loading
          sourceUrl: ch.sourceUrl,
        }));

        const inserted = await Chapter.insertMany(shellDocs);
        existing.chapters.push(...inserted.map(c => c._id));
        existing.latestChapter = detail.chapters[detail.chapters.length - 1].chapterNumber;
        await existing.save();

        newChaptersCounter += inserted.length;

        // [TRIGGER] Notify bookmarked users for new chapters
        try {
          const subscribers = await User.find({ bookmarks: existing._id });
          for (const ch of newChs) {
            const notifs = subscribers.map(sub => ({
              user: sub._id,
              type: 'new_chapter',
              manhwaId: existing._id,
              message: `New Chapter ${ch.chapterNumber} is available for ${existing.title}!`,
              link: `/read/${existing.slug}/${ch.chapterNumber}`
            }));
            if (notifs.length > 0) {
              await Notification.insertMany(notifs);
              console.log(`    🔔 Sent ${notifs.length} notifications for ${existing.title} Ch. ${ch.chapterNumber}`);
            }
          }
        } catch (err) {
          console.error(`    ⚠️ Failed to trigger notifications: ${err.message}`);
        }
      }

      await sleep(config.requestDelay.min);
    }

    const duration = Date.now() - startTime;
    await ScrapeLog.create({
      type: 'update', status: 'success',
      itemsProcessed: newChaptersCounter, duration,
    });
    console.log(`\n✅ Update complete! ${newChaptersCounter} new chapters\n`);
  } catch (err) {
    console.error(`\n❌ Update failed: ${err.message}\n`);
    await ScrapeLog.create({ type: 'update', status: 'error', message: err.message });
  }
}

/**
 * Targeted Batch Chapter Scrape: Symbols, Numbers, & "A"
 */
async function targetedBatchScrape() {
  const letterArg = args.find(a => a.startsWith('--letter='))?.split('=')[1];
  const allArg = args.includes('--all');

  let regex = /^[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?aA]/;
  let label = 'Symbols, Numbers, & "A"';

  if (allArg) {
    label = 'ALL REMAINING MANHWAS (Lightning Mode)';
  } else if (letterArg && letterArg.length === 1) {
    regex = new RegExp(`^${letterArg}`, 'i');
    label = `Letter "${letterArg.toUpperCase()}"`;
  }

  console.log(`\n🚀 TARGETED BATCH SCRAPE — ${label.toUpperCase()}\n`);
  const startTime = Date.now();

  try {
    const allManhwa = await Manhwa.find({}).sort({ title: 1 });
    const targetSet = allArg ? allManhwa : allManhwa.filter(m => regex.test(m.title));

    console.log(`\n📚 Sub-batch identified: ${targetSet.length} manhwa found starting with ${label}.\n`);

    let processed = 0;
    let chaptersAdded = 0;
    const limit = args.find(a => a.startsWith('--limit='))?.split('=')[1] || null;

    for (const manhwa of targetSet) {
      if (limit && processed >= parseInt(limit)) break;
      try {
        console.log(`  📖 [${processed + 1}/${targetSet.length}] Processing: ${manhwa.title}`);
        
        // Fetch fresh detail to get full chapter list from KingOfShojo
        const detail = await scrapeManhwa(manhwa.sourceUrl);
        await sleep(config.requestDelay.min);

        // Get existing chapter numbers in DB for this manhwa
        const existingChapters = await Chapter.find({ manhwaId: manhwa._id }).select('chapterNumber');
        const existingNums = new Set(existingChapters.map(c => c.chapterNumber));

        // Filter for new chapters only
        const newChapters = detail.chapters.filter(ch => !existingNums.has(ch.chapterNumber));

        if (newChapters.length === 0) {
          console.log(`    ⏭️ No new chapters to add.`);
        } else {
          console.log(`    📥 Found ${newChapters.length} new chapters. Ingesting...`);
          
          for (const ch of newChapters) {
            // ON-DEMAND ARCHITECTURE: Seeding empty shells (no page scraping)
            const chapterDoc = await Chapter.create({
              manhwaId: manhwa._id,
              chapterNumber: ch.chapterNumber,
              title: ch.title,
              pages: [], // Will be lazily loaded by the backend API on first read
              sourceUrl: ch.sourceUrl,
            });

            manhwa.chapters.push(chapterDoc._id);
            chaptersAdded++;

            // [TRIGGER] Notify bookmarked users
            try {
              const subscribers = await User.find({ bookmarks: manhwa._id });
              const notifs = subscribers.map(sub => ({
                user: sub._id,
                type: 'new_chapter',
                manhwaId: manhwa._id,
                message: `New Chapter ${ch.chapterNumber} is available for ${manhwa.title}!`,
                link: `/read/${manhwa.slug}/${ch.chapterNumber}`
              }));
              if (notifs.length > 0) {
                  await Notification.insertMany(notifs);
                  console.log(`    🔔 Sent ${notifs.length} notifications for ${manhwa.title} Ch. ${ch.chapterNumber}`);
              }
            } catch (err) {
              console.error(`    ⚠️ Failed to trigger notifications: ${err.message}`);
            }
          }

          // Update metadata
          manhwa.latestChapter = Math.max(0, ...detail.chapters.map(c => c.chapterNumber));
          manhwa.updatedAt = new Date();
          await manhwa.save();
          console.log(`    ✅ Updated ${manhwa.title}`);
        }

        processed++;
      } catch (err) {
        console.error(`  ❌ Error processing ${manhwa.title}: ${err.message}`);
      }
      
      // Safety throttle between titles
      await sleep(config.requestDelay.max);
    }

    const duration = Date.now() - startTime;
    await ScrapeLog.create({
      type: 'update', status: 'success',
      itemsProcessed: chaptersAdded, duration,
      message: `Targeted Batch complete: ${processed} titles, ${chaptersAdded} chapters added.`,
    });
    console.log(`\n🎉 Batch complete! ${chaptersAdded} chapters added across ${processed} titles (${(duration / 1000 / 60).toFixed(1)}m)\n`);
  } catch (err) {
    console.error(`\n❌ Targeted Batch failed: ${err.message}\n`);
  }
}

/**
 * Scrape Single Manhwa — Full Depth (Metadata + Chapters)
 */
async function scrapeSingle(slug) {
  console.log(`\n🔍 STARTING SINGLE SCRAPE — Slug: ${slug}\n`);
  try {
    // Construct full URL if only slug provided
    let sourceUrl = slug;
    if (!slug.startsWith('http')) {
      sourceUrl = `${config.baseURL}/manga/${slug}/`;
    }
    
    console.log(`  🌐 Target URL: ${sourceUrl}`);
    const detail = await scrapeManhwa(sourceUrl);
    if (!detail) throw new Error('No data found for this slug');

    let manhwaDoc = await Manhwa.findOne({ slug });
    if (!manhwaDoc) {
      manhwaDoc = new Manhwa({
        title: detail.title,
        slug,
        cover: detail.cover,
        synopsis: detail.synopsis,
        author: detail.author,
        artist: detail.artist,
        genres: detail.genres,
        status: detail.status,
      });
    } else {
      manhwaDoc.title = detail.title;
      manhwaDoc.synopsis = detail.synopsis;
      manhwaDoc.status = detail.status;
      manhwaDoc.genres = detail.genres;
      manhwaDoc.author = detail.author;
      manhwaDoc.artist = detail.artist;
      if (detail.cover) manhwaDoc.cover = detail.cover;
    }

    await manhwaDoc.save();
    console.log(`  ✅ Manhwa metadata updated: ${detail.title}`);

    // Process Chapters
    const existingChapters = await Chapter.find({ manhwaId: manhwaDoc._id }).select('chapterNumber');
    const existingNums = new Set(existingChapters.map(c => c.chapterNumber));
    const newChs = detail.chapters.filter(ch => !existingNums.has(ch.chapterNumber));

    console.log(`  📥 Found ${detail.chapters.length} total, ${newChs.length} are new.`);

    for (const ch of newChs) {
      try {
        const pages = await scrapeChapter(ch.sourceUrl);
        if (pages.length === 0) continue;

        // Use source URLs directly — Cloudinary free tier can't handle thousands of chapter pages
        const uploadedPages = pages.map((pageUrl, i) => ({ url: pageUrl, order: i }));

        const chapterDoc = await Chapter.create({
          manhwaId: manhwaDoc._id,
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          pages: uploadedPages, // Already mapped in uploadChapterPages
          sourceUrl: ch.sourceUrl,
        });

        manhwaDoc.chapters.push(chapterDoc._id);
        manhwaDoc.latestChapter = Math.max(manhwaDoc.latestChapter || 0, ch.chapterNumber);
        await manhwaDoc.save();
        
        await ScrapeLog.create({
          type: 'update',
          status: 'success',
          message: `⭐ ${detail.title}: Added Chapter ${ch.chapterNumber} (${pages.length} pages)`
        });
        
        console.log(`    ⭐ Added Chapter ${ch.chapterNumber}`);
      } catch (chErr) {
        console.error(`    ❌ Error on chapter ${ch.chapterNumber}: ${chErr.message}`);
        await ScrapeLog.create({
          type: 'update',
          status: 'error',
          message: `❌ ${detail.title} (Ch ${ch.chapterNumber}): ${chErr.message}`
        });
      }
    }

    await ScrapeLog.create({
      type: 'update',
      status: 'success',
      message: `Single Scrape complete for ${slug}: ${newChs.length} chapters added.`
    });

  } catch (err) {
    console.error(`\n❌ Single scrape failed for ${slug}: ${err.message}\n`);
    await ScrapeLog.create({ type: 'update', status: 'error', message: `Single Scrape failed (${slug}): ${err.message}` });
  }
}

/* CLI Entry Point */
const args = process.argv.slice(2);
if (args.includes('--seed') || args.includes('--full-seed') || args.includes('--update') || args.includes('--batch')) {
  (async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB connected');
      if (args.includes('--seed')) await seedScrape();
      else if (args.includes('--full-seed')) await fullMetadataSeed();
      else if (args.includes('--update')) await updateScrape();
      else if (args.includes('--batch')) await targetedBatchScrape();
    } catch (err) {
      console.error('❌ Error:', err.message);
    } finally {
      await mongoose.disconnect();
      process.exit(0);
    }
  })();
}

export { seedScrape, updateScrape, targetedBatchScrape, fullMetadataSeed, scrapeSingle };

