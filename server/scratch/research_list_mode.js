import axios from 'axios';
import * as cheerio from 'cheerio';

async function research() {
  try {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    const res = await axios.get('https://kingofshojo.com/manga/list-mode/', {
      headers: { 'User-Agent': userAgent }
    });
    const $ = cheerio.load(res.data);
    
    const items = $('.soralist .bloko a');
    console.log(`Total items found: ${items.length}`);
    
    if (items.length > 0) {
        console.log('Sample data (first 5):');
        items.slice(0, 5).each((i, el) => {
            console.log(`- ${$(el).text().trim()} : ${$(el).attr('href')}`);
        });
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}
research();
