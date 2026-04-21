import { scrapeCatalog } from './scrapeCatalog.js';
import { scrapeManhwa } from './scrapeManhwa.js';

async function test() {
  console.log("Testing catalog...");
  try {
    const catalog = await scrapeCatalog();
    console.log(`Found ${catalog?.length} items in catalog.`);
    if (catalog?.length > 0) {
      console.log("First item:", catalog[0]);
    }
  } catch (err) {
    console.error("Catalog scrape error:", err);
  }

  console.log("\nTesting single manhwa (solo-leveling)...");
  try {
    const detail = await scrapeManhwa('solo-leveling');
    console.log("Detail title:", detail.title);
    console.log("Chapters found:", detail.chapters?.length);
    if (detail.chapters?.length > 0) {
      console.log("First chapter:", detail.chapters[0]);
    }
  } catch (err) {
    console.error("Manhwa scrape error:", err);
  }
}

test();
