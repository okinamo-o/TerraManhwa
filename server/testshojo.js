import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
  try {
    const r = await axios.get('https://kingofshojo.com/manga/', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(r.data);
    const items = $('.bsx');
    console.log(`Found ${items.length} items`);
    
    if (items.length > 0) {
      items.slice(0, 3).each((i, el) => {
        const title = $(el).find('.tt').text().trim();
        const link = $(el).find('a').attr('href');
        const cover = $(el).find('img').attr('src');
        console.log(`- ${title} : ${link} (Cover: ${cover})`);
      });
      
      const firstLink = items.first().find('a').attr('href');
      const r2 = await axios.get(firstLink, { headers: { 'User-Agent': 'Mozilla/5.0' }});
      const $2 = cheerio.load(r2.data);
      
      const synopsis = $2('.entry-content').text().trim();
      console.log('Synopsis:', synopsis.substring(0, 100));
      
      const chapters = $2('.eplister li a');
      console.log(`Found ${chapters.length} chapters`);
      
      if(chapters.length > 0){
          const chLink = chapters.first().attr('href');
          const r3 = await axios.get(chLink, { headers: { 'User-Agent': 'Mozilla/5.0' }});
          const $3 = cheerio.load(r3.data);
          
          const pages = $3('#readerarea img');
          console.log(`Found ${pages.length} pages in chapter`);
      }
    }
  } catch (e) {
    console.error(e.message);
  }
}
test();
