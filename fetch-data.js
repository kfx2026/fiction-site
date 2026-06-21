/**
 * fetch-data.js
 * =============
 * Pull published books & chapters from FictionVerse Worker API,
 * write them to local data/books.json and data/chapters/*.json.
 * 
 * Usage:
 *   WORKER_API_URL=https://fiction-verse-api.xxx.workers.dev node fetch-data.js
 * 
 * This script is run by GitHub Actions before build.js.
 */

const fs = require('fs');
const path = require('path');

const WORKER_API = process.env.WORKER_API_URL;
if (!WORKER_API) {
  console.log('WORKER_API_URL not set. Skipping fetch. Using local data files.');
  process.exit(0);
}

async function main() {
  console.log(`Fetching from ${WORKER_API}...`);

  // Fetch books
  const booksResp = await fetch(`${WORKER_API}/api/books.json`);
  if (!booksResp.ok) {
    console.error(`Failed to fetch books: ${booksResp.status}`);
    process.exit(1);
  }
  const books = await booksResp.json();
  console.log(`  Got ${books.length} books`);

  // Fetch chapters for each book
  for (const book of books) {
    const chResp = await fetch(`${WORKER_API}/api/chapters/${book.slug}.json`);
    if (chResp.ok) {
      const chs = await chResp.json();
      const chPath = `data/chapters/${book.slug}.json`;
      fs.mkdirSync('data/chapters', { recursive: true });
      fs.writeFileSync(chPath, JSON.stringify(chs, null, 2));
      console.log(`  Chapters: ${book.slug} (${chs.length})`);
    }
  }

  // Write books.json
  // Strip D1-specific fields before writing
  const cleanBooks = books.map(b => {
    const { published, chapter_count, ...rest } = b;
    return rest;
  });

  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync('data/books.json', JSON.stringify(cleanBooks, null, 2));
  console.log(`\n✅ Wrote data/books.json (${cleanBooks.length} books)`);
  console.log('Ready for build.js');
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
