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
    
    const title = $('.entry-title').text().trim() || sourceUrl.split('/').filter(Boolean).pop().replace(/-/g, ' ');
    const synopsis = $('.entry-content p').text().trim() || $('.entry-content').text().trim();
    const cover = $('.thumb img').attr('src');
    
    // Aggressive Metadata parsing that handles various MangaTheme DOM structures
    const getMeta = (label) => {
      let val = $('.infotable tr').filter((i, el) => $(el).text().includes(label)).find('td:last-child').text().trim();
      if (val) return val;

      const impt = $('.imptdt').filter((i, el) => $(el).text().includes(label));
      val = impt.find('i').text().trim() || impt.find('span').text().trim() || impt.text().replace(label, '').trim();
      return val;
    };

    const genres = [];
    $('.genre-info a, .mgen a').each((i, el) => {
      genres.push($(el).text().trim());
    });
    
    // Normalize status to match DB enum (fallback to aggressive text search if getMeta fails)
    let normalizedStatus = 'Ongoing';
    const rawStatus = (getMeta('Status') || $('.tsinfo').text() || $('.infotable').text() || '').toLowerCase();
    
    if (rawStatus.includes('completed') || rawStatus.includes('finish') || rawStatus.includes('end')) normalizedStatus = 'Completed';
    else if (rawStatus.includes('hiatus')) normalizedStatus = 'Hiatus';
    else if (rawStatus.includes('dropped')) normalizedStatus = 'Dropped';
    else if (rawStatus.includes('ongoing') || rawStatus.includes('on going')) normalizedStatus = 'Ongoing';
    
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
      status: normalizedStatus,
      author,
      artist,
      chapters: chapters.reverse(), // Reverse to get oldest first for chronological ingestion
    };
  } catch (err) {
    throw new Error(`Failed to scrape manhwa at ${sourceUrl}: ${err.message}`);
  }
}
