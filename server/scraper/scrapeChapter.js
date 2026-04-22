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
      let src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
      if (src) {
        src = src.trim();
        if (src.startsWith('//')) src = `https:${src}`;
        if (src && !src.includes('lazy')) {
          pages.push(src);
        }
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
