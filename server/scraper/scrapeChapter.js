import * as cheerio from 'cheerio';
import { fetchHtml } from './scrapeCatalog.js';

/**
 * Scrape individual chapter pages from KingOfShojo
 * Returns: Array of image URLs
 */
export async function scrapeChapter(chapterUrl) {
  console.log(`    📄 Fetching chapter pages: ${chapterUrl}`);
  
  try {
    const html = await fetchHtml(chapterUrl);
    const $ = cheerio.load(html);
    
    const pages = [];
    $('#readerarea img').each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src && !src.includes('lazy')) {
        pages.push(src.trim());
      }
    });

    // Filtering out potential ad images or small icons if necessary
    const filteredPages = pages.filter(p => !p.includes('banner') && !p.includes('logo'));

    console.log(`      ✅ Found ${filteredPages.length} pages`);
    return filteredPages;
  } catch (err) {
    console.error(`      ❌ Error scraping chapter @ ${chapterUrl}: ${err.message}`);
    return [];
  }
}
