import axios from 'axios';
import * as cheerio from 'cheerio';

async function research() {
  try {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    
    // 1. Check Metadata for a specific manhwa
    console.log('--- Metadata Check ---');
    const resManga = await axios.get('https://kingofshojo.com/manga/tears-on-a-withered-flower/', {
      headers: { 'User-Agent': userAgent }
    });
    const $ = cheerio.load(resManga.data);
    $('.tsinfo .imptdt').each((i, el) => {
        const text = $(el).text().trim();
        console.log(`Metadata entry: "${text}"`);
    });
    
    // 2. Check Pagination structure
    console.log('\n--- Pagination Check ---');
    const resCatalog = await axios.get('https://kingofshojo.com/manga/page/2/?order=popular', {
      headers: { 'User-Agent': userAgent }
    });
    const $c = cheerio.load(resCatalog.data);
    const pageItems = $c('.bsx').length;
    console.log(`Items on Page 2: ${pageItems}`);
    const nextBtn = $c('a.next.page-numbers').length;
    console.log(`Next page button exists: ${nextBtn > 0}`);

  } catch (err) {
    console.error('Error during research:', err.message);
    if (err.response) console.error('Data:', err.response.data);
  }
}
research();
