import { scrapeChapter } from './scraper/scrapeChapter.js';

async function test() {
  const url = 'https://kingofshojo.com/marriage-blues-chapter-1/';
  const pages = await scrapeChapter(url);
  console.log('Pages found:', pages.length);
  for (let i = 0; i < Math.min(5, pages.length); i++) {
    console.log(`Page ${i}: ${pages[i]}`);
  }
}
test();
