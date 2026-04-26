import axios from 'axios';
import * as cheerio from 'cheerio';
import { fetchHtml } from './scrapeCatalog.js';

/**
 * Scrape manhwa details and chapter list from KingOfShojo
 * With Smart-Search fallback for broken slugs
 */
export async function scrapeManhwa(sourceUrl, titleHint = '') {
  console.log(`  📖 Fetching details: ${sourceUrl}`);
  
  try {
    let html;
    try {
      html = await fetchHtml(sourceUrl);
    } catch (err) {
      if (err.message.includes('404') && titleHint) {
        console.log(`  🔍 404 detected. Attempting smart search for: "${titleHint}"`);
        
        // Try exact first, then a cleaned version
        const searchTerms = [
          titleHint,
          titleHint.replace(/['’]/g, '').replace(/[^\w\s]/g, ' ').trim() // Remove punctuation
        ];

        let firstResult = null;
        for (const term of searchTerms) {
          const searchUrl = `https://kingofshojo.com/?s=${encodeURIComponent(term)}`;
          const searchHtml = await fetchHtml(searchUrl);
          const $search = cheerio.load(searchHtml);
          firstResult = $search('.bsx a').first().attr('href');
          if (firstResult && firstResult.includes('/manga/')) break;
        }

        if (firstResult && firstResult.includes('/manga/')) {
          console.log(`  ✨ Found correct URL via fuzzy search: ${firstResult}`);
          sourceUrl = firstResult;
          html = await fetchHtml(sourceUrl);
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    const $ = cheerio.load(html);
    
    const title = $('.entry-title').text().trim() || titleHint || sourceUrl.split('/').filter(Boolean).pop().replace(/-/g, ' ');
    
    // Safety check: Is this a real manhwa page?
    if (!$('.entry-title').length && !$('.thumb img').length) {
       throw new Error('Page content missing - possible invalid slug or 404');
    }

    const synopsis = $('.entry-content p').text().trim() || $('.entry-content').text().trim();
    const cover = $('.thumb img').attr('src');
    
    const getMeta = (label) => {
      const lowerLabel = label.toLowerCase();
      let val = '';
      
      // Try infotable with case-insensitive search
      $('.infotable tr').each((i, el) => {
        const firstTd = $(el).find('td:first-child').text().toLowerCase();
        if (firstTd.includes(lowerLabel)) {
          val = $(el).find('td:last-child').text().trim();
        }
      });

      // If placeholder found, treat as empty so fallback can try other sources/labels
      if (val) {
        const lowerVal = val.toLowerCase();
        if (lowerVal === 'n/a' || lowerVal === 'na' || lowerVal === 'unknown' || lowerVal === 'none' || lowerVal === '-') {
          val = '';
        }
      }

      if (val) return val;

      // Try imptdt
      $('.imptdt').each((i, el) => {
        const rowText = $(el).text().toLowerCase();
        if (rowText.includes(lowerLabel)) {
          val = $(el).find('i').text().trim() || $(el).find('span').text().trim() || $(el).text().replace(label, '').replace(/:/g, '').trim();
        }
      });
      
      // Second placeholder check
      if (val) {
        const lowerVal = val.toLowerCase();
        if (lowerVal === 'n/a' || lowerVal === 'na' || lowerVal === 'unknown' || lowerVal === 'none' || lowerVal === '-') {
          val = '';
        }
      }
      
      return val;
    };

    // Aggressive fallbacks for labels
    const author = getMeta('Author') || getMeta('Writer') || getMeta('Creator') || 'Unknown';
    const artist = getMeta('Artist') || getMeta('Illustrator') || getMeta('Painter') || 'Unknown';
    const type = getMeta('Type') || 'Manhwa';

    const genres = [];
    $('.genre-info a, .mgen a, a[rel="tag"]').each((i, el) => {
      const g = $(el).text().trim();
      if (g && !genres.includes(g)) {
        genres.push(g);
      }
    });
    
    // Normalize status to match DB enum (fallback to aggressive text search if getMeta fails)
    let normalizedStatus = 'Ongoing';
    const rawStatus = (getMeta('Status') || $('.tsinfo').text() || $('.infotable').text() || '').toLowerCase();
    
    if (rawStatus.includes('completed') || rawStatus.includes('finish') || rawStatus.includes('end')) normalizedStatus = 'Completed';
    else if (rawStatus.includes('hiatus')) normalizedStatus = 'Hiatus';
    else if (rawStatus.includes('dropped')) normalizedStatus = 'Dropped';
    else if (rawStatus.includes('ongoing') || rawStatus.includes('on going')) normalizedStatus = 'Ongoing';
    
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

    return {
      title,
      synopsis,
      cover,
      genres,
      status: normalizedStatus,
      author,
      artist,
      chapters: chapters.reverse(), // Reverse to get oldest first for chronological ingestion
      sourceUrl, // Return the final verified URL
    };
  } catch (err) {
    throw new Error(`Failed to scrape manhwa at ${sourceUrl}: ${err.message}`);
  }
}
