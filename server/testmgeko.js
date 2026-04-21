import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
  try {
    const r = await axios.get('https://mgeko.cc/browse-comics/?genre=manhwa', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(r.data);
    
    const items = $('li.novel-item');
    console.log(`Found ${items.length} manhwas`);
    
    if (items.length > 0) {
      const first = items.first();
      const link = first.find('a').attr('href');
      console.log('Fetching manhwa detail:', link);
      
      const r2 = await axios.get(link, { headers: { 'User-Agent': 'Mozilla/5.0' }});
      const $2 = cheerio.load(r2.data);
      
      const title = $2('.novel-title').text().trim() || $2('h1').text().trim();
      const synopsis = $2('.description').text().trim() || $2('.summary').text().trim();
      const cover = $2('.novel-cover img').attr('src') || $2('.summary_image img').attr('src');
      
      console.log('Title:', title);
      console.log('Cover:', cover);
      console.log('Synopsis:', synopsis);
      
      const chapters = $2('.chapter-list li a, ul.chapter-list li a');
      console.log(`Found ${chapters.length} chapters.`);
      
      if (chapters.length > 0) {
        const firstChLink = chapters.first().attr('href');
        console.log('Fetching first chapter:', firstChLink);
        
        const r3 = await axios.get('https://mgeko.cc' + firstChLink, { headers: { 'User-Agent': 'Mozilla/5.0' }});
        const $3 = cheerio.load(r3.data);
        
        const imgs = $3('#chapter-reader img, .reading-content img');
        console.log(`Found ${imgs.length} images.`);
        if (imgs.length > 0) {
           console.log('First img:', imgs.first().attr('src'));
        }
      }
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}
test();
