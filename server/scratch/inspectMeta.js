import axios from 'axios';
import * as cheerio from 'cheerio';

async function testSearch() {
  const titleHint = "Villain";
  const searchUrl = `https://kingofshojo.com/?s=${encodeURIComponent(titleHint)}`;
  try {
    const res = await axios.get(searchUrl);
    const $search = cheerio.load(res.data);
    const firstResult = $search('.bsx a').first().attr('href');
    console.log('Search Result:', firstResult);
  } catch (err) {
    console.error('Search failed:', err.message);
  }
}

testSearch();
