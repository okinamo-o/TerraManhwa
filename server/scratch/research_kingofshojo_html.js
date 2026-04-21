import axios from 'axios';
import * as cheerio from 'cheerio';

async function research() {
  try {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    const resManga = await axios.get('https://kingofshojo.com/manga/tears-on-a-withered-flower/', {
      headers: { 'User-Agent': userAgent }
    });
    const $ = cheerio.load(resManga.data);
    
    console.log('--- Body Sample ---');
    console.log($('body').html().substring(0, 2000));
    
    console.log('\n--- Checking Info ---');
    $('.imptdt').each((i, el) => {
        console.log(`Class 'imptdt' text: "${$(el).text().trim()}"`);
    });
    
    $('.infotable tr').each((i, el) => {
        console.log(`Table row: "${$(el).text().trim()}"`);
    });

  } catch (err) {
    console.error('Error:', err.message);
  }
}
research();
