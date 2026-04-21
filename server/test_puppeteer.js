import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as cheerio from 'cheerio';

puppeteer.use(StealthPlugin());

async function test() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  console.log('Navigating to manhwaclan.com/manga/list-mode/ ...');
  try {
    await page.goto('https://manhwaclan.com/manga/list-mode/', { waitUntil: 'networkidle2', timeout: 30000 });
    const content = await page.content();
    const $ = cheerio.load(content);
    
    const items = $('.manga-title-badges, .post-title').length;
    console.log(`Found ${items} items with normal selectors.`);
    
    if (items === 0) {
        console.log("Checking alt selectors...");
        const altItems = $('a.post-title, .page-listing-item a, .manga h3 a, .page-item-detail').length;
        console.log(`Found ${altItems} alt items.`);
    }
    
    console.log("Page title:", await page.title());
  } catch (err) {
    console.error('Error fetching list:', err.message);
  } finally {
    await browser.close();
  }
}

test();
