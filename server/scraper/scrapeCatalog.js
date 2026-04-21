import axios from 'axios';
import * as cheerio from 'cheerio';
import config from './config.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch with retries and 429 handling
 */
export async function fetchHtml(url, attempt = 1) {
  try {
    const res = await axios.get(url, {
      headers: config.headers,
      timeout: 25000,
    });
    return res.data;
  } catch (err) {
    if (attempt <= config.retryAttempts) {
      let delay = config.retryDelay * attempt;
      if (err.response && err.response.status === 429) {
        delay = 15000 * attempt;
        console.log(`  ✋ Rate Limited (429)! Backing off for ${delay}ms...`);
      } else {
        console.log(`  ⚠️ Retry ${attempt}/${config.retryAttempts} for ${url} (${err.message})`);
      }
      await sleep(delay);
      return fetchHtml(url, attempt + 1);
    }
    throw new Error(`Failed to fetch ${url} after ${config.retryAttempts} attempts: ${err.message}`);
  }
}

/**
 * Scrape catalog from KingOfShojo
 * Returns: [{ title, slug, sourceUrl, cover }]
 */
export async function scrapeCatalog(page = 1) {
  const url = page > 1 
    ? `${config.baseURL}/manga/page/${page}/?order=popular`
    : `${config.baseURL}/manga/?order=popular`;

  console.log(`📚 Scraping catalog from KingOfShojo (Page ${page})...`);
  const results = [];
  
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    
    $('.bsx').each((i, el) => {
      const title = $(el).find('.tt').text().trim();
      const sourceUrl = $(el).find('a').attr('href');
      const cover = $(el).find('img').attr('src');
      
      const slugMatch = sourceUrl.match(/\/manga\/([^/]+)\/$/);
      const slug = slugMatch ? slugMatch[1] : sourceUrl.split('/').filter(Boolean).pop();

      if (title && slug) {
        results.push({
          title,
          slug,
          sourceUrl,
          cover,
        });
      }
    });

    // Deduplicate by slug to prevent DB unique index collisions
    const seen = new Set();
    const uniqueResults = results.filter(item => {
      if (seen.has(item.slug)) return false;
      seen.add(item.slug);
      return true;
    });

    console.log(`  ✅ Page ${page} complete: ${uniqueResults.length} unique items found`);
    return uniqueResults;
  } catch (err) {
    console.error(`  ❌ Error fetching catalog: ${err.message}`);
    return [];
  }
}

/**
 * Scrape full index from list-mode
 * Returns: [{ title, sourceUrl }]
 */
export async function scrapeListMode() {
  console.log('📚 Scraping full list-mode from KingOfShojo...');
  const results = [];
  
  try {
    const html = await fetchHtml(`${config.baseURL}/manga/list-mode/`);
    const $ = cheerio.load(html);
    
    $('a.series.tip').each((i, el) => {
      const title = $(el).text().trim();
      const sourceUrl = $(el).attr('href');
      
      const slugMatch = sourceUrl.match(/\/manga\/([^/]+)\/$/);
      const slug = slugMatch ? slugMatch[1] : sourceUrl.split('/').filter(Boolean).pop();

      if (title && slug) {
        results.push({ title, slug, sourceUrl });
      }
    });

    console.log(`  ✅ List-mode complete: ${results.length} manhwa found`);
    return results;
  } catch (err) {
    console.error(`  ❌ Error fetching list-mode: ${err.message}`);
    return [];
  }
}
