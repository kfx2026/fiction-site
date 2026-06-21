/**
 * FictionVerse — Bing SEO Static Site Builder
 * 
 * 用法: node build.js
 * 读取 data/books.json → 生成 index.html + 每本书的详情页 + 每章独立页 + sitemap.xml
 * 
 * 增量更新铁律：
 *   - 新增小说: 编辑 books.json → node build.js → deploy
 *   - 更新章节: 编辑 chapters/{slug}.json → node build.js → deploy
 *   - 一次只改一个文件！
 */
const fs = require('fs');
const path = require('path');

// ─── 读取数据 ───
const books = JSON.parse(fs.readFileSync('data/books.json', 'utf-8'));

for (const book of books) {
  const chPath = `data/chapters/${book.slug}.json`;
  if (fs.existsSync(chPath)) {
    const chs = JSON.parse(fs.readFileSync(chPath, 'utf-8'));
    book.chapters = chs.length;
    book.wordCount = chs.reduce((s, c) => s + (c.wordCount || 0), 0);
  }
}

// ─── 生成章节数据（首次） ───
const chapterTitles = {
  'dao-celestial-blade': [
    "The Weakest Disciple", "Jade Pendant's Secret", "First Sword Form", "Elder's Suspicion",
    "Night Training", "Sparring Match", "Hidden Potential", "Moonlit Duel",
    "Sect Tournament Begins", "Breaking Through", "The Ancient Manual", "Trials of the Seven Stars",
    "Betrayal Within", "Escape from the Sect", "Wilderness Survival", "The Sword God's Memory",
    "First True Battle", "Wandering Blade", "City of Thieves", "Underground Arena",
    "Master of Shadows", "Reunion", "The Forgotten Temple", "Trial of Fire",
    "Ancestral Blade", "Return to Seven Stars", "Confronting the Sect Leader", "Divine Sword Awakens",
    "The Celestial Gate", "Army of Darkness", "Battle of the Fallen", "Sacrifice",
    "Rising from Ashes", "The Final Form", "Destiny Fulfilled", "New Era Begins",
    "Whispers of the Past", "Unexpected Alliance", "Shadow of the Abyss", "Gathering Storm",
    "War Council", "The Celestial Blade"
  ],
  'last-oracle-shanghai': [
    "The Antique Shop", "First Customer", "Death Date", "Three Generations",
    "Night Market", "Lao Wang's Warning", "Billionaire's Secret", "The Old Photograph",
    "Bund District Chase", "Hidden Ledger", "French Concession", "Grandmother's Diary",
    "The Fortune Teller's Guild", "Rival Oracle", "Tea House Meeting", "The Yellow Crane Tower",
    "1937 Files", "Underground Tunnels", "The Jade Ring", "Betrayal on the Bund",
    "Midnight on Nanjing Road", "The Forgotten Temple", "Ancestral Power", "Confronting the CEO",
    "The Real Death Date", "Family Reunion", "Shanghai Dawn", "New Beginnings",
    "The Next Oracle", "Fate's Thread", "Old Enemies Return", "The Dragon's Gate",
    "Council of Elders", "The Prophecy Revealed", "Battle at the Pearl Tower", "Sacred Ground",
    "Legacy", "Epilogue: The Shop Continues"
  ],
  'system-crash-reboot': [
    "Launch Day", "No Logout", "First Death", "Source Code",
    "Self-Aware NPC", "Beta Tester Alliance", "Glitched Zone", "The Admin Room",
    "Corrupted Data", "Player Guild", "Boss Fight", "Rewriting Reality",
    "NPC Rebellion", "The Architect AI", "Escape Plan", "Server Core",
    "System Admin", "Backdoor", "Real World Connection", "Emergency Protocol",
    "Data Corruption", "Last Safe Zone", "Final Boss", "The Choice",
    "Reboot Sequence", "Aftermath", "New Rules", "Faction Wars",
    "The Second Crash", "Hidden Players", "Admin Privileges", "Game vs Reality",
    "The Merge", "Digital Consciousness", "Sacrifice Play", "Last Stand",
    "The True Architect", "Code of Life", "Final Protocol", "Reboot",
    "Loading...", "New Game Plus", "Echoes of the Old World", "Rising Threats",
    "The Council of Players", "Server War", "Alliance of AIs", "The Nexus",
    "Breaking the Loop", "True Freedom", "Afterword", "Dev Room",
    "Patch Notes", "The Secret Ending", "Epilogue: Player One", "Credits Roll"
  ]
};

// 首次生成 chapters/*.json
for (const book of books) {
  const chPath = `data/chapters/${book.slug}.json`;
  if (!fs.existsSync(chPath)) {
    const titles = chapterTitles[book.slug] || [];
    const chs = titles.map((t, i) => ({
      number: i + 1,
      title: t,
      wordCount: 2000 + Math.floor(Math.random() * 600),
      updated: book.updated
    }));
    fs.writeFileSync(chPath, JSON.stringify(chs, null, 2));
    console.log(`  Created data/chapters/${book.slug}.json (${chs.length} chapters)`);
    book.chapters = chs.length;
    book.wordCount = chs.reduce((s, c) => s + c.wordCount, 0);
  }
}

// Read chapter data
for (const book of books) {
  const chPath = `data/chapters/${book.slug}.json`;
  if (fs.existsSync(chPath)) {
    const chs = JSON.parse(fs.readFileSync(chPath, 'utf-8'));
    book._chapters = chs;
    book.chapters = chs.length;
    book.wordCount = chs.reduce((s, c) => s + c.wordCount, 0);
  }
}

const totalChapters = books.reduce((s, b) => s + b.chapters, 0);
const totalWords = books.reduce((s, b) => s + b.wordCount, 0);
const allGenres = [...new Set(books.flatMap(b => b.genres))];

// ─── 流派分类体系 ───
const GENRE_TAXONOMY = {
  'xianxia':          { name: 'Xianxia / Cultivation',  desc: 'Cultivation, immortal heroes, ancient martial worlds' },
  'wuxia':            { name: 'Wuxia',                    desc: 'Martial arts masters, honor, and legendary blades in ancient China' },
  'urban':            { name: 'Urban Fantasy',           desc: 'Magic, supernatural forces, hidden worlds in modern cities' },
  'scifi':            { name: 'Sci-Fi',                  desc: 'Futuristic technology, space exploration, digital realities' },
  'litrpg':           { name: 'LitRPG / GameLit',        desc: 'Game mechanics, leveling systems, stats, and virtual worlds' },
  'isekai':           { name: 'Isekai / Transmigration', desc: 'Reborn in another world, portal fantasies, and parallel universes' },
  'fantasy':          { name: 'Epic Fantasy',            desc: 'Dragons, magic systems, and sprawling otherworldly realms' },
  'magic-academy':    { name: 'Magic Academy',           desc: 'Wizard schools, magical training, and academic rivalries' },
  'romance':          { name: 'Romance',                 desc: 'Love stories across settings — contemporary, historical, and fantasy' },
  'harem':            { name: 'Harem / Reverse Harem',   desc: 'Multiple love interests, romantic entanglements, and relationship drama' },
  'yaoi':             { name: 'Boys Love / Yaoi',        desc: 'Male-male romance, LGBTQ+ stories across all genres' },
  'horror':           { name: 'Horror / Thriller',       desc: 'Suspense, psychological terror, supernatural dread' },
  'apocalypse':       { name: 'Apocalypse / Survival',   desc: 'End of the world, zombie outbreaks, and post-catastrophe survival' },
  'supernatural':     { name: 'Supernatural / Paranormal', desc: 'Ghosts, vampires, werewolves, and otherworldly beings' },
  'mystery':          { name: 'Mystery / Detective',     desc: 'Whodunits, crime investigations, and puzzle-solving plots' },
  'action':           { name: 'Action / Adventure',      desc: 'High-stakes battles, quests, treasure hunts, and non-stop thrills' },
  'historical':       { name: 'Historical Fiction',      desc: 'Stories set in richly imagined historical periods' },
  'slice-of-life':    { name: 'Slice of Life',           desc: 'Everyday life, heartwarming drama, character-driven tales' },
  'comedy':           { name: 'Comedy / Satire',         desc: 'Humor, parody, and lighthearted storytelling' },
  'drama':            { name: 'Drama / Tragedy',         desc: 'Emotional depth, character conflict, and powerful storytelling' },
};

// 统计每个流派下的书籍
const genreStats = {};
for (const book of books) {
  const g = book.genre;
  if (!GENRE_TAXONOMY[g]) continue; // skip unknown genres
  if (!genreStats[g]) genreStats[g] = { ...GENRE_TAXONOMY[g], books: [] };
  genreStats[g].books.push(book);
}

// 按书籍数量排序流派
const genreOrder = Object.keys(genreStats).sort((a, b) => genreStats[b].books.length - genreStats[a].books.length);

// ─── 付费/免费分区 ───
const freeBooks = books.filter(b => b.tier === 'free');
const paidBooks = books.filter(b => b.tier === 'paid');

// ─── 模板引擎 ───
const site = { url: 'https://fiction.aichatmail.one', name: 'FictionVerse', email: 'support@fiction.aichatmail.one', company: 'FictionVerse Publishing', address: 'No. 980, Longqiao South Street, Xinfan, Xindu District, Chengdu, Sichuan, China' };

// HTML head + common styles
const BASE_HEAD = (title, desc, canonical, extra='') => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="index, follow">
<meta name="author" content="${site.name}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
${extra}
<style>
:root{--bg:#0a0b10;--card:#11131f;--text:#d8dae0;--dim:#8b8fa0;--gold:#e8c040;--purple:#9b8cf0;--accent:#7c5cf0;--accent2:#4f8cff;--green:#34c759}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Georgia,'Times New Roman',serif;color:var(--text);background:var(--bg);line-height:1.6}
a{color:inherit;text-decoration:none}
/* Header */
.hd{position:sticky;top:0;z-index:100;background:rgba(10,11,16,0.95);border-bottom:1px solid rgba(255,255,255,0.06);backdrop-filter:blur(12px)}
.hd-in{max-width:1120px;margin:0 auto;padding:12px 24px;display:flex;align-items:center;justify-content:space-between}
.hd-logo{font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:1.1rem;font-weight:700;color:#fff;letter-spacing:-0.3px}
.hd-nav{display:flex;gap:24px}
.hd-nav a{font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.82rem;color:var(--dim);transition:color 0.15s}
.hd-nav a:hover{color:var(--gold)}
/* Hero */
.hero{position:relative;background:url('/images/hero-bg.jpg') center/cover no-repeat;min-height:35vh;display:flex;align-items:flex-end}
.hero::before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,11,16,0.2) 0%,rgba(10,11,16,0.4) 60%,var(--bg) 100%);z-index:1}
.hero-in{position:relative;z-index:2;padding:36px 40px 20px;width:100%;max-width:1120px;margin:0 auto}
.hero h1{font-size:2rem;font-weight:800;color:#fff;letter-spacing:-1px;margin-bottom:4px}
.hero p{font-size:0.85rem;color:rgba(255,255,255,0.55);max-width:480px}
/* Content */
.ct{max-width:1120px;margin:0 auto;padding:0 24px 40px}
.tb{display:flex;align-items:center;justify-content:space-between;margin:24px 0 20px;flex-wrap:wrap;gap:10px}
.tb-count{font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.78rem;color:var(--dim)}
.tb-sort{font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:6px 14px;background:var(--card);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#fff;font-size:0.78rem;outline:none}
/* Book Grid */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:18px;margin-bottom:48px}
.bk{background:var(--card);border:1px solid rgba(255,255,255,0.05);border-radius:12px;overflow:hidden;transition:border-color 0.2s,transform 0.15s}
.bk:hover{border-color:rgba(124,92,240,0.2);transform:translateY(-2px)}
.bk-cv{aspect-ratio:2/3;background:rgba(255,255,255,0.02);overflow:hidden}
.bk-cv img{width:100%;height:100%;object-fit:cover}
.bk-bd{padding:14px}
.bk-genre{font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.58rem;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:var(--accent2);margin-bottom:4px}
.bk-title{font-size:0.9rem;font-weight:700;margin-bottom:4px;color:#fff}
.bk-title a:hover{color:var(--accent2)}
.bk-author{font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.7rem;color:var(--dim);margin-bottom:6px}
.bk-meta{display:flex;align-items:center;gap:10px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.65rem;color:var(--dim)}
.bk-rating{color:var(--gold);font-weight:600}
.bk-status{font-size:0.6rem;padding:2px 7px;border-radius:100px;font-weight:600}
.s-go{color:var(--green);background:rgba(52,199,89,0.08)}
.s-done{color:var(--accent2);background:rgba(79,140,255,0.08)}
/* Detail */
.detail{margin-bottom:48px}
.detail-hd{display:flex;gap:24px;margin-bottom:24px;padding-top:24px}
.detail-cv{width:160px;flex-shrink:0;aspect-ratio:2/3;border-radius:8px;overflow:hidden}
.detail-cv img{width:100%;height:100%;object-fit:cover}
.detail-info h1{font-size:1.5rem;font-weight:800;color:#fff;margin-bottom:6px}
.detail-info .by{font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.85rem;color:var(--dim);margin-bottom:10px}
.detail-info .bio{font-size:0.78rem;color:var(--dim);line-height:1.6;margin-bottom:10px}
.detail-stats{display:flex;gap:18px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.75rem;color:var(--dim);margin-bottom:10px}
.detail-stats .vl{color:#fff;font-weight:600}
.detail-desc{font-size:0.85rem;color:var(--dim);line-height:1.7}
/* Chapter list */
.ch-sec{margin-top:24px}
.ch-sec h2{font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.85rem;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.05)}
.ch-list{display:flex;flex-direction:column;gap:1px}
.ch-item{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:6px;transition:background 0.15s}
.ch-item:hover{background:rgba(255,255,255,0.02)}
.ch-num{font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:var(--accent2);font-weight:700;min-width:28px;text-align:right;font-size:0.75rem}
.ch-title{font-size:0.82rem;color:var(--dim)}
.ch-title a:hover{color:#fff}
/* Chapter page */
.cp{max-width:720px;margin:24px auto;padding:0 24px}
.cp-hd{margin-bottom:20px}
.cp-hd .cp-book{font-size:0.82rem;color:var(--dim)}
.cp-hd .cp-book a{color:var(--accent2)}
.cp-hd h1{font-size:1.2rem;font-weight:700;color:#fff;margin:4px 0}
.cp-nav{display:flex;justify-content:space-between;align-items:center;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.78rem;margin:32px 0;padding:12px 0;border-top:1px solid rgba(255,255,255,0.05);border-bottom:1px solid rgba(255,255,255,0.05)}
.cp-nav a{color:var(--accent2)}
.cp-nav a:hover{color:#fff}
.cp-nav span{color:var(--dim)}
.ch-content{font-size:0.88rem;color:var(--dim);line-height:1.85;white-space:pre-line}
/* Footer */
.ft{text-align:center;padding:24px;border-top:1px solid rgba(255,255,255,0.05);font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.68rem;color:var(--dim)}
.ft nav{display:flex;justify-content:center;gap:18px;flex-wrap:wrap;margin-bottom:8px}
.ft nav a:hover{color:#fff}
/* 404 */
.err{text-align:center;padding:80px 24px}
.err h1{font-size:3rem;color:#fff;margin-bottom:8px}
.err p{color:var(--dim);margin-bottom:16px}
.err a{color:var(--accent2);font-family:-apple-system,BlinkMacSystemFont,sans-serif}
@media(max-width:768px){
  .hero-in{padding:24px 16px 16px}
  .hero h1{font-size:1.4rem}
  .grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
  .bk-bd{padding:10px}
  .bk-title{font-size:0.78rem}
  .detail-hd{flex-direction:column;align-items:center;text-align:center}
  .detail-cv{width:120px}
  .hd-in{padding:10px 16px}
  .hd-nav{gap:14px}
}
</style>
</head>
<body>`;

const BASE_FOOTER = `<footer class="ft" role="contentinfo">
  <nav><a href="/">Library</a><a href="/about">About</a><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="mailto:${site.email}">Support</a></nav>
  <p>© 2026 ${site.company}. Original fiction, independently published. All novels undergo editorial review. Contact: ${site.email}</p>
</footer>
<script src="/app.js"></script>
<script>window._FV_BOOK_COUNT=${books.length};</script>
</body></html>`;

const BASE_HEADER = `<header class="hd"><div class="hd-in">
  <a href="/" class="hd-logo">FictionVerse</a>
  <nav class="hd-nav"><a href="/">Library</a><a href="/bookshelf">📚 Shelf</a><a href="/community">💬 Forum</a><a href="/unpublished">📦 Unpublished</a><a href="/about">About</a><a href="/author">Publish</a></nav>
</div></header>`;

// Book card HTML
function bookCard(book) {
  const s = '★'.repeat(Math.floor(book.rating)) + (book.rating % 1 >= 0.5 ? '½' : '');
  const gn = GENRE_TAXONOMY[book.genre]?.name || book.genre;
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const tierBadge = book.tier === 'free'
    ? ' <span style="color:var(--green);font-size:0.55rem">FREE</span>'
    : ' <span style="color:var(--gold);font-size:0.55rem">$' + (book.price || '4.99') + '</span>';
  return `<article class="bk" data-genre="${book.genre}" data-tier="${book.tier || 'free'}" data-title="${esc(book.title)}" data-author="${esc(book.author)}">
  <a href="/read/${book.slug}/" class="bk-cv"><img src="${book.cover}" alt="${book.coverAlt}" loading="lazy"></a>
  <div class="bk-bd">
    <div class="bk-genre">${gn}${tierBadge}</div>
    <h2 class="bk-title"><a href="/read/${book.slug}/">${book.title}</a></h2>
    <div class="bk-author">by ${book.author}</div>
    <div class="bk-meta">
      <span class="bk-rating">${s} ${book.rating}</span>
      <span>${book.chapters} ch</span>
      <span>${(book.wordCount / 1000).toFixed(0)}k words</span>
      <span class="bk-status ${book.status === 'completed' ? 's-done' : 's-go'}">${book.status}</span>
    </div>
  </div>
</article>`;
}

// ─── 1. 首页 index.html ───
const sorted = [...books].sort((a, b) => b.rating - a.rating);
const bookCards = sorted.map(bookCard).join('\n');

const itemListSchema = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "ItemList",
  "numberOfItems": books.length,
  "itemListElement": books.map((b, i) => ({
    "@type": "ListItem", "position": i + 1,
    "item": { "@type": "Book", "name": b.title, "author": { "@type": "Person", "name": b.author },
      "genre": b.genres, "description": b.description.substring(0, 200),
      "numberOfPages": String(b.chapters), "inLanguage": "en",
      "publisher": { "@type": "Organization", "name": site.name },
      "url": `${site.url}/read/${b.slug}/` }
  }))
});

const indexSchema = [
  { "@context": "https://schema.org", "@type": "WebSite", "name": site.name, "url": site.url, "inLanguage": "en",
    "publisher": { "@type": "Organization", "name": site.name, "url": site.url, "email": site.email } },
  { "@context": "https://schema.org", "@type": "Organization", "name": site.name, "url": site.url, "email": site.email,
    "foundingDate": "2026", "description": "Independent publisher of original English web novels." }
];

const indexHTML = `${BASE_HEAD('FictionVerse — Original English Web Novels | Free Chapters',
  'Discover original English web novels across Xianxia, Urban Fantasy, Sci-Fi LitRPG. Read 5 chapters free, unlock full novels with one payment.',
  site.url + '/',
  indexSchema.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n') +
  `<script type="application/ld+json">${itemListSchema}</script>`)}
${BASE_HEADER}
<section class="hero"><div class="hero-in"><h1>Discover Your Next Story</h1><p>Original English web novels · Read 5 chapters free · One-time unlock · No login required</p></div></section>
<style>
/* Zone Tabs */
.zone-tabs{max-width:1120px;margin:0 auto;padding:20px 24px 0;display:flex;gap:8px;flex-wrap:wrap}
.zt{font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.78rem;padding:8px 18px;border-radius:100px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:var(--dim);cursor:pointer;transition:all 0.15s}
.zt:hover{color:#fff;border-color:rgba(255,255,255,0.2)}
.zt.active{background:var(--accent2);color:#fff;border-color:var(--accent2)}
.zt.zt-gold.active{background:var(--gold);color:#0a0b10;border-color:var(--gold)}
.zt.zt-green.active{background:var(--green);color:#0a0b10;border-color:var(--green)}
.zt.zt-lib.active{background:var(--purple);color:#fff;border-color:var(--purple)}
.lib-section{max-width:1120px;margin:0 auto;padding:0 24px;display:none}
.lib-section h2{font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.85rem;font-weight:700;color:var(--purple);margin:16px 0 12px}
.lib-empty{text-align:center;padding:32px 16px;color:var(--dim);font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.82rem}
.lib-empty a{color:var(--accent2)}
<style>
/* Search & Filter */
.sch-wrap{max-width:1120px;margin:0 auto;padding:16px 24px 0}
.sch-bar{position:relative}
.sch-bar input{width:100%;padding:12px 16px 12px 42px;background:var(--card);border:1px solid rgba(255,255,255,0.08);border-radius:10px;color:#fff;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.82rem;outline:none;transition:border-color 0.2s}
.sch-bar input:focus{border-color:var(--accent2)}
.sch-bar input::placeholder{color:var(--dim)}
.sch-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:0.85rem;pointer-events:none}
.gf-wrap{max-width:1120px;margin:0 auto;padding:14px 24px 0}
.gf-bar{display:flex;flex-wrap:wrap;gap:8px}
.gf-chip{font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.72rem;padding:6px 14px;border-radius:100px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:var(--dim);cursor:pointer;transition:all 0.15s;white-space:nowrap}
.gf-chip:hover{color:#fff;border-color:rgba(255,255,255,0.2)}
.gf-chip.active{background:var(--accent2);color:#fff;border-color:var(--accent2)}
.gf-chip .cnt{font-size:0.62rem;opacity:0.6;margin-left:2px}
.no-results{text-align:center;padding:48px 24px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:var(--dim);font-size:0.85rem;display:none}
.bk.hidden{display:none}
</style>
<section class="zone-tabs">
  <button class="zt active" data-zone="all">📚 All (${books.length})</button>
  <button class="zt zt-green" data-zone="free">🆓 Free (${freeBooks.length})</button>
  <button class="zt zt-gold" data-zone="paid">🔒 Paid (${paidBooks.length})</button>
  <button class="zt zt-lib" data-zone="library">📖 My Library</button>
</section>
<section class="sch-wrap"><div class="sch-bar">
  <span class="sch-icon">🔍</span>
  <input type="text" id="searchInput" placeholder="Search by title, author, or keyword..." oninput="filterBooks()">
</div></section>
<section class="gf-wrap"><div class="gf-bar" id="genreBar">
  <button class="gf-chip active" data-genre="all" onclick="selectGenre('all')">All<span class="cnt">(${books.length})</span></button>
  ${genreOrder.map(g => `<button class="gf-chip" data-genre="${g}" onclick="selectGenre('${g}')">${genreStats[g].name}<span class="cnt">(${genreStats[g].books.length})</span></button>`).join('\n')}
</div></section>
<main class="ct">
  <div class="tb">
    <span class="tb-count" id="tbCount">${books.length} novel${books.length!==1?'s':''} · ${totalChapters} chapters · ${(totalWords/1000).toFixed(0)}k words</span>
    <select class="tb-sort" onchange="sortBooks(this.value)">
      <option value="rating">⭐ Top Rated</option>
      <option value="newest">🕐 Recently Updated</option>
      <option value="words">📖 Longest</option>
    </select>
  </div>
  <div class="grid" id="bookGrid">${bookCards}</div>
  <div class="no-results" id="noResults">No novels found. Try a different search or genre.</div>
</main>
<section class="lib-section" id="myLibrary">
  <h2>📖 My Library</h2>
  <div class="lib-empty" id="libEmpty">
    <p>You haven't unlocked any novels yet.</p>
    <p style="margin-top:8px;font-size:0.72rem">Browse <a href="#" onclick="switchZone('free',document.querySelector('.zt[data-zone=free]'))">free novels</a> or <a href="#" onclick="switchZone('paid',document.querySelector('.zt[data-zone=paid]'))">paid novels</a> to get started.</p>
  </div>
  <div class="grid" id="libGrid" style="margin-top:12px"></div>
</section>
<script>
const BOOKS = ${JSON.stringify(books.map(b=>({slug:b.slug,title:b.title,author:b.author,genre:b.genre,rating:b.rating,chapters:b.chapters,wordCount:b.wordCount})))};
let activeGenre='all';
let currentSort='rating';
function selectGenre(g){activeGenre=g;document.querySelectorAll('.gf-chip').forEach(c=>c.classList.toggle('active',c.dataset.genre===g));filterBooks()}
function filterBooks(){var q=document.getElementById('searchInput').value.toLowerCase().trim(),grid=document.getElementById('bookGrid'),cards=[...grid.querySelectorAll('.bk')],noRes=document.getElementById('noResults'),cntEl=document.getElementById('tbCount'),vis=0;cards.forEach(function(c){var g=activeGenre==='all'||c.dataset.genre===activeGenre,t=(c.dataset.title||'').toLowerCase(),a=(c.dataset.author||'').toLowerCase(),s=!q||t.includes(q)||a.includes(q),show=g&&s;c.classList.toggle('hidden',!show);if(show)vis++});noRes.style.display=vis===0?'block':'none';var fb=BOOKS.filter(function(b){return activeGenre==='all'||b.genre===activeGenre}),tc=fb.reduce(function(s,b){return s+b.chapters},0),tw=Math.round(fb.reduce(function(s,b){return s+b.wordCount},0)/1000);cntEl.textContent=vis+' of '+BOOKS.length+' novels · '+tc+' chapters · '+tw+'k words'}
function sortBooks(v){currentSort=v;var grid=document.getElementById('bookGrid'),cards=[...grid.querySelectorAll('.bk')],vis=cards.filter(function(c){return!c.classList.contains('hidden')}),hid=cards.filter(function(c){return c.classList.contains('hidden')});if(v==='rating')vis.sort(function(a,b){return(b.querySelector('.bk-rating')?b.querySelector('.bk-rating').textContent:'').localeCompare(a.querySelector('.bk-rating')?a.querySelector('.bk-rating').textContent:'')});else if(v==='newest')vis.sort(function(){return Math.random()-0.5});else vis.sort(function(a,b){var ac=parseInt((a.querySelector('.bk-meta span:nth-child(2)')?a.querySelector('.bk-meta span:nth-child(2)').textContent:'').replace(' ch',''))||0,bc=parseInt((b.querySelector('.bk-meta span:nth-child(2)')?b.querySelector('.bk-meta span:nth-child(2)').textContent:'').replace(' ch',''))||0;return bc-ac});vis.concat(hid).forEach(function(c){grid.appendChild(c)})}
</script>
${BASE_FOOTER}`;

fs.writeFileSync('index.html', indexHTML);
console.log('✓ index.html');

// ─── 2. 每本书详情页 + 每章独立页 ───
const bookSchema = book => ({
  "@context": "https://schema.org", "@type": "Book",
  "name": book.title, "author": { "@type": "Person", "name": book.author },
  "genre": book.genres, "description": book.description,
  "numberOfPages": String(book.chapters), "inLanguage": "en",
  "publisher": { "@type": "Organization", "name": site.name },
  "url": `${site.url}/read/${book.slug}/`,
  "image": `${site.url}${book.cover}`
});

const bcSchema = book => ({
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Library", "item": site.url },
    { "@type": "ListItem", "position": 2, "name": book.title }
  ]
});

for (const book of books) {
  const dir = `read/${book.slug}`;
  fs.mkdirSync(dir, { recursive: true });
  const chDir = `${dir}/chapters`;
  fs.mkdirSync(chDir, { recursive: true });

  const chs = book._chapters || [];
  const s = '★'.repeat(Math.floor(book.rating)) + (book.rating % 1 >= 0.5 ? '½' : '');
  const gn = GENRE_TAXONOMY[book.genre]?.name || book.genre;
  const dTierBadge = book.tier === 'free'
    ? ' <span style="color:var(--green);font-size:0.55rem">FREE</span>'
    : ' <span style="color:var(--gold);font-size:0.55rem">$' + (book.price || '4.99') + '</span>';

  // Book detail page
  const detailHTML = `${BASE_HEAD(`${book.title} — ${site.name} | Read ${book.chapters} Chapters Free`,
    `Read ${book.title} by ${book.author}. ${book.genre} web novel. ${book.chapters} chapters, ${(book.wordCount/1000).toFixed(0)}k words. Read ${book.freeChapters} chapters free.`,
    `${site.url}/read/${book.slug}/`,
    `<script type="application/ld+json">${JSON.stringify(bookSchema(book))}</script>
<script type="application/ld+json">${JSON.stringify(bcSchema(book))}</script>`)}
${BASE_HEADER}
<script>document.body.dataset.bookSlug='${book.slug}';document.body.dataset.bookTier='${book.tier||'free'}';document.body.dataset.freeChapters='${book.freeChapters||0}';document.body.dataset.bookPrice='${book.price||'4.99'}';</script>
<main class="ct">
  <div class="detail">
    <nav aria-label="Breadcrumb" style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.72rem;color:var(--dim);padding:16px 0">/ <a href="/">Library</a> / <span>${book.title}</span></nav>
    <div class="detail-hd">
      <div class="detail-cv"><img src="${book.cover}" alt="${book.coverAlt}"></div>
      <div class="detail-info">
        <div class="bk-genre">${gn}${dTierBadge}</div>
        <h1>${book.title}</h1>
        <div class="by">by ${book.author} · <span class="bk-status ${book.status==='completed'?'s-done':'s-go'}">${book.status}</span></div>
        <div class="detail-stats">
          <span>⭐ <span class="vl">${book.rating}</span> (${book.reviews} reviews)</span>
          <span><span class="vl">${book.chapters}</span> chapters</span>
          <span><span class="vl">${(book.wordCount/1000).toFixed(0)}k</span> words</span>
          <span><span class="vl">${book.freeChapters}</span> free</span>
        </div>
        <div class="bio">📝 ${book.authorBio}</div>
        <p class="detail-desc">${book.description}</p>
      </div>
    </div>

    <div class="ch-sec">
      <h2>📖 Table of Contents (${chs.length} chapters)</h2>
      <nav class="ch-list" aria-label="Chapter list">
        ${chs.map(c => `<div class="ch-item">
          <span class="ch-num">${c.number}.</span>
          <span class="ch-title"><a href="/read/${book.slug}/chapters/${c.number}">${c.title}</a></span>
          <span style="margin-left:auto;font-size:0.65rem;color:var(--dim);font-family:-apple-system,BlinkMacSystemFont,sans-serif">${(c.wordCount/1000).toFixed(1)}k</span>
        </div>`).join('\n')}
      </nav>
    </div>
  </div>
</main>
${BASE_FOOTER}`;
  fs.writeFileSync(`${dir}/index.html`, detailHTML);
  console.log(`  read/${book.slug}/index.html`);

  // Chapter pages
  for (const ch of chs) {
    const prev = ch.number > 1 ? ch.number - 1 : null;
    const next = ch.number < chs.length ? ch.number + 1 : null;
    const snippet = `Read Chapter ${ch.number}: ${ch.title} of ${book.title} by ${book.author}. ${book.genre} web novel.`;
    const chSchema = {
      "@context": "https://schema.org", "@type": "Chapter",
      "name": `Chapter ${ch.number}: ${ch.title}`,
      "isPartOf": { "@type": "Book", "name": book.title, "url": `${site.url}/read/${book.slug}/` },
      "position": ch.number
    };
    const chBC = {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Library", "item": site.url },
        { "@type": "ListItem", "position": 2, "name": book.title, "item": `${site.url}/read/${book.slug}/` },
        { "@type": "ListItem", "position": 3, "name": `Chapter ${ch.number}` }
      ]
    };

    // Readable content snippet (placeholder for now)
    const text = `[Content preview for Chapter ${ch.number}: ${ch.title}]

This is the opening of "${ch.title}" — Chapter ${ch.number} of ${book.title} by ${book.author}.

Full chapter content will be available here. This chapter contains approximately ${ch.wordCount.toLocaleString()} words.

The story continues to unfold as ${book.author} builds the world of ${book.title}, taking readers deeper into this ${book.genre} narrative. Each chapter advances the plot, develops characters, and reveals new layers of the story.

Readers can access the first ${book.freeChapters} chapters for free. To unlock the complete novel, a one-time payment is required — no subscription, ever.`;

    const chapterHTML = `${BASE_HEAD(`Chapter ${ch.number}: ${ch.title} — ${book.title}`,
      snippet, `${site.url}/read/${book.slug}/chapters/${ch.number}`,
      `<script type="application/ld+json">${JSON.stringify(chSchema)}</script>
<script type="application/ld+json">${JSON.stringify(chBC)}</script>`)}
${BASE_HEADER}
<script>document.body.dataset.bookSlug='${book.slug}';document.body.dataset.chapterNum='${ch.number}';document.body.dataset.chapterTitle='${ch.title}';document.body.dataset.bookTier='${book.tier||'free'}';document.body.dataset.freeChapters='${book.freeChapters||0}';</script>
<main class="cp">
  <nav aria-label="Breadcrumb" style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.72rem;color:var(--dim);padding:16px 0">/ <a href="/">Library</a> / <a href="/read/${book.slug}/">${book.title}</a> / <span>Chapter ${ch.number}</span></nav>
  <div class="cp-hd">
    <p class="cp-book">📖 <a href="/read/${book.slug}/">${book.title}</a> by ${book.author}</p>
    <h1>Chapter ${ch.number}: ${ch.title}</h1>
    <p style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.68rem;color:var(--dim);margin-top:4px">~${(ch.wordCount/1000).toFixed(1)}k words · Updated ${ch.updated}</p>
  </div>
  <div style="display:flex;gap:8px;margin-bottom:16px">
    <button class="fv-fav-btn" style="font-family:inherit;padding:6px 16px;border-radius:20px;border:1px solid rgba(255,255,255,0.12);background:transparent;color:var(--dim);cursor:pointer;font-size:0.78rem;transition:all 0.2s">🤍 Save</button>
  </div>
  <div class="ch-content">${text}</div>
  <nav class="cp-nav">
    <span>${prev ? `<a href="/read/${book.slug}/chapters/${prev}">← Chapter ${prev}</a>` : '← Start'}</span>
    <span>${ch.number} / ${chs.length}</span>
    <span>${next ? `<a href="/read/${book.slug}/chapters/${next}">Chapter ${next} →</a>` : '→ End'}</span>
  </nav>
  <section id="fv-reviews" class="fv-reviews-section" style="margin-top:32px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.06)">
    <h3 style="font-size:1rem;color:#fff;margin-bottom:4px">Reviews <span id="fv-review-count" style="font-size:0.72rem;color:var(--dim)"></span></h3>
    <div id="fv-avg-rating" style="font-size:1.2rem;color:var(--gold);margin-bottom:12px"></div>
    <div id="fv-review-list" style="margin-bottom:16px"></div>
    <form class="fv-review-form" style="background:rgba(255,255,255,0.02);border-radius:8px;padding:14px">
      <div style="display:flex;gap:6px;margin-bottom:8px;align-items:center">
        <input name="name" placeholder="Your name" style="flex:1;padding:6px 10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#fff;font-size:0.78rem;font-family:inherit" maxlength="30">
        <span style="font-size:0.72rem;color:var(--dim)">Rating:</span>
        <input type="hidden" id="fv-rating-val" name="rating" value="0">
        <span class="fv-star" data-v="1" style="cursor:pointer;font-size:1.1rem;color:rgba(255,255,255,0.2)">★</span>
        <span class="fv-star" data-v="2" style="cursor:pointer;font-size:1.1rem;color:rgba(255,255,255,0.2)">★</span>
        <span class="fv-star" data-v="3" style="cursor:pointer;font-size:1.1rem;color:rgba(255,255,255,0.2)">★</span>
        <span class="fv-star" data-v="4" style="cursor:pointer;font-size:1.1rem;color:rgba(255,255,255,0.2)">★</span>
        <span class="fv-star" data-v="5" style="cursor:pointer;font-size:1.1rem;color:rgba(255,255,255,0.2)">★</span>
      </div>
      <textarea name="content" placeholder="Write a review..." rows="2" style="width:100%;padding:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#fff;font-size:0.78rem;font-family:inherit;resize:vertical"></textarea>
      <button type="submit" style="margin-top:8px;padding:6px 20px;border-radius:20px;border:none;background:var(--accent, #4f8cff);color:#fff;cursor:pointer;font-size:0.78rem;font-family:inherit">Submit Review</button>
    </form>
  </section>
  <style>
    .fv-star.on{color:var(--gold,#e8c040)!important}
    .fv-fav-btn:hover{background:rgba(255,255,255,0.05)}
    .fv-fav-btn.favd{color:#e74c3c!important;border-color:rgba(231,76,60,0.3)}
    .fv-review-item{padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
    .fv-review-head{display:flex;gap:8px;align-items:center;margin-bottom:4px}
    .fv-review-name{font-weight:600;color:#fff;font-size:0.78rem}
    .fv-review-stars{color:var(--gold,#e8c040);font-size:0.72rem}
    .fv-review-date{color:var(--dim);font-size:0.65rem;margin-left:auto}
    .fv-review-body{color:var(--dim);font-size:0.78rem;line-height:1.5}
  </style>
</main>
<script src="/reader.js"></script>
${BASE_FOOTER}`;
    const chFilePath = `${chDir}/${ch.number}.html`;
    fs.writeFileSync(chFilePath, chapterHTML);
  }
  console.log(`  read/${book.slug}/chapters/ [${chs.length} pages]`);

  // Unlock page (for paid books)
  if (book.tier === 'paid') {
    const unlDir = `unlock/${book.slug}`;
    fs.mkdirSync(unlDir, { recursive: true });
    const unlHTML = `${BASE_HEAD(`Unlock ${book.title} — ${site.name}`,
      `Unlock ${book.title} — ${book.chapters} chapters for $${book.price||'4.99'}. One-time payment, no subscription.`,
      `${site.url}/unlock/${book.slug}/`)}
${BASE_HEADER}
<script>document.body.dataset.unlockSlug='${book.slug}';</script>
<main class="ct" style="max-width:600px;margin:48px auto;text-align:center">
  <div class="detail-cv" style="margin:0 auto 20px;width:140px"><img src="${book.cover}" alt="${book.coverAlt}"></div>
  <h1 style="font-size:1.5rem;font-weight:800;color:#fff;margin-bottom:8px">${book.title}</h1>
  <p style="color:var(--dim);font-size:0.85rem;margin-bottom:4px">by ${book.author}</p>
  <div style="margin:24px 0;padding:20px;background:rgba(52,199,89,0.06);border:1px solid rgba(52,199,89,0.15);border-radius:10px">
    <p style="font-size:1.1rem;color:var(--green);font-weight:700;margin-bottom:8px">✅ Purchase Confirmed!</p>
    <p style="font-size:0.82rem;color:var(--dim)">You now have access to all ${book.chapters} chapters of <strong style="color:#fff">${book.title}</strong>.</p>
    <p style="font-size:0.72rem;color:var(--dim);margin-top:6px">Your unlock is saved to this device. No login needed.</p>
  </div>
  <p style="font-size:0.78rem;color:var(--dim);margin-bottom:12px">Redirecting in <span id="unlockCountdown" style="color:var(--gold);font-weight:700">3</span> seconds...</p>
  <a id="unlockGo" href="/read/${book.slug}/" class="gf-chip active" style="display:inline-block;text-decoration:none;padding:10px 28px">Start Reading →</a>
  <p style="font-size:0.62rem;color:var(--dim);margin-top:24px">Tip: Bookmark this novel to return anytime. Your unlock is stored on this device.</p>
</main>
${BASE_FOOTER}`;
    fs.writeFileSync(`${unlDir}/index.html`, unlHTML);
    console.log(`  unlock/${book.slug}/index.html`);
  }
}

// ─── 3. 流派分类页 ───
for (const g of genreOrder) {
  const stat = genreStats[g];
  const dir = `genre/${g}`;
  fs.mkdirSync(dir, { recursive: true });

  const sortedGBooks = [...stat.books].sort((a, b) => b.rating - a.rating);
  const gCards = sortedGBooks.map(bookCard).join('\n');

  const gSchema = {
    "@context": "https://schema.org", "@type": "CollectionPage",
    "name": `${stat.name} — ${site.name}`,
    "description": `Read ${stat.books.length} ${stat.name} web novels on FictionVerse. ${stat.desc}. Free first chapters.`,
    "isPartOf": { "@type": "WebSite", "name": site.name, "url": site.url }
  };
  const gBC = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Library", "item": site.url },
      { "@type": "ListItem", "position": 2, "name": stat.name }
    ]
  };

  const genreHTML = `${BASE_HEAD(
    `${stat.name} Web Novels — ${site.name}`,
    `Browse ${stat.books.length} ${stat.name} web novels on FictionVerse. ${stat.desc}. Read free chapters, unlock full novels.`,
    `${site.url}/genre/${g}/`,
    `<script type="application/ld+json">${JSON.stringify(gSchema)}</script>
<script type="application/ld+json">${JSON.stringify(gBC)}</script>`)}
${BASE_HEADER}
<section class="hero"><div class="hero-in"><h1>${stat.name}</h1><p>${stat.desc} · ${stat.books.length} novel${stat.books.length!==1?'s':''}</p></div></section>
<main class="ct">
  <nav aria-label="Breadcrumb" style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.72rem;color:var(--dim);padding:16px 0">/ <a href="/">Library</a> / <span>${stat.name}</span></nav>
  <div class="grid">${gCards}</div>
</main>
${BASE_FOOTER}`;
  fs.writeFileSync(`${dir}/index.html`, genreHTML);
  console.log(`  genre/${g}/index.html (${stat.books.length} books)`);
}

// ─── 5. 免费/付费专区页 ───
const tierPageCards = (list, tierName) => list.sort((a, b) => b.rating - a.rating).map(bookCard).join('\n');
const tierSchema = (tier, list) => ({
  "@context": "https://schema.org", "@type": "CollectionPage",
  "name": `${tier} Web Novels — ${site.name}`,
  "description": `Browse ${list.length} ${tier.toLowerCase()} web novels on FictionVerse. Read online, no login required.`,
  "isPartOf": { "@type": "WebSite", "name": site.name, "url": site.url }
});

// Free books page
if (freeBooks.length > 0) {
  const fDir = 'free'; fs.mkdirSync(fDir, { recursive: true });
  const fHTML = `${BASE_HEAD('Free Web Novels — FictionVerse', `Discover ${freeBooks.length} completely free web novels on FictionVerse. Read all chapters online, no payment needed.`, `${site.url}/free/`,
    `<script type="application/ld+json">${JSON.stringify(tierSchema('Free', freeBooks))}</script>`)}
${BASE_HEADER}
<section class="hero"><div class="hero-in"><h1>🆓 Free Novels</h1><p>${freeBooks.length} novel${freeBooks.length!==1?'s':''} — Read all chapters free, no payment ever.</p></div></section>
<main class="ct"><div class="grid">${tierPageCards(freeBooks)}</div></main>
${BASE_FOOTER}`;
  fs.writeFileSync(`${fDir}/index.html`, fHTML);
  console.log(`  free/index.html (${freeBooks.length} books)`);
}

// Paid books page
if (paidBooks.length > 0) {
  const pDir = 'paid'; fs.mkdirSync(pDir, { recursive: true });
  const pHTML = `${BASE_HEAD('Paid Web Novels — FictionVerse', `Discover ${paidBooks.length} premium web novels on FictionVerse. Read first chapters free, unlock full novel with one-time payment.`, `${site.url}/paid/`,
    `<script type="application/ld+json">${JSON.stringify(tierSchema('Paid', paidBooks))}</script>`)}
${BASE_HEADER}
<section class="hero"><div class="hero-in"><h1>🔒 Paid Novels</h1><p>${paidBooks.length} premium novel${paidBooks.length!==1?'s':''} — First chapters free · One-time unlock · No subscription</p></div></section>
<main class="ct"><div class="grid">${tierPageCards(paidBooks)}</div></main>
${BASE_FOOTER}`;
  fs.writeFileSync(`${pDir}/index.html`, pHTML);
  console.log(`  paid/index.html (${paidBooks.length} books)`);
}

// ─── 6. 辅助页面 ───
const staticPage = (slug, title, desc, content) => {
  const dir = slug === '/' ? '' : slug;
  const url = `${site.url}/${dir}`;
  const h = `${BASE_HEAD(title, desc, url, `<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"WebPage","name":title,"description":desc,"isPartOf":{"@type":"WebSite","name":site.name,"url":site.url}})}</script>`)}${BASE_HEADER}
<main class="ct" style="max-width:720px;margin:24px auto">
  <h1 style="font-size:1.5rem;font-weight:800;color:#fff;margin-bottom:4px">${title}</h1>
  <p style="font-size:0.72rem;color:var(--dim);margin-bottom:24px">Updated June 21, 2026</p>
  ${content}
  <nav style="margin-top:32px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.05);font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.82rem"><a href="/" style="color:var(--accent2)">← Back to Library</a></nav>
</main>${BASE_FOOTER}`;
  const filePath = `${slug}.html`;
  fs.writeFileSync(filePath, h);
  console.log(`✓ ${filePath}`);
};

const aboutContent = `<h2 style="font-size:1.05rem;font-weight:700;color:#fff;margin:24px 0 8px">Our Mission</h2>
<p style="font-size:0.85rem;color:var(--dim);margin-bottom:16px">${site.name} is an independent publisher of original English web novels. We believe great stories should be accessible — every novel starts with 5 free chapters, and the rest is unlocked with a single payment. No subscriptions, ever.</p>
<h2 style="font-size:1.05rem;font-weight:700;color:#fff;margin:24px 0 8px">Editorial Standards</h2>
<p style="font-size:0.85rem;color:var(--dim);margin-bottom:16px">Every novel published on FictionVerse undergoes editorial review for originality (human-written, not AI-generated), quality (grammar, plotting, characterization), and content guideline compliance (no hate speech, no adult content, no copyright infringement).</p>
<h2 style="font-size:1.05rem;font-weight:700;color:#fff;margin:24px 0 8px">For Authors</h2>
<p style="font-size:0.85rem;color:var(--dim)">We welcome original English fiction submissions in Xianxia, Cultivation, Urban Fantasy, Supernatural, Sci-Fi, LitRPG, and related speculative fiction. Email a synopsis and first 5 chapters to ${site.email}.</p>`;

const termsContent = `<h2 style="font-size:1.05rem;font-weight:700;color:#fff;margin:24px 0 8px">1. Acceptance of Terms</h2><p style="font-size:0.85rem;color:var(--dim);margin-bottom:12px">By accessing ${site.url}, you agree to be bound by these Terms of Service. If you do not agree, please do not use our website.</p>
<h2 style="font-size:1.05rem;font-weight:700;color:#fff;margin:24px 0 8px">2. Services Description</h2><p style="font-size:0.85rem;color:var(--dim);margin-bottom:12px">${site.name} provides original English web novels for reading online. Some novels are free, others require a one-time payment to unlock full access. ${site.name} does not charge subscription fees.</p>
<h2 style="font-size:1.05rem;font-weight:700;color:#fff;margin:24px 0 8px">3. Payment Terms</h2><p style="font-size:0.85rem;color:var(--dim);margin-bottom:12px">All payments are processed securely through Creem, our authorized Merchant of Record. Creem handles payment processing, tax calculation (VAT/GST), and currency conversion. ${site.name} does not store or process your payment card information directly.</p>
<h2 style="font-size:1.05rem;font-weight:700;color:#fff;margin:24px 0 8px">4. No-Subscription Guarantee</h2><p style="font-size:0.85rem;color:var(--dim);margin-bottom:12px">${site.name} operates on a one-time payment model only. We never charge recurring fees or hidden subscriptions. Payment details are never stored for automatic renewal.</p>
<h2 style="font-size:1.05rem;font-weight:700;color:#fff;margin:24px 0 8px">5. Refund Policy</h2><p style="font-size:0.85rem;color:var(--dim);margin-bottom:12px">We offer a 7-day refund guarantee from the date of purchase under the following conditions: (a) Technical issues prevent you from accessing purchased content after reasonable troubleshooting attempts (contact ${site.email}); (b) Duplicate or accidental purchase — you will be refunded for the extra charge; (c) Content not as described. Refund requests must be submitted to ${site.email} with your order ID. Refunds are processed through Creem within 5-10 business days. We do not provide refunds if you simply change your mind after reading all free chapters — please read the free preview before purchasing.</p>
<h2 style="font-size:1.05rem;font-weight:700;color:#fff;margin:24px 0 8px">6. Intellectual Property</h2><p style="font-size:0.85rem;color:var(--dim);margin-bottom:12px">All novels and content on ${site.name} are original works protected by copyright. Authors retain full copyright ownership. Unauthorized reproduction, distribution, scraping, translation, or commercial use of any content is strictly prohibited. Violations will be pursued to the fullest extent of the law.</p>
<h2 style="font-size:1.05rem;font-weight:700;color:#fff;margin:24px 0 8px">7. User Conduct</h2><p style="font-size:0.85rem;color:var(--dim);margin-bottom:12px">You agree not to: (a) Scrape, crawl, or use automated means to access or copy our content; (b) Distribute purchased content to third parties; (c) Attempt to bypass payment systems or access restrictions; (d) Use the site for any illegal purpose.</p>
<h2 style="font-size:1.05rem;font-weight:700;color:#fff;margin:24px 0 8px">8. Limitation of Liability</h2><p style="font-size:0.85rem;color:var(--dim);margin-bottom:12px">${site.name} provides content on an "as is" basis. We make no warranties regarding uninterrupted access or error-free content. ${site.company} and its operators shall not be liable for any indirect, incidental, or consequential damages arising from the use of our website. Our total liability for any claim is limited to the amount you paid for the specific purchase in question.</p>
<h2 style="font-size:1.05rem;font-weight:700;color:#fff;margin:24px 0 8px">9. Content Moderation</h2><p style="font-size:0.85rem;color:var(--dim);margin-bottom:12px">All novels undergo editorial review before publication. ${site.name} reserves the right to remove any content that violates our content guidelines (no pornography, hate speech, violence glorification, or illegal content) without prior notice.</p>
<h2 style="font-size:1.05rem;font-weight:700;color:#fff;margin:24px 0 8px">10. Termination</h2><p style="font-size:0.85rem;color:var(--dim);margin-bottom:12px">We reserve the right to terminate or suspend access to our service for violations of these terms. Upon termination, your right to access purchased content may be revoked for cause.</p>
<h2 style="font-size:1.05rem;font-weight:700;color:#fff;margin:24px 0 8px">11. Contact & Company Information</h2><p style="font-size:0.85rem;color:var(--dim);margin-bottom:4px"><strong>Company:</strong> ${site.company}</p><p style="font-size:0.85rem;color:var(--dim);margin-bottom:4px"><strong>Address:</strong> ${site.address}</p><p style="font-size:0.85rem;color:var(--dim);margin-bottom:4px"><strong>Email:</strong> ${site.email}</p><p style="font-size:0.85rem;color:var(--dim);margin-bottom:12px"><strong>Last Updated:</strong> June 21, 2026</p>`;

const privacyContent = `<h2 style="font-size:1.05rem;font-weight:700;color:#fff;margin:24px 0 8px">1. Overview</h2><p style="font-size:0.85rem;color:var(--dim);margin-bottom:12px">${site.name} is committed to protecting your privacy. This policy explains what data we collect, how we use it, and your rights.</p>
<h2 style="font-size:1.05rem;font-weight:700;color:#fff;margin:24px 0 8px">2. Information We Collect</h2><p style="font-size:0.85rem;color:var(--dim);margin-bottom:4px"><strong>2.1 Reading data:</strong> We do not require user accounts. Your reading progress and purchase unlocks are stored locally in your browser (localStorage). This data never leaves your device.</p><p style="font-size:0.85rem;color:var(--dim);margin-bottom:4px"><strong>2.2 Payment data:</strong> All payments are processed by Creem (our Merchant of Record). We do not collect, store, or have access to your credit card numbers, banking details, or payment credentials. Creem may collect personal information necessary for payment processing per their privacy policy at https://creem.io/privacy.</p><p style="font-size:0.85rem;color:var(--dim);margin-bottom:4px"><strong>2.3 Author data:</strong> Authors who register on our platform provide email address, display name, pen name, and payment method details (Alipay/Payoneer/PayPal account). This data is used solely for account management, royalty payments, and legal compliance.</p><p style="font-size:0.85rem;color:var(--dim);margin-bottom:12px"><strong>2.4 Order data:</strong> We receive order IDs and purchase amounts from Creem for accounting and royalty distribution purposes.</p>
<h2 style="font-size:1.05rem;font-weight:700;color:#fff;margin:24px 0 8px">3. Cookies & Local Storage</h2><p style="font-size:0.85rem;color:var(--dim);margin-bottom:4px"><strong>3.1 Essential cookies:</strong> We use minimal cookies to persist your purchase unlocks (so you can continue reading without re-purchasing). These are strictly functional and do not track your activity.</p><p style="font-size:0.85rem;color:var(--dim);margin-bottom:4px"><strong>3.2 LocalStorage:</strong> Reading progress (current chapter) is saved in your browser's localStorage. This data is stored only on your device.</p><p style="font-size:0.85rem;color:var(--dim);margin-bottom:4px"><strong>3.3 No tracking cookies:</strong> We do not use advertising cookies, third-party tracking cookies, or analytics cookies that identify individual users.</p><p style="font-size:0.85rem;color:var(--dim);margin-bottom:12px"><strong>3.4 Cloudflare:</strong> Our website is hosted on Cloudflare, which may set minimal technical cookies for security (DDoS protection, bot detection) and performance (CDN caching). These are not used for tracking.</p>
<h2 style="font-size:1.05rem;font-weight:700;color:#fff;margin:24px 0 8px">4. Third-Party Services</h2><p style="font-size:0.85rem;color:var(--dim);margin-bottom:4px"><strong>4.1 Creem (Payment Processor):</strong> Handles all payment transactions. Subject to Creem's privacy policy.</p><p style="font-size:0.85rem;color:var(--dim);margin-bottom:4px"><strong>4.2 Cloudflare (Hosting & CDN):</strong> Provides website hosting, security, and content delivery. Cloudflare may process IP addresses and request data for security and performance purposes.</p><p style="font-size:0.85rem;color:var(--dim);margin-bottom:4px"><strong>4.3 MailChannels (Email Delivery):</strong> Used to send verification codes and transactional emails to authors.</p><p style="font-size:0.85rem;color:var(--dim);margin-bottom:12px">We do not sell, rent, or share your personal data with any other third parties.</p>
<h2 style="font-size:1.05rem;font-weight:700;color:#fff;margin:24px 0 8px">5. Data Retention</h2><p style="font-size:0.85rem;color:var(--dim);margin-bottom:4px"><strong>5.1 Author data:</strong> Retained for the duration of the author's account. Upon account deletion, author data is removed within 30 days, except for transaction records required for legal and tax compliance (retained 7 years).</p><p style="font-size:0.85rem;color:var(--dim);margin-bottom:4px"><strong>5.2 Transaction records:</strong> Retained for 7 years for tax and legal compliance purposes.</p><p style="font-size:0.85rem;color:var(--dim);margin-bottom:4px"><strong>5.3 Reader data:</strong> Reading progress and purchase unlocks stored in your browser localStorage remain until you clear your browser data.</p><p style="font-size:0.85rem;color:var(--dim);margin-bottom:12px"><strong>5.4 Server logs:</strong> Cloudflare server logs are retained per Cloudflare's standard practices (typically 24 hours to 7 days).</p>
<h2 style="font-size:1.05rem;font-weight:700;color:#fff;margin:24px 0 8px">6. Data Security</h2><p style="font-size:0.85rem;color:var(--dim);margin-bottom:12px">We implement industry-standard security measures: all data transmission is encrypted via HTTPS/TLS; author passwords are hashed; database access is restricted to authorized personnel only. However, no method of electronic storage is 100% secure.</p>
<h2 style="font-size:1.05rem;font-weight:700;color:#fff;margin:24px 0 8px">7. Your Rights</h2><p style="font-size:0.85rem;color:var(--dim);margin-bottom:12px">You have the right to: (a) Access personal data we hold about you; (b) Request correction of inaccurate data; (c) Request deletion of your data (subject to legal retention requirements); (d) Withdraw consent where processing is based on consent. To exercise these rights, contact ${site.email}.</p>
<h2 style="font-size:1.05rem;font-weight:700;color:#fff;margin:24px 0 8px">8. Children's Privacy</h2><p style="font-size:0.85rem;color:var(--dim);margin-bottom:12px">Our service is not directed to children under 13. We do not knowingly collect personal information from children under 13.</p>
<h2 style="font-size:1.05rem;font-weight:700;color:#fff;margin:24px 0 8px">9. Changes to This Policy</h2><p style="font-size:0.85rem;color:var(--dim);margin-bottom:12px">We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date. Continued use of the site after changes constitutes acceptance.</p>
<h2 style="font-size:1.05rem;font-weight:700;color:#fff;margin:24px 0 8px">10. Contact</h2><p style="font-size:0.85rem;color:var(--dim);margin-bottom:4px"><strong>Company:</strong> ${site.company}</p><p style="font-size:0.85rem;color:var(--dim);margin-bottom:4px"><strong>Address:</strong> ${site.address}</p><p style="font-size:0.85rem;color:var(--dim);margin-bottom:4px"><strong>Email:</strong> ${site.email}</p><p style="font-size:0.85rem;color:var(--dim);margin-bottom:12px"><strong>Last Updated:</strong> June 21, 2026</p>`;

staticPage('about', 'About FictionVerse', 'About FictionVerse — independent publisher of original English web novels.', aboutContent);
staticPage('terms', 'Terms of Service — FictionVerse', 'Terms of Service for FictionVerse.', termsContent);
staticPage('privacy', 'Privacy Policy — FictionVerse', 'Privacy Policy for FictionVerse.', privacyContent);

// ─── Bookshelf 页面 ───
const shelfContent = `<div id="fv-bookshelf">
  <div id="fv-shelf-empty" style="display:none;text-align:center;padding:48px 20px">
    <p style="font-size:2rem;margin-bottom:12px">📚</p>
    <h2 style="color:#fff;font-size:1.1rem;margin-bottom:8px">Your bookshelf is empty</h2>
    <p style="color:var(--dim);font-size:0.82rem">Tap the ❤️ button on any novel's chapter page to save it here.</p>
    <a href="/" style="display:inline-block;margin-top:16px;padding:8px 24px;border-radius:20px;background:var(--accent, #4f8cff);color:#fff;text-decoration:none;font-size:0.82rem">Browse Library →</a>
  </div>
  <div class="bk-gr" id="fv-shelf-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px"></div>
</div>
<script src="/reader.js"></script>`;
staticPage('bookshelf', 'My Bookshelf — FictionVerse', 'Your saved novels on FictionVerse.', shelfContent);

// ─── Community 页面 ───
const forumContent = `<div id="fv-forum">
  <div id="fv-forum-new" style="margin-bottom:16px">
    <form onsubmit="postTopic(event)" style="display:flex;gap:8px">
      <input id="fv-topic-title" placeholder="Start a discussion..." style="flex:1;padding:8px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#fff;font-size:0.82rem;font-family:inherit">
      <button type="submit" style="padding:8px 20px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:0.82rem;font-family:inherit">Post</button>
    </form>
  </div>
  <div id="fv-forum-list" style="font-size:0.82rem;color:var(--dim)">Loading discussions...</div>
</div>
<script src="/reader.js"></script>`;
staticPage('community', 'Community — FictionVerse', 'Discuss web novels with fellow readers on the FictionVerse community forum.', forumContent);

// ─── Unpublished 页面 ───
const unpublishedContent = `<div id="fv-unpublished" style="font-size:0.84rem;color:var(--dim)">
  <p style="margin-bottom:8px;font-size:0.78rem;color:var(--amber,#d4a853)">⏳ These works are currently under review or revision. They may become available after author updates.</p>
  <p style="margin-bottom:20px;font-size:0.72rem;color:var(--dim)">FictionVerse maintains a quality-first policy. Rejected or flagged chapters are placed here pending author revision.</p>
  <div class="bk-gr" id="fv-unpub-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px">
    <p style="grid-column:1/-1;text-align:center;padding:32px;color:var(--dim);font-size:0.82rem">Loading unpublished works...</p>
  </div>
</div>
<script>
(async()=>{
  try{
    const r=await fetch('https://api.aichatmail.one/api/unpublished');
    const data=await r.json();
    const g=document.getElementById('fv-unpub-grid');
    if(!data||!data.length){
      g.innerHTML='<p style="grid-column:1/-1;text-align:center;padding:48px 20px"><span style="font-size:2rem">📦</span><br><br><span style="color:var(--dim);font-size:0.82rem">No unpublished works at this time.</span><br><span style="color:var(--dim);font-size:0.72rem">All books have passed review or are in progress.</span></p>';
      return;
    }
    g.innerHTML=data.map(b=>{
      const gn=b.genre||'fiction';
      return '<article class="bk" style="opacity:0.7"><div class="bk-cv" style="position:relative"><img src="'+(b.cover||'/images/covers/default.png')+'" alt="'+b.title+'" loading="lazy" style="filter:grayscale(100%)"><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5)"><span style="background:var(--amber);color:#000;padding:4px 12px;border-radius:12px;font-size:0.6rem;font-weight:700">PENDING</span></div></div><div class="bk-bd"><div class="bk-genre">'+gn+'</div><h2 class="bk-title" style="color:var(--dim)">'+b.title+'</h2><div class="bk-author">by '+b.author+'</div><div class="bk-meta"><span>'+b.total_chapters+' ch</span><span style="color:var(--amber)">Awaiting revision</span></div></div></article>';
    }).join('');
  }catch(e){
    document.getElementById('fv-unpub-grid').innerHTML='<p style="grid-column:1/-1;text-align:center;padding:32px;color:var(--dim)">Unable to load. Please check back later.</p>';
  }
})();
</script>`;
staticPage('unpublished', 'Unpublished — FictionVerse', 'Works under review on FictionVerse.', unpublishedContent);

// ─── 4. 404页面 ───
const p404 = `${BASE_HEAD('Page Not Found — FictionVerse', 'Page not found.', site.url)+''}
${BASE_HEADER}
<main class="err">
  <h1>404</h1>
  <p>This page doesn't exist or has been moved.</p>
  <a href="/">← Back to Library</a>
</main>
${BASE_FOOTER}`;
fs.writeFileSync('404.html', p404);
console.log('✓ 404.html');

// ─── 7. sitemap.xml ───
const now = new Date().toISOString().split('T')[0];
let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
sitemap += `  <url><loc>${site.url}/</loc><lastmod>${now}</lastmod><priority>1.0</priority></url>\n`;
sitemap += `  <url><loc>${site.url}/about</loc><lastmod>${now}</lastmod><priority>0.5</priority></url>\n`;
sitemap += `  <url><loc>${site.url}/free/</loc><lastmod>${now}</lastmod><priority>0.7</priority></url>\n`;
sitemap += `  <url><loc>${site.url}/paid/</loc><lastmod>${now}</lastmod><priority>0.7</priority></url>\n`;
sitemap += `  <url><loc>${site.url}/bookshelf</loc><lastmod>${now}</lastmod><priority>0.5</priority></url>\n`;
sitemap += `  <url><loc>${site.url}/community</loc><lastmod>${now}</lastmod><priority>0.5</priority></url>\n`;
sitemap += `  <url><loc>${site.url}/unpublished</loc><lastmod>${now}</lastmod><priority>0.4</priority></url>\n`;
sitemap += `  <url><loc>${site.url}/terms</loc><lastmod>${now}</lastmod><priority>0.3</priority></url>\n`;
sitemap += `  <url><loc>${site.url}/privacy</loc><lastmod>${now}</lastmod><priority>0.3</priority></url>\n`;
for (const g of genreOrder) {
  sitemap += `  <url><loc>${site.url}/genre/${g}/</loc><lastmod>${now}</lastmod><priority>0.7</priority></url>\n`;
}
for (const book of books) {
  sitemap += `  <url><loc>${site.url}/read/${book.slug}/</loc><lastmod>${book.updated}</lastmod><priority>0.8</priority></url>\n`;
  const chs = book._chapters || [];
  for (const ch of chs) {
    sitemap += `  <url><loc>${site.url}/read/${book.slug}/chapters/${ch.number}</loc><lastmod>${ch.updated}</lastmod><priority>0.6</priority></url>\n`;
  }
  if (book.tier === 'paid') {
    sitemap += `  <url><loc>${site.url}/unlock/${book.slug}/</loc><lastmod>${now}</lastmod><priority>0.5</priority></url>\n`;
  }
}
sitemap += '</urlset>';
fs.writeFileSync('sitemap.xml', sitemap);
console.log('✓ sitemap.xml');

// ─── 8. robots.txt ───
const robots = `User-agent: *
Allow: /
Sitemap: ${site.url}/sitemap.xml

User-agent: Bingbot
Allow: /
Crawl-delay: 0
`;
fs.writeFileSync('robots.txt', robots);
console.log('✓ robots.txt');

// ─── 9. _redirects ───
fs.writeFileSync('_redirects', '/404 /404.html 404\n');
console.log('✓ _redirects');

// ─── 统计 ───
const totalPages = 1 + books.length + books.reduce((s, b) => s + (b._chapters || []).length, 0) + 3 + 1;
console.log(`\n📊 Built ${totalPages} pages · ${books.length} books · ${totalChapters} chapters · ${(totalWords/1000).toFixed(0)}k words`);
