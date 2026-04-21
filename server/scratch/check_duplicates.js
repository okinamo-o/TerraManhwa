import { scrapeCatalog } from '../scraper/scrapeCatalog.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  const catalog = await scrapeCatalog();
  const slugs = catalog.map(c => c.slug);
  const duplicates = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  console.log('Total items:', catalog.length);
  console.log('Unique items:', new Set(slugs).size);
  console.log('Duplicates:', duplicates);
  process.exit(0);
}
check();
