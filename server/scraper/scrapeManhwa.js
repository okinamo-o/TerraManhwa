import axios from 'axios';
import * as cheerio from 'cheerio';
import { fetchHtml } from './scrapeCatalog.js';

/**
 * Scrape manhwa details and chapter list from KingOfShojo
 */
export async function scrapeManhwa(sourceUrl) {
  console.log(`  📖 Fetching details: ${sourceUrl}`);
  
  try {
    const html = await fetchHtml(sourceUrl);
    const $ = cheerio.load(html);
    
    const title = $('.entry-title').text().trim();
    const synopsis = $('.entry-content p').text().trim() || $('.entry-content').text().trim();
    const cover = $('.thumb img').attr('src');
    
    // Improved Metadata parsing via infotable
    const getMeta = (label) => {
      return $('.infotable tr').filter((i, el) => $(el).text().includes(label)).find('td:last-child').text().trim() || 
             $('.imptdt').filter((i, el) => $(el).text().includes(label)).find('i').text().trim();
    };

    const genres = [];
    $('.genre-info a').each((i, el) => {
      genres.push($(el).text().trim());
    });
    
    const status = getMeta('Status') || 'Ongoing';
    const author = getMeta('Author') || 'Unknown';
    const artist = getMeta('Artist') || 'Unknown';
    const type = getMeta('Type') || 'Manhwa';
    
    const chapters = [];
    $('.eplister li').each((i, el) => {
      const a = $(el).find('a');
      const href = a.attr('href');
      const numText = $(el).find('.chapternum').text().trim();
      const num = parseFloat(numText.replace(/,/g, '').match(/\d+(\.\d+)?/)?.[0]) || 0;
      const titleText = $(el).find('.chapterdate').text().trim(); // Date or additional title info

      if (href) {
        chapters.push({
          chapterNumber: num,
          title: `Chapter ${num}`,
          sourceUrl: href,
          uploadedAt: new Date(), // KingOfShojo doesn't always have easy dates
        });
      }
    });

    // Handle reverse order (usually they are desc, we want asc for seed but index.js handles sorting)
    
    return {
      title,
      synopsis,
      cover,
      genres,
      status,
      author,
      artist,
      chapters: chapters.reverse(), // Reverse to get oldest first for chronological ingestion
    };
  } catch (err) {
    throw new Error(`Failed to scrape manhwa at ${sourceUrl}: ${err.message}`);
  }
}
