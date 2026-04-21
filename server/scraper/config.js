export default {
  baseURL: 'https://kingofshojo.com',
  requestDelay: { min: 1000, max: 2000 }, // Slightly slower to be safe with HTML scraping
  maxConcurrent: 1,
  retryAttempts: 3,
  retryDelay: 3000,
  
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  }
};
