import { scrapeManhwa } from '../scraper/scrapeManhwa.js';

const testUrl = 'https://kingofshojo.com/manga/i-am-the-fated-villain/';

async function test() {
  try {
    const data = await scrapeManhwa(testUrl);
    console.log('Scraped Data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Test failed:', err);
  }
}

test();
