import cloudscraper from 'cloudscraper';
import * as cheerio from 'cheerio';

async function test() {
  console.log('Fetching with cloudscraper...');
  try {
    const html = await cloudscraper.get('https://manhwaclan.com/manga/list-mode/');
    const $ = cheerio.load(html);
    
    const items = $('.manga-title-badges, .post-title').length;
    console.log(`Found ${items} items with normal selectors.`);
    
    const title = $('title').text();
    console.log("Page title:", title);
  } catch (err) {
    console.error('Error fetching list:', err.message);
  }
}

test();
