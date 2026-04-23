import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
  try {
    const res = await axios.get('https://kingofshojo.com/marriage-blues-chapter-1/', { 
      headers: { 'User-Agent': 'Mozilla/5.0' } 
    });
    const $ = cheerio.load(res.data);
    $('#readerarea img').each((i, el) => {
      if (i < 5) {
        console.log(i, 'src:', $(el).attr('src'));
        console.log('   data-src:', $(el).attr('data-src'));
        console.log('   data-lazy-src:', $(el).attr('data-lazy-src'));
      }
    });
  } catch(e) { 
    console.error(e.message); 
  }
}
test();
