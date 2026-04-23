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
      // Prioritize data-lazy-src and data-src as they usually contain the real image URL
      let src = $(el).attr('data-lazy-src') || $(el).attr('data-src') || $(el).attr('src');
      
      if (src) {
        src = src.trim();
        if (src.startsWith('//')) src = `https:${src}`;
        
        // Skip base64 placeholders, small icons, and generic "lazy" strings
        const isPlaceholder = src.startsWith('data:image') || 
                            src.includes('blank.png') || 
                            src.includes('grey.gif') ||
                            src.includes('loading') ||
                            src.includes('lazy');

        if (src && !isPlaceholder) {
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
