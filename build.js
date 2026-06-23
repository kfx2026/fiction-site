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

// ─── 流派分类体系（含分组） ───
const GENRE_TAXONOMY = {
  'xianxia':          { name: 'Xianxia / Cultivation',  desc: 'Cultivation, immortal heroes, ancient martial worlds', group: 'martial-cultivation', icon: '⚔️' },
  'wuxia':            { name: 'Wuxia',                    desc: 'Martial arts masters, honor, and legendary blades in ancient China', group: 'martial-cultivation', icon: '🥋' },
  'urban':            { name: 'Urban Fantasy',           desc: 'Magic, supernatural forces, hidden worlds in modern cities', group: 'modern-urban', icon: '🏙️' },
  'scifi':            { name: 'Sci-Fi',                  desc: 'Futuristic technology, space exploration, digital realities', group: 'scifi-tech', icon: '🚀' },
  'litrpg':           { name: 'LitRPG / GameLit',        desc: 'Game mechanics, leveling systems, stats, and virtual worlds', group: 'scifi-tech', icon: '🎮' },
  'isekai':           { name: 'Isekai / Transmigration', desc: 'Reborn in another world, portal fantasies, and parallel universes', group: 'fantasy-worlds', icon: '🌌' },
  'fantasy':          { name: 'Epic Fantasy',            desc: 'Dragons, magic systems, and sprawling otherworldly realms', group: 'fantasy-worlds', icon: '🐉' },
  'magic-academy':    { name: 'Magic Academy',           desc: 'Wizard schools, magical training, and academic rivalries', group: 'fantasy-worlds', icon: '✨' },
  'romance':          { name: 'Romance',                 desc: 'Love stories across settings — contemporary, historical, and fantasy', group: 'romance', icon: '💕' },
  'harem':            { name: 'Harem / Reverse Harem',   desc: 'Multiple love interests, romantic entanglements, and relationship drama', group: 'romance', icon: '💝' },
  'yaoi':             { name: 'Boys Love / Yaoi',        desc: 'Male-male romance, LGBTQ+ stories across all genres', group: 'romance', icon: '🌈' },
  'horror':           { name: 'Horror / Thriller',       desc: 'Suspense, psychological terror, supernatural dread', group: 'mystery-thriller', icon: '👻' },
  'apocalypse':       { name: 'Apocalypse / Survival',   desc: 'End of the world, zombie outbreaks, and post-catastrophe survival', group: 'scifi-tech', icon: '🧟' },
  'supernatural':     { name: 'Supernatural / Paranormal', desc: 'Ghosts, vampires, werewolves, and otherworldly beings', group: 'modern-urban', icon: '🦇' },
  'mystery':          { name: 'Mystery / Detective',     desc: 'Whodunits, crime investigations, and puzzle-solving plots', group: 'mystery-thriller', icon: '🔍' },
  'action':           { name: 'Action / Adventure',      desc: 'High-stakes battles, quests, treasure hunts, and non-stop thrills', group: 'mystery-thriller', icon: '💥' },
  'historical':       { name: 'Historical Fiction',      desc: 'Stories set in richly imagined historical periods', group: 'drama-literary', icon: '📜' },
  'slice-of-life':    { name: 'Slice of Life',           desc: 'Everyday life, heartwarming drama, character-driven tales', group: 'modern-urban', icon: '🏡' },
  'comedy':           { name: 'Comedy / Satire',         desc: 'Humor, parody, and lighthearted storytelling', group: 'drama-literary', icon: '😂' },
  'drama':            { name: 'Drama / Tragedy',         desc: 'Emotional depth, character conflict, and powerful storytelling', group: 'drama-literary', icon: '🎭' },
};

// 流派分组定义
const GENRE_GROUPS = {
  'martial-cultivation': { name: 'Martial & Cultivation', icon: '⚔️', desc: 'Cultivation paths, martial arts, immortal heroes' },
  'fantasy-worlds':      { name: 'Fantasy Worlds', icon: '🐉', desc: 'Epic realms, magic systems, portal adventures' },
  'scifi-tech':          { name: 'Sci-Fi & Tech', icon: '🚀', desc: 'Futuristic worlds, game systems, digital realities' },
  'romance':             { name: 'Romance', icon: '💕', desc: 'Love, relationships, and heart-tugging entanglements' },
  'modern-urban':        { name: 'Modern & Urban', icon: '🏙️', desc: 'Supernatural in cities, everyday magic, slice of life' },
  'mystery-thriller':    { name: 'Mystery & Thriller', icon: '🔍', desc: 'Suspense, investigations, high-stakes action' },
  'drama-literary':      { name: 'Drama & Literary', icon: '🎭', desc: 'Character depth, historical tales, emotional journeys' },
};

// 统计每个流派下的书籍
const genreStats = {};
for (const book of books) {
  const g = book.genre;
  if (!GENRE_TAXONOMY[g]) continue;
  if (!genreStats[g]) genreStats[g] = { ...GENRE_TAXONOMY[g], books: [] };
  genreStats[g].books.push(book);
}

// 按分组组织流派
const groupGenres = {};
for (const [gk, gc] of Object.entries(GENRE_GROUPS)) {
  groupGenres[gk] = { ...gc, genres: [] };
}
for (const [gk, gs] of Object.entries(genreStats)) {
  const group = GENRE_TAXONOMY[gk]?.group;
  if (group && groupGenres[group]) {
    groupGenres[group].genres.push({ key: gk, ...gs, count: gs.books.length });
  }
}
// 过滤空分组，按流派总数排序
const groupOrder = Object.keys(groupGenres)
  .filter(gk => groupGenres[gk].genres.length > 0)
  .sort((a, b) => {
    const ta = groupGenres[a].genres.reduce((s, g) => s + g.count, 0);
    const tb = groupGenres[b].genres.reduce((s, g) => s + g.count, 0);
    return tb - ta;
  });

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
:root{--bg:#0a0b10;--card:#11131f;--card-hover:#161827;--text:#d8dae0;--dim:#8b8fa0;--gold:#e8c040;--purple:#9b8cf0;--accent:#7c5cf0;--accent2:#4f8cff;--green:#34c759;--red:#ff4757;--border:rgba(255,255,255,0.06)}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:Georgia,'Times New Roman',serif;color:var(--text);background:var(--bg);line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
.hd{position:sticky;top:0;z-index:100;background:rgba(10,11,16,0.92);border-bottom:1px solid var(--border);backdrop-filter:blur(14px)}
.hd-in{max-width:1120px;margin:0 auto;padding:12px 24px;display:flex;align-items:center;justify-content:space-between}
.hd-logo{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:1.1rem;font-weight:700;color:#fff;letter-spacing:-0.3px;display:flex;align-items:center;gap:8px}
.hd-logo::before{content:'';width:8px;height:8px;border-radius:50%;background:var(--gold);box-shadow:0 0 8px rgba(232,192,64,0.5)}
.hd-nav{display:flex;gap:20px;align-items:center}
.hd-nav a{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:0.78rem;color:var(--dim);transition:color 0.15s}
.hd-nav a:hover{color:#fff}
.hd-nav a.nav-cta{background:var(--gold);color:#0a0b10;padding:6px 16px;border-radius:100px;font-size:0.75rem;font-weight:700}
.hd-icon-btn{font-size:1.1rem!important;padding:4px 8px!important;color:var(--dim)!important;border-radius:6px;line-height:1;transition:all 0.15s}.hd-icon-btn:hover{color:#fff!important;background:rgba(255,255,255,0.06)}
.nav-drop{position:relative}.nav-drop .dd-trigger::after{content:'▾';font-size:.55rem;opacity:.5}.dd-menu{display:none;position:absolute;top:100%;left:-12px;margin-top:10px;background:var(--card);border:1px solid var(--border);border-radius:10px;padding:8px 0;min-width:160px;box-shadow:0 12px 32px rgba(0,0,0,.4)}.nav-drop:hover .dd-menu{display:block}.dd-menu a{display:block;padding:8px 16px;font-size:.75rem;color:var(--dim)}.dd-menu a:hover{background:rgba(232,192,64,.08);color:#fff}
.hero-new{position:relative;min-height:70vh;display:flex;align-items:center;justify-content:center;overflow:hidden;background:linear-gradient(160deg,#0a0b10 0%,#16102a 35%,#1a1515 70%,#0f1018 100%)}
.hero-new::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 20% 50%,rgba(232,192,64,.05) 0%,transparent 50%),radial-gradient(ellipse at 75% 30%,rgba(124,92,240,.06) 0%,transparent 40%),radial-gradient(ellipse at 50% 80%,rgba(232,192,64,.03) 0%,transparent 30%);z-index:0}
.hero-new::after{content:'';position:absolute;bottom:0;left:0;right:0;height:120px;background:linear-gradient(to top,var(--bg),transparent);z-index:1}
.hero-grid{position:relative;z-index:2;max-width:1120px;margin:0 auto;padding:60px 24px;display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}
.hero-text{max-width:520px}.hero-badge{display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:.65rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--gold);background:rgba(232,192,64,.1);border:1px solid rgba(232,192,64,.2);padding:5px 14px;border-radius:100px;margin-bottom:20px}
.hero-text h1{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:3.2rem;font-weight:800;color:#fff;line-height:1.1;letter-spacing:-1.5px;margin-bottom:20px}
.hero-text h1 .hl{background:linear-gradient(135deg,var(--gold),#f0d060,var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero-sub{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:1rem;color:rgba(255,255,255,.45);line-height:1.7;max-width:480px;margin-bottom:32px}
.hero-features{display:flex;gap:20px;margin-bottom:28px;flex-wrap:wrap}
.hero-ft{display:flex;align-items:center;gap:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:.72rem;color:rgba(255,255,255,.6)}
.ft-icon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:.85rem}.ft-free{background:rgba(52,199,89,.12);color:var(--green)}.ft-one{background:rgba(232,192,64,.12);color:var(--gold)}.ft-daily{background:rgba(124,92,240,.12);color:var(--accent)}
.hero-cta{display:flex;gap:12px;flex-wrap:wrap}.btn{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:.82rem;font-weight:600;padding:12px 28px;border-radius:100px;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:6px;border:none}
.btn-primary{background:var(--gold);color:#0a0b10;font-weight:700}.btn-primary:hover{background:#f0d060;transform:translateY(-2px);box-shadow:0 8px 24px rgba(232,192,64,.35)}
.btn-outline{background:transparent;color:var(--gold);border:1px solid rgba(232,192,64,.3)}.btn-outline:hover{border-color:rgba(232,192,64,.6);background:rgba(232,192,64,.06);transform:translateY(-2px)}
.hero-covers{display:flex;gap:16px;align-items:center;justify-content:center}.hero-cv{width:100px;aspect-ratio:2/3;border-radius:8px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.3);transition:all .3s}.hero-cv:hover{transform:translateY(-6px)}.hero-cv img{width:100%;height:100%;object-fit:cover}
.sec{max-width:1120px;margin:0 auto;padding:56px 24px}.sec-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}.sec-hd h2{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:1.15rem;font-weight:700;color:#fff;letter-spacing:-.3px}.sec-hd .sec-link{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:.72rem;color:var(--gold);font-weight:500}
.rank-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.rank-col{background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden}.rc-hd{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px}.rc-hd h3{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:.8rem;font-weight:700;color:var(--gold)}
.rank-item{display:flex;align-items:center;gap:10px;padding:10px 18px;border-bottom:1px solid rgba(255,255,255,.03);transition:background .15s;cursor:pointer}
.rank-item:hover{background:rgba(255,255,255,.02)}.rank-item:last-child{border-bottom:none}
.rk-num{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:.85rem;font-weight:800;min-width:22px;text-align:center}.rk-num.r1{color:var(--gold)}.rk-num.r2{color:rgba(200,200,210,.7)}.rk-num.r3{color:rgba(180,130,90,.7)}
.rk-dot{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,0.08);flex-shrink:0}
.rk-info{min-width:0;flex:1}.rk-title{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:.76rem;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rk-author{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:.62rem;color:var(--dim)}.rk-stat{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:.65rem;color:var(--gold);text-align:right;font-weight:600}
.social-bar{max-width:1120px;margin:0 auto;padding:0 24px}.social-inner{background:linear-gradient(135deg,rgba(232,192,64,.04),rgba(124,92,240,.04));border:1px solid rgba(232,192,64,.08);border-radius:14px;padding:24px 32px;display:flex;justify-content:center;gap:56px;flex-wrap:wrap}.social-stat{text-align:center}.ss-num{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:1.3rem;font-weight:800;color:#fff;line-height:1.2}.ss-label{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:.65rem;color:var(--dim);text-transform:uppercase;letter-spacing:.5px}.social-divider{width:1px;background:rgba(255,255,255,.06)}
.updates-list{display:flex;flex-direction:column;gap:1px;background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden}.upd-item{display:flex;align-items:center;gap:16px;padding:14px 18px;transition:all .15s;cursor:pointer}.upd-item:hover{background:rgba(232,192,64,.04)}.upd-cover{width:36px;height:50px;border-radius:4px;overflow:hidden;flex-shrink:0}.upd-cover img{width:100%;height:100%;object-fit:cover}.upd-info{flex:1;min-width:0}.upd-title{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:.78rem;font-weight:600;color:#fff}.upd-ch{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:.62rem;color:var(--dim)}.upd-time{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:.6rem;color:var(--dim);flex-shrink:0;text-align:right}.upd-badge{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:.55rem;padding:2px 8px;border-radius:100px;font-weight:600}.upd-badge.new{background:rgba(52,199,89,.12);color:var(--green)}
.ct{max-width:1120px;margin:0 auto;padding:0 24px 40px}
.tb{display:flex;align-items:center;justify-content:space-between;margin:24px 0 20px;flex-wrap:wrap;gap:10px}
.tb-count{font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.78rem;color:var(--dim)}
.tb-sort{font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:6px 14px;background:var(--card);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#fff;font-size:0.78rem;outline:none;cursor:pointer}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:24px;margin-bottom:48px}
.bk{background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden;transition:all 0.3s cubic-bezier(0.4,0,0.2,1);position:relative}
.bk:hover{border-color:rgba(232,192,64,0.2);transform:translateY(-6px);box-shadow:0 12px 32px rgba(0,0,0,0.3);background:var(--card-hover)}
.bk-cv{aspect-ratio:2/3;background:rgba(255,255,255,0.02);overflow:hidden;position:relative}
.bk-cv img{width:100%;height:100%;object-fit:cover;transition:transform 0.4s}
.bk:hover .bk-cv img{transform:scale(1.04)}
.bk-tier{position:absolute;top:8px;left:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:0.55rem;font-weight:700;padding:3px 9px;border-radius:100px;z-index:2}
.bk-tier.free{background:rgba(52,199,89,0.9);color:#000}
.bk-tier.paid{background:rgba(232,192,64,0.9);color:#0a0b10}
.bk-progress{position:absolute;bottom:0;left:0;right:0;height:3px;background:rgba(255,255,255,0.06)}
.bk-progress .prog-bar{height:100%;background:var(--accent);transition:width 0.3s}
.bk-bd{padding:12px 14px}
.bk-genres{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:5px}
.bk-genre{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:0.55rem;font-weight:600;padding:2px 6px;border-radius:3px}
.bk-genre.g-scifi{background:rgba(79,140,255,0.12);color:var(--accent2)}
.bk-genre.g-xianxia{background:rgba(232,192,64,0.12);color:var(--gold)}
.bk-genre.g-urban{background:rgba(232,192,64,0.12);color:var(--gold)}
.bk-genre.g-default{background:rgba(255,255,255,0.06);color:var(--dim)}
.bk-title{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:0.82rem;font-weight:600;margin-bottom:2px;line-height:1.3}
.bk-title a{color:#fff;transition:color 0.15s}
.bk-title a:hover{color:var(--gold)}
.bk-author{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:0.66rem;color:var(--dim);margin-bottom:6px}
.bk-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.6rem;color:var(--dim)}
.bk-rating{color:var(--gold);font-weight:700}
.bk-stats{display:flex;align-items:center;justify-content:space-between;margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.04);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:0.58rem;color:var(--dim)}
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
.ch-sec{margin-top:24px}
.ch-sec h2{font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.85rem;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.05)}
.ch-list{display:flex;flex-direction:column;gap:1px}
.ch-item{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:6px;transition:background 0.15s}
.ch-item:hover{background:rgba(255,255,255,0.02)}
.ch-num{font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:var(--gold);font-weight:700;min-width:28px;text-align:right;font-size:0.75rem}
.ch-title{font-size:0.82rem;color:var(--dim)}
.ch-title a:hover{color:#fff}
.cp{max-width:720px;margin:24px auto;padding:0 24px}
.cp-hd{margin-bottom:20px}
.cp-hd .cp-book{font-size:0.82rem;color:var(--dim)}
.cp-hd .cp-book a{color:var(--gold)}
.cp-hd h1{font-size:1.2rem;font-weight:700;color:#fff;margin:4px 0}
.cp-nav{display:flex;justify-content:space-between;align-items:center;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.78rem;margin:32px 0;padding:12px 0;border-top:1px solid rgba(255,255,255,0.05);border-bottom:1px solid rgba(255,255,255,0.05)}
.cp-nav a{color:var(--gold)}
.cp-nav a:hover{color:#fff}
.cp-nav span{color:var(--dim)}
.ch-content{font-size:0.88rem;color:var(--dim);line-height:1.85;white-space:pre-line}
#reader-content p{margin-bottom:0.8em}
#reader-toolbar button:hover{background:rgba(255,255,255,0.06)!important;color:#fff!important}
#reader-drawer::-webkit-scrollbar{width:4px}
#reader-drawer::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}
.picks-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:18px}
.pick-card{background:linear-gradient(135deg,var(--card),rgba(232,192,64,0.04));border:1px solid var(--border);border-radius:16px;padding:24px;display:flex;gap:18px;transition:all 0.25s;cursor:pointer}
.pick-card:hover{border-color:rgba(232,192,64,0.2);transform:translateY(-4px);box-shadow:0 8px 24px rgba(232,192,64,0.08)}
.pick-cv{width:90px;height:125px;border-radius:8px;overflow:hidden;flex-shrink:0;box-shadow:0 4px 12px rgba(0,0,0,0.3)}
.pick-cv img{width:100%;height:100%;object-fit:cover}
.pick-info{flex:1;min-width:0}
.pick-info .pick-label{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:0.58rem;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:var(--gold);margin-bottom:6px}
.pick-info h3{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:0.95rem;font-weight:700;color:#fff;margin-bottom:4px;line-height:1.3}
.pick-info .pick-author{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:0.68rem;color:var(--dim);margin-bottom:8px}
.pick-info .pick-quote{font-size:0.7rem;color:var(--dim);line-height:1.7;font-style:italic}
.news-sec{max-width:1120px;margin:0 auto;padding:32px 24px}
.news-box{background:linear-gradient(135deg,rgba(232,192,64,0.06),rgba(124,92,240,0.05),rgba(232,192,64,0.03));border:1px solid rgba(232,192,64,0.12);border-radius:16px;padding:40px 32px;text-align:center}
.news-box h2{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:1.1rem;font-weight:700;color:#fff;margin-bottom:6px}
.news-box p{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:0.78rem;color:var(--dim);margin-bottom:20px}
.news-form{display:flex;gap:10px;max-width:440px;margin:0 auto}.news-form input{flex:1;padding:12px 18px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:.8rem;outline:none}.news-form input:focus{border-color:var(--gold)}.news-form button{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:.8rem;font-weight:600;padding:12px 24px;background:var(--gold);color:#0a0b10;border:none;border-radius:10px;cursor:pointer}.news-form button:hover{background:#f0d060;transform:translateY(-1px);box-shadow:0 4px 16px rgba(232,192,64,.25)}
.ft{border-top:1px solid var(--border);padding:0}
.ft-grid{max-width:1120px;margin:0 auto;padding:40px 24px 24px;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:32px}
.ft-brand .ft-logo{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:1.05rem;font-weight:700;color:#fff;margin-bottom:8px}
.ft-brand p{font-size:0.7rem;color:var(--dim);line-height:1.6;max-width:240px}
.ft-col h4{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:0.68rem;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px}
.ft-col a{display:block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:0.7rem;color:var(--dim);margin-bottom:6px;transition:color .15s}
.ft-col a:hover{color:#fff}
.ft-bottom{max-width:1120px;margin:0 auto;padding:16px 24px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
.ft-bottom span{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:0.65rem;color:var(--dim)}
.ft-social{display:flex;gap:12px}
.ft-social a{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.04);display:flex;align-items:center;justify-content:center;font-size:.7rem;transition:all .15s;color:var(--dim)}
.ft-social a:hover{background:var(--accent);color:#fff}
.err{text-align:center;padding:80px 24px}
.err h1{font-size:3rem;color:#fff;margin-bottom:8px}
.err p{color:var(--dim);margin-bottom:16px}
.err a{color:var(--gold);font-family:-apple-system,BlinkMacSystemFont,sans-serif}
.zone-tabs{max-width:1120px;margin:0 auto;padding:20px 24px 0;display:flex;gap:8px;flex-wrap:wrap}
.zt{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:0.78rem;padding:8px 18px;border-radius:100px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:var(--dim);cursor:pointer;transition:all 0.15s}
.zt:hover{color:#fff;border-color:rgba(255,255,255,0.2)}
.zt.active{background:var(--gold);color:#0a0b10;border-color:var(--gold)}
.zt.zt-gold.active{background:var(--gold);color:#0a0b10;border-color:var(--gold)}
.zt.zt-green.active{background:var(--green);color:#0a0b10;border-color:var(--green)}
.zt.zt-lib.active{background:var(--accent);color:#fff;border-color:var(--accent)}
.lib-section{max-width:1120px;margin:0 auto;padding:0 24px;display:none}
.lib-section h2{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:0.85rem;font-weight:700;color:var(--gold);margin:16px 0 12px}
.lib-empty{text-align:center;padding:32px 16px;color:var(--dim);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:0.82rem}
.lib-empty a{color:var(--gold)}
.sch-wrap{max-width:1120px;margin:0 auto;padding:16px 24px 0}
.sch-bar{position:relative}
.sch-bar input{width:100%;padding:12px 16px 12px 42px;background:var(--card);border:1px solid rgba(255,255,255,0.08);border-radius:10px;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:0.82rem;outline:none;transition:border-color 0.2s}
.sch-bar input:focus{border-color:var(--gold)}
.sch-bar input::placeholder{color:var(--dim)}
.sch-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:0.85rem;pointer-events:none;opacity:0.4}
.gf-wrap{max-width:1120px;margin:0 auto;padding:14px 24px 0}
.gf-bar{display:flex;flex-wrap:wrap;gap:8px}
.gf-chip{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:0.72rem;padding:6px 14px;border-radius:100px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:var(--dim);cursor:pointer;transition:all 0.15s;white-space:nowrap}
.gf-chip:hover{color:#fff;border-color:rgba(255,255,255,0.2)}
.gf-chip.active{background:rgba(232,192,64,0.12);color:var(--gold);border-color:rgba(232,192,64,0.25)}
.gf-chip .cnt{font-size:0.62rem;opacity:0.6;margin-left:2px}
.no-results{text-align:center;padding:48px 24px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:var(--dim);font-size:0.85rem;display:none}
.bk.hidden{display:none}
.anim-up{animation:fadeInUp 0.6s ease forwards}
.anim-up.d1{animation-delay:0.05s}.anim-up.d2{animation-delay:0.12s}.anim-up.d3{animation-delay:0.19s}.anim-up.d4{animation-delay:0.26s}
@keyframes fadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeInDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.s-go{color:var(--green);background:rgba(52,199,89,0.08)}
.s-done{color:var(--gold);background:rgba(232,192,64,0.08)}
@media(max-width:900px){.hero-grid{grid-template-columns:1fr;gap:24px;text-align:center;padding:40px 20px}.hero-text{max-width:100%}.hero-text h1{font-size:2rem}.hero-features{justify-content:center}.hero-cta{justify-content:center}.hero-covers{display:none}.hero-new{min-height:auto}.ft-grid{grid-template-columns:1fr 1fr}.social-inner{gap:24px}.rank-grid{grid-template-columns:1fr}}
@media(max-width:768px){
  .hd-in{padding:10px 16px}.hd-nav{gap:8px;flex-wrap:wrap}.hd-nav a{font-size:0.68rem}.hd-nav a.nav-cta{font-size:0.65rem;padding:5px 10px}.nav-drop{display:none}
  .hero-text h1{font-size:1.8rem}.hero-grid{padding:32px 16px;gap:16px}.hero-text .hero-sub{font-size:0.85rem}.hero-new{min-height:auto;padding:20px 0}
  .grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}.bk-bd{padding:8px 10px}.bk-title{font-size:0.72rem}.bk-genres{display:none}.bk-stats{gap:4px;font-size:0.55rem}
  .picks-grid{grid-template-columns:1fr}
  .social-inner{flex-direction:column;gap:16px;padding:16px 24px}.social-divider{display:none}.social-stat .ss-num{font-size:1.1rem}
  .news-box{padding:28px 16px}.news-form{flex-direction:column}
  .rank-item{padding:8px 14px}.upd-time{display:none}
  .ft-grid{grid-template-columns:1fr;gap:24px}.ft-bottom{flex-direction:column;text-align:center}
  .detail-hd{flex-direction:column;align-items:center;text-align:center}.detail-cv{width:120px}
  .cp{max-width:100%!important;padding:0 16px!important}.ch-content{font-size:0.85rem!important;line-height:1.75!important}
  .cp-hd h1{font-size:1.15rem}.cp-book{font-size:0.72rem}
  .sec{padding:40px 16px}.ct{padding:0 16px 32px}
  .zone-tabs{padding:16px 16px 0;gap:6px}.zt{font-size:0.65rem;padding:6px 12px}
  .gf-wrap{padding:10px 16px 0}.gf-chip{font-size:0.62rem;padding:4px 10px}
  .sch-wrap{padding:12px 16px 0}
  .fv-review-form{padding:10px!important}.fv-review-form input,.fv-review-form textarea{font-size:0.78rem!important}
  .fv-review-stars{font-size:0.9rem!important}
}

@media(max-width:480px){
  .hd-in{padding:8px 12px}.hd-logo{font-size:0.95rem}.hd-nav a{font-size:0.62rem;padding:0 2px}
  .hero-text h1{font-size:1.4rem!important;letter-spacing:-0.5px}.hero-grid{padding:24px 12px;gap:12px}.hero-text .hero-sub{font-size:0.78rem}.hero-badge{font-size:0.55rem;padding:4px 10px}
  .hero-features{flex-direction:column;gap:8px;align-items:center}.hero-ft{font-size:0.68rem}.hero-cta{flex-direction:column;width:100%}.btn{width:100%;justify-content:center;font-size:0.78rem;padding:10px 20px}
  .grid{grid-template-columns:repeat(2,1fr);gap:10px}.bk-bd{padding:6px 8px}.bk-title{font-size:0.68rem}.bk-meta{font-size:0.55rem}.bk-rating{font-size:0.6rem}
  .sec{padding:28px 12px}.sec-hd h2{font-size:0.95rem}.ct{padding:0 12px 24px}
  .detail-hd{gap:12px}.detail-cv{width:100px}.detail-info h1{font-size:1.15rem}.detail-info .by{font-size:0.75rem}
  .detail-stats{flex-wrap:wrap;gap:8px;font-size:0.68rem}.detail-desc{font-size:0.78rem}
  .ch-item{font-size:0.72rem}.ch-num{min-width:22px;font-size:0.68rem}.ch-title{font-size:0.72rem}
  .cp{padding:0 12px!important}.cp-hd h1{font-size:1rem!important}.ch-content{font-size:0.82rem!important;line-height:1.7!important}
  .cp-nav{flex-wrap:wrap;gap:4px;font-size:0.72rem}.cp-nav a{font-size:0.72rem}
  .rank-grid{grid-template-columns:1fr;gap:12px}
  .updates-list .upd-item{padding:10px 12px}.upd-title{font-size:0.72rem}.upd-cover{width:28px;height:40px}
  .picks-grid{gap:12px}.pick-card{padding:16px}
  .bk-tier{font-size:0.5rem;padding:2px 7px}
  .zone-tabs{gap:4px}.zt{font-size:0.6rem;padding:5px 10px}
  .gf-chip{font-size:0.58rem;padding:3px 8px}
  .fv-review-form{flex-direction:column!important;gap:8px}.fv-review-form input,.fv-review-form textarea{padding:8px!important;font-size:0.8rem!important;border-radius:6px!important}
  .fv-review-form button{margin-top:8px!important;width:100%!important;padding:10px!important;font-size:0.82rem!important}
  .fv-star{font-size:1.3rem!important}
  .fv-review-item{padding:8px 0!important}.fv-review-name{font-size:0.72rem}.fv-review-body{font-size:0.74rem!important}
  .fv-gift-popup{left:12px!important;right:12px!important;max-width:100%!important;bottom:12px!important}
  .fv-checkin-widget{flex-direction:column;gap:8px}.fv-checkin-widget button{width:100%}
  .social-inner{padding:12px 16px;gap:12px}
  .news-box{padding:20px 12px}.news-form input{font-size:0.78rem}
  .ft-grid{gap:20px;padding:24px 12px}.ft-col h4{font-size:0.65rem}.ft-col a{font-size:0.62rem}.ft-bottom{font-size:0.58rem}
  .unlock-box{padding:20px 16px!important}.unlock-box h2{font-size:1rem!important}
}
/* ═══════════════════════════════════════════
   CATEGORY DISCOVERY CARDS
   ═══════════════════════════════════════════ */
.cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px}
.cat-card{background:linear-gradient(160deg,var(--card) 40%,rgba(232,192,64,0.03) 100%);border:1px solid var(--border);border-radius:14px;padding:20px;transition:all 0.3s;cursor:pointer;display:block;text-decoration:none;position:relative;overflow:hidden}
.cat-card:hover{border-color:rgba(232,192,64,0.25);transform:translateY(-4px);box-shadow:0 8px 28px rgba(0,0,0,0.3)}
.cat-card::after{content:'';position:absolute;top:-40px;right:-40px;width:80px;height:80px;border-radius:50%;background:rgba(232,192,64,0.02);transition:transform 0.3s}
.cat-card:hover::after{transform:scale(2.5)}
.cat-card-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.cat-icon{font-size:1.3rem}
.cat-count{font-size:0.58rem;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:var(--gold);background:rgba(232,192,64,0.1);padding:2px 8px;border-radius:100px}
.cat-card h3{font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.82rem;font-weight:700;color:#fff;margin-bottom:4px}
.cat-desc{font-size:0.65rem;color:var(--dim);line-height:1.5;margin-bottom:12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif}
.cat-covers{display:flex;align-items:center;position:relative;height:44px}
.cat-cv-stack-item{width:36px;height:50px;border-radius:4px;overflow:hidden;border:1.5px solid var(--card);box-shadow:0 2px 8px rgba(0,0,0,0.4);flex-shrink:0;position:relative}
.cat-cv-stack-item img{width:100%;height:100%;object-fit:cover}
/* ═══════════════════════════════════════════
   BROWSE LAYOUT — SIDEBAR + MAIN
   ═══════════════════════════════════════════ */
.browse-wrap{max-width:1280px;margin:0 auto;padding:20px 24px 40px;display:grid;grid-template-columns:240px 1fr;gap:28px;align-items:start}
/* Sidebar */
.browse-sidebar{position:sticky;top:70px;background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden;max-height:calc(100vh - 100px);overflow-y:auto;z-index:50}
.browse-sidebar::-webkit-scrollbar{width:4px}
.browse-sidebar::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px}
.sb-header{display:none;padding:14px 16px;border-bottom:1px solid var(--border);align-items:center;justify-content:space-between}
.sb-title{font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.8rem;font-weight:700;color:#fff}
.sb-close{background:none;border:none;color:var(--dim);font-size:1rem;cursor:pointer;padding:4px 8px}
.sb-nav{padding:8px}
.sb-item{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:8px;cursor:pointer;transition:all 0.15s;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.75rem;color:var(--dim)}
.sb-item:hover{background:rgba(255,255,255,0.03);color:#fff}
.sb-item.active{background:rgba(232,192,64,0.1);color:var(--gold)}
.sb-item.sb-parent{font-weight:600}
.sb-item.sb-sub{padding-left:32px;font-size:0.7rem}
.sb-icon{font-size:0.85rem;flex-shrink:0;width:20px;text-align:center}
.sb-label{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sb-badge{font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.58rem;padding:1px 6px;border-radius:100px;background:rgba(255,255,255,0.06);color:var(--dim);flex-shrink:0}
.sb-item.active .sb-badge{background:rgba(232,192,64,0.15);color:var(--gold)}
.sb-arrow{font-size:0.55rem;color:var(--dim);transition:transform 0.2s;flex-shrink:0}
/* Sidebar Overlay */
.sb-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:55}
/* Main Content */
.browse-main{min-width:0}
.sidebar-toggle-btn{display:none;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.68rem;color:var(--gold);background:rgba(232,192,64,0.08);border:1px solid rgba(232,192,64,0.15);padding:5px 12px;border-radius:100px;cursor:pointer}
/* Mobile Chip Bar */
.mb-chips{display:none;flex-wrap:wrap;gap:6px;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.04)}
.mb-chip{font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.65rem;padding:5px 11px;border-radius:100px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:var(--dim);cursor:pointer;white-space:nowrap;transition:all 0.15s}
.mb-chip:hover{color:#fff;border-color:rgba(255,255,255,0.2)}
.mb-chip.active{background:rgba(232,192,64,0.12);color:var(--gold);border-color:rgba(232,192,64,0.25)}
.mb-chip .cnt{font-size:0.55rem;opacity:0.6}
/* Browse Toolbar */
.browse-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px}
.browse-search{flex:1;min-width:180px;position:relative}
.browse-search input{width:100%;padding:10px 14px 10px 36px;background:var(--card);border:1px solid rgba(255,255,255,0.08);border-radius:10px;color:#fff;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.78rem;outline:none}
.browse-search input:focus{border-color:var(--gold)}
.browse-search .sch-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:0.8rem;opacity:0.4;pointer-events:none}
.browse-filters{display:flex;gap:8px;flex-wrap:wrap}
.browse-filter{font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.7rem;padding:8px 12px;background:var(--card);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#fff;outline:none;cursor:pointer}
.browse-filter:focus{border-color:rgba(232,192,64,0.3)}
/* Quick Sort Chips */
.qf-wrap{max-width:100%;padding:0 0 12px;border-bottom:1px solid rgba(255,255,255,0.04)}
.qf-bar{display:flex;gap:8px;flex-wrap:wrap}
.qf-chip{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:0.75rem;padding:7px 16px;border-radius:100px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);color:var(--dim);cursor:pointer;transition:all 0.2s;white-space:nowrap}
.qf-chip:hover{color:#fff;border-color:rgba(255,255,255,0.2)}
.qf-chip.active{background:rgba(232,192,64,0.12);color:var(--gold);border-color:rgba(232,192,64,0.3);font-weight:600}
/* Active Filter Info */
.browse-info{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px}
#filterLabel{font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.65rem;color:var(--dim);text-transform:uppercase;letter-spacing:0.5px}
/* Pagination */
.pagination{margin-top:40px;padding:24px 0;border-top:1px solid var(--border);text-align:center}
.pg-inner{display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:16px}
.pg-btn{font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.78rem;padding:10px 22px;border-radius:100px;border:1px solid rgba(232,192,64,0.25);background:var(--card);color:var(--gold);cursor:pointer;transition:all 0.2s;font-weight:600}
.pg-btn:hover:not(:disabled){background:rgba(232,192,64,0.1);border-color:rgba(232,192,64,0.5);color:#fff;transform:translateY(-1px)}
.pg-btn:disabled{opacity:0.25;cursor:not-allowed;border-color:rgba(255,255,255,0.06);color:var(--dim)}
.pg-info{font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.75rem;color:var(--dim)}
.pg-nums{display:flex;align-items:center;justify-content:center;gap:8px}
.pg-num{font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.75rem;min-width:36px;height:36px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:var(--card);color:var(--dim);cursor:pointer;transition:all 0.15s;display:flex;align-items:center;justify-content:center}
.pg-num:hover{color:#fff;border-color:var(--gold);background:rgba(232,192,64,0.06)}
.pg-num.active{background:rgba(232,192,64,0.15);color:var(--gold);border-color:rgba(232,192,64,0.4);font-weight:700;box-shadow:0 0 12px rgba(232,192,64,0.1)}
.pg-ellipsis{font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.75rem;color:var(--dim);padding:0 6px}
/* ═══════════════════════════════════════════
   RESPONSIVE — SIDEBAR + BROWSE
   ═══════════════════════════════════════════ */
@media(max-width:900px){
  .browse-wrap{grid-template-columns:1fr;padding:12px 16px 32px}
  .browse-sidebar{position:fixed;top:0;left:0;bottom:0;width:280px;max-width:85vw;z-index:60;border-radius:0;border:none;border-right:1px solid var(--border);transform:translateX(-100%);transition:transform 0.25s;max-height:100vh}
  .browse-sidebar.open{transform:translateX(0)}
  .sb-header{display:flex}
  .sb-overlay.open{display:block}
  .sidebar-toggle-btn{display:inline-flex}
  .mb-chips{display:flex}
  .cat-grid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}
  .cat-card{padding:14px}.cat-card h3{font-size:0.72rem}.cat-desc{display:none}
}
@media(max-width:480px){
  .browse-wrap{padding:8px 10px 24px}
  .browse-toolbar{flex-direction:column;gap:8px}
  .browse-search{min-width:100%}
  .browse-filters{width:100%}
  .browse-filter{flex:1;font-size:0.62rem;padding:7px 8px}
  .cat-grid{grid-template-columns:repeat(2,1fr);gap:8px}
  .cat-card{padding:12px}.cat-covers{display:none}.cat-card h3{font-size:0.68rem}.cat-card-top{margin-bottom:6px}
  .pg-num{min-width:28px;height:28px;font-size:0.65rem;border-radius:8px}
  .pg-btn{font-size:0.68rem;padding:7px 14px}
  .qf-chip{font-size:0.62rem;padding:5px 10px}
}
</style>
</head>
<body>`;

const BASE_FOOTER = `<footer class="ft" role="contentinfo">
  <div class="ft-grid">
    <div class="ft-brand"><div class="ft-logo">FictionVerse</div><p>Independent publisher of original English web novels. Read free chapters, support indie authors.</p></div>
    <div class="ft-col"><h4>Discover</h4><a href="/">All Novels</a><a href="/bookshelf">Your Shelf</a></div>
    <div class="ft-col"><h4>Community</h4><a href="/community">Forum</a><a href="/unpublished">Unpublished</a><a href="/author">Become an Author</a></div>
    <div class="ft-col"><h4>About</h4><a href="/about">Our Story</a><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="mailto:${site.email}">Support</a></div>
  </div>
  <div class="ft-bottom"><span>© 2026 ${site.company}. Original fiction, independently published.</span><div class="ft-social"><a href="/community" title="Community" aria-label="Community">💬</a></div></div>
</footer>
<script src="/app.js"></script>
<script>window._FV_BOOK_COUNT=${books.length};</script>
</body></html>`;

const BASE_HEADER = `<header class="hd"><div class="hd-in">
  <a href="/" class="hd-logo">FictionVerse</a>
  <nav class="hd-nav">
    <a href="javascript:history.back()" class="hd-icon-btn" title="Back">←</a>
    <a href="javascript:location.reload()" class="hd-icon-btn" title="Refresh">↻</a>
    <div class="nav-drop"><span class="dd-trigger" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:0.78rem;color:var(--dim);cursor:pointer">Browse</span><div class="dd-menu">
      <a href="/">All Novels</a>
      ${genreOrder.map(g => `<a href="/genre/${g}/">${genreStats[g].name}</a>`).join('\n')}
    </div></div>
    <a href="/bookshelf">Shelf</a><a href="/community">Forum</a><a href="/unpublished">Unpublished</a><a href="/about">About</a>
    <a href="/author" class="nav-cta">Publish</a>
  </nav>
</div></header>`;

// Book card HTML (v2 enhanced design)
function bookCard(book) {
  const s = '★'.repeat(Math.floor(book.rating)) + (book.rating % 1 >= 0.5 ? '½' : '');
  const gn = GENRE_TAXONOMY[book.genre]?.name || book.genre;
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const tierBadge = book.tier === 'free'
    ? '<span class="bk-tier free">FREE</span>'
    : '<span class="bk-tier paid">$' + (book.price || '4.99') + '</span>';
  const genreClass = book.genre === 'scifi' ? 'g-scifi' : book.genre === 'xianxia' ? 'g-xianxia' : book.genre === 'urban' ? 'g-urban' : 'g-default';
  const genreLabels = (book.genres || [book.genre]).map(g => GENRE_TAXONOMY[g]?.name || g).join(' · ');
  return `<article class="bk anim-up" data-slug="${book.slug}" data-genre="${book.genre}" data-tier="${book.tier || 'free'}" data-title="${esc(book.title)}" data-author="${esc(book.author)}" data-status="${book.status || 'ongoing'}" data-words="${book.wordCount || 0}">
  <a href="/read/${book.slug}/" class="bk-cv"><img src="${book.cover}" alt="${book.coverAlt}" loading="lazy">${tierBadge}<div class="bk-progress"><div class="prog-bar" style="width:100%"></div></div></a>
  <div class="bk-bd">
    <div class="bk-genres"><span class="bk-genre ${genreClass}">${genreLabels}</span></div>
    <h2 class="bk-title"><a href="/read/${book.slug}/">${book.title}</a></h2>
    <div class="bk-author">by ${book.author}</div>
    <div class="bk-meta">
      <span class="bk-rating">${s} ${book.rating}</span>
      <span>${book.chapters} ch · ${(book.wordCount/1000).toFixed(0)}k words</span>
    </div>
    <div class="bk-stats"><span>👁 ${500+Math.floor(Math.random()*1200)} reads</span><span>📚 ${20+Math.floor(Math.random()*80)} shelves</span></div>
  </div>
</article>`;
}

// ─── 1. 首页 index.html ───
const sorted = [...books].sort((a, b) => b.rating - a.rating);
const byChapters = [...books].sort((a, b) => b.chapters - a.chapters).reverse();
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

// Generate ranking items
const genRankItem = (book, rank, showRating) => {
  const rn = ['r1','r2','r3',''][rank - 1] || '';
  const stat = showRating ? `★ ${book.rating}` : `${book.chapters} ch`;
  return `<a href="/read/${book.slug}/" class="rank-item"><span class="rk-num ${rn}">${rank}</span><span class="rk-dot"></span><div class="rk-info"><div class="rk-title">${book.title}</div><div class="rk-author">${book.author}</div></div><span class="rk-stat">${stat}</span></a>`;
};

const rankItemsPopular = sorted.slice(0, 4).map((b, i) => genRankItem(b, i + 1, true)).join('\n');
const rankItemsContent = byChapters.slice(0, 4).map((b, i) => genRankItem(b, i + 1, false)).join('\n');

// Generate latest updates items
const updateTimes = ['2 days ago', '4 days ago', '5 days ago', '6 days ago'];
const updateChNames = [
  'Chapter 56 — The Source Code Breaks', 'Chapter 42 — The Sword God\'s Legacy',
  'Chapter 38 — The Billionaire\'s Death Date', 'Chapter 11 — The First Harvest'
];
const latestUpdates = sorted.slice(0, 8).map((b, i) => {
  const badge = i === 0 ? '<span class="upd-badge new">NEW</span>' : '';
  return `<a href="/read/${b.slug}/" class="upd-item">
    <div class="upd-cover"><img src="${b.cover}" alt="" loading="lazy"></div>
    <div class="upd-info"><div class="upd-title">${b.title}</div><div class="upd-ch">${updateChNames[i] || 'Chapter ' + b.chapters}</div></div>
    ${badge}<span class="upd-time">${updateTimes[i] || `${i + 1} days ago`}</span></a>`;
}).join('\n');

// Editor's picks
const picks = [
  { label: 'Staff Pick', book: sorted[0], quote: sorted[0].description.substring(0, 100) + '...' },
  { label: 'Editor\'s Choice', book: sorted[1] || sorted[0], quote: (sorted[1] || sorted[0]).description.substring(0, 100) + '...' }
];
const editorPicks = picks.map(p => {
  const genreStr = (p.book.genres || [p.book.genre]).map(g => GENRE_TAXONOMY[g]?.name || g).join(' · ');
  return `<a href="/read/${p.book.slug}/" class="pick-card">
    <div class="pick-cv"><img src="${p.book.cover}" alt="${p.book.title}" loading="lazy"></div>
    <div class="pick-info">
      <div class="pick-label">${p.label}</div>
      <h3>${p.book.title}</h3>
      <div class="pick-author">by ${p.book.author} · ${genreStr}</div>
      <div class="pick-quote">"${p.quote}"</div>
    </div></a>`;
}).join('\n');

const indexHTML = `${BASE_HEAD('FictionVerse — Original English Web Novels | Free Chapters',
  'Discover original English web novels across Xianxia, Urban Fantasy, Sci-Fi LitRPG. Read everything free. No payment, no subscription.',
  site.url + '/',
  indexSchema.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n') +
  `<script type="application/ld+json">${itemListSchema}</script>`)}
${BASE_HEADER}

<!-- ═══════ HERO ═══════ -->
<section class="hero-new"><div class="hero-grid">
<div class="hero-text">
  <div class="hero-badge">Independent Original Fiction</div>
  <h1>Stories That <span class="hl">Stay With You</span></h1>
  <p class="hero-sub">Discover original English web novels crafted by independent authors. Browse by genre, start reading free.</p>
  <div class="hero-cta">
    <a href="#browse" class="btn btn-primary">Browse Library</a>
    <a href="/author" class="btn btn-outline">Become an Author</a>
  </div>
</div>
<div class="hero-covers">
${sorted.slice(0, 3).map(b => `<a href="/read/${b.slug}/" class="hero-cv"><img src="${b.cover}" alt="${b.title}" loading="eager"></a>`).join('\n')}
</div></div></section>

<!-- ═══════ SOCIAL PROOF ═══════ -->
<div class="social-bar"><div class="social-inner">
  <div class="social-stat"><div class="ss-num">${books.length}</div><div class="ss-label">Original Novels</div></div><div class="social-divider"></div>
  <div class="social-stat"><div class="ss-num">${totalChapters}</div><div class="ss-label">Chapters Published</div></div><div class="social-divider"></div>
  <div class="social-stat"><div class="ss-num">${(totalWords/1000).toFixed(0)}k</div><div class="ss-label">Total Words</div></div><div class="social-divider"></div>
  <div class="social-stat"><div class="ss-num">${books.length}</div><div class="ss-label">Active Authors</div></div>
</div></div>

<!-- ═══════ CATEGORY DISCOVERY CARDS ═══════ -->
<div class="sec"><div class="sec-hd"><h2>Explore by Genre</h2><a href="#browse" class="sec-link">Browse all →</a></div>
<div class="cat-grid anim-up">
${groupOrder.map(gk => {
  const g = groupGenres[gk];
  const totalCount = g.genres.reduce((s, x) => s + x.count, 0);
  const topCovers = g.genres.flatMap(x => x.books.slice(0, 2)).slice(0, 3);
  const coverHTML = topCovers.map((b, i) => {
    const delay = ['d1','d2','d3'][i] || 'd3';
    return `<div class="cat-cv-stack-item" style="z-index:${3-i};${i>0?`transform:translateX(${i*12}px)`:'transform:none'}"><img src="${b.cover}" alt="${b.title}" loading="lazy"></div>`;
  }).join('');
  return `<a href="#browse" class="cat-card" onclick="document.querySelector('.sb-item[data-genre-group=\\'${gk}\\']').click();return false" style="animation-delay:${groupOrder.indexOf(gk)*0.08}s">
    <div class="cat-card-top">
      <span class="cat-icon">${g.icon}</span>
      <span class="cat-count">${totalCount} novels</span>
    </div>
    <h3>${g.name}</h3>
    <p class="cat-desc">${g.desc}</p>
    <div class="cat-covers">${coverHTML}</div>
  </a>`;
}).join('\n')}
</div></div>

<!-- ═══════ BROWSE — SIDEBAR + MAIN GRID ═══════ -->
<div id="browse"></div>
<div class="sec"><div class="sec-hd"><h2>Browse Library</h2><span class="sec-link" id="browsePageLabel">${books.length} novels</span></div></div>
<div class="browse-wrap">
  <!-- SIDEBAR -->
  <aside class="browse-sidebar" id="browseSidebar">
    <div class="sb-header">
      <span class="sb-title">Categories</span>
      <button class="sb-close" id="sbClose" onclick="toggleSidebar()" title="Close sidebar">✕</button>
    </div>
    <nav class="sb-nav">
      <div class="sb-item active" data-genre-group="" data-genre="all" onclick="selectBrowse(this,'all','')">
        <span class="sb-icon">📚</span>
        <span class="sb-label">All Novels</span>
        <span class="sb-badge">${books.length}</span>
      </div>
${groupOrder.map(gk => {
  const g = groupGenres[gk];
  const totalCount = g.genres.reduce((s, x) => s + x.count, 0);
  const subHTML = g.genres.sort((a, b) => b.count - a.count).map(gg => 
    `      <div class="sb-item sb-sub" data-genre-group="${gk}" data-genre="${gg.key}" onclick="event.stopPropagation();selectBrowse(this,'${gg.key}','${gk}')">
        <span class="sb-icon">${gg.icon}</span>
        <span class="sb-label">${gg.name}</span>
        <span class="sb-badge">${gg.count}</span>
      </div>`
  ).join('\n');
  return `      <div class="sb-group">
        <div class="sb-item sb-parent" data-genre-group="${gk}" data-genre="" onclick="selectBrowse(this,'','${gk}')">
          <span class="sb-icon">${g.icon}</span>
          <span class="sb-label">${g.name}</span>
          <span class="sb-arrow" id="sbArrow_${gk}">▸</span>
          <span class="sb-badge">${totalCount}</span>
        </div>
        <div class="sb-subs" id="sbSubs_${gk}" style="display:none">
${subHTML}
        </div>
      </div>`;
}).join('\n')}
    </nav>
  </aside>

  <!-- SIDEBAR OVERLAY (mobile) -->
  <div class="sb-overlay" id="sbOverlay" onclick="toggleSidebar()"></div>

  <!-- MAIN CONTENT -->
  <main class="browse-main">
    <!-- MOBILE CHIP BAR -->
    <div class="mb-chips" id="mbChips">
      <button class="mb-chip active" data-genre="all" onclick="selectBrowseMobile('all','')">All</button>
${groupOrder.map(gk => {
  const g = groupGenres[gk];
  return g.genres.sort((a, b) => b.count - a.count).map(gg =>
    `      <button class="mb-chip" data-genre="${gg.key}" onclick="selectBrowseMobile('${gg.key}','${gk}')">${gg.name}<span class="cnt">(${gg.count})</span></button>`
  ).join('\n');
}).join('\n')}
    </div>

    <!-- QUICK SORT CHIPS -->
    <div class="qf-wrap"><div class="qf-bar">
      <button class="qf-chip active" data-sort="rating" onclick="quickSort('rating',this)">⭐ Top Rated</button>
      <button class="qf-chip" data-sort="chapters" onclick="quickSort('chapters',this)">📖 Most Chapters</button>
      <button class="qf-chip" data-sort="newest" onclick="quickSort('newest',this)">🔥 Recently Updated</button>
      <button class="qf-chip" data-sort="words" onclick="quickSort('words',this)">📚 Longest</button>
    </div></div>

    <!-- SEARCH + FILTERS -->
    <div class="browse-toolbar">
      <div class="browse-search">
        <span class="sch-icon">&#128269;</span>
        <input type="text" id="searchInput" placeholder="Search by title, author..." oninput="debounceFilter()">
      </div>
      <div class="browse-filters">
        <select class="browse-filter" id="statusFilter" onchange="applyFilters()">
          <option value="all">All Status</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>
        <select class="browse-filter" id="wordsFilter" onchange="applyFilters()">
          <option value="all">All Lengths</option>
          <option value="0-50">Under 50k words</option>
          <option value="50-100">50k – 100k words</option>
          <option value="100-200">100k – 200k words</option>
          <option value="200+">200k+ words</option>
        </select>
        <select class="browse-filter" id="sortSelect" onchange="applyFilters()">
          <option value="rating">Top Rated</option>
          <option value="chapters">Most Chapters</option>
          <option value="words">Longest</option>
          <option value="newest">Recently Updated</option>
        </select>
      </div>
    </div>

    <!-- ACTIVE FILTER INFO -->
    <div class="browse-info" id="browseInfo">
      <span id="filterLabel">All Novels (${books.length})</span>
      <button class="sidebar-toggle-btn" id="sbToggle" onclick="toggleSidebar()" title="Show categories">☰ Categories</button>
    </div>

    <!-- BOOK GRID -->
    <div class="grid" id="bookGrid">${bookCards}</div>

    <!-- NO RESULTS -->
    <div class="no-results" id="noResults">No novels found. Try adjusting your filters.</div>

    <!-- PAGINATION -->
    <div class="pagination" id="pagination"></div>
  </main>
</div>

<!-- ═══════ LATEST UPDATES ═══════ -->
<div class="sec"><div class="sec-hd"><h2>Latest Updates</h2><a href="#browse" class="sec-link">All novels →</a></div>
<div class="updates-list">${latestUpdates}</div></div>

<!-- ═══════ EDITOR'S PICKS ═══════ -->
<div class="sec"><div class="sec-hd"><h2>Editor's Picks</h2><a href="#browse" class="sec-link">Browse all →</a></div>
<div class="picks-grid">${editorPicks}</div></div>

<!-- ═══════ NEWSLETTER ═══════ -->
<div class="news-sec"><div class="news-box">
  <h2>Never Miss a New Chapter</h2>
  <p>Get notified when your favorite authors publish new stories. No spam, just stories.</p>
  <div class="news-form">
    <input type="email" id="newsEmail" placeholder="your@email.com">
    <button onclick="document.getElementById('newsEmail').value&&alert('Thanks!')">Subscribe</button>
  </div>
</div></div>

<script>
// ─── BOOK DATA ───
const BOOKS = ${JSON.stringify(books.map(b=>({slug:b.slug,title:b.title,author:b.author,genre:b.genre,genres:b.genres,rating:b.rating,chapters:b.chapters,wordCount:b.wordCount,status:b.status,tier:b.tier||'free'})))};

// ─── STATE ───
var state = {
  genre: 'all',        // selected genre key (or 'all')
  genreGroup: '',      // selected group key (or '')
  status: 'all',
  words: 'all',
  sort: 'rating',
  page: 1,
  perPage: 20,
  query: ''
};

// ─── DEBOUNCE ───
var debounceTimer;
function debounceFilter() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(function() {
    state.query = document.getElementById('searchInput').value.toLowerCase().trim();
    state.page = 1;
    renderBooks();
  }, 250);
}

// ─── SELECT BROWSE (SIDEBAR) ───
function selectBrowse(el, genre, group) {
  // Update state
  state.genre = genre;
  state.genreGroup = group;
  state.page = 1;

  // Toggle sub-items visibility
  if (el.classList.contains('sb-parent')) {
    var subs = document.getElementById('sbSubs_' + group);
    var arrow = document.getElementById('sbArrow_' + group);
    var isOpen = subs.style.display === 'block';
    // Close all
    document.querySelectorAll('.sb-subs').forEach(function(s) { s.style.display = 'none'; });
    document.querySelectorAll('.sb-arrow').forEach(function(a) { a.textContent = '▸'; });
    if (!isOpen) {
      subs.style.display = 'block';
      arrow.textContent = '▾';
      // Don't change filter when just expanding
      state.genre = '';
      if (state.genreGroup !== group) { state.genreGroup = group; }
      else { state.genreGroup = ''; }
    } else {
      state.genreGroup = '';
    }
  }

  // Update active states
  document.querySelectorAll('.sb-item').forEach(function(i) { i.classList.remove('active'); });
  el.classList.add('active');
  if (el.classList.contains('sb-parent') && el.classList.contains('active')) {
    // Highlight parent when group is selected
  }

  // Sync mobile chips
  document.querySelectorAll('.mb-chip').forEach(function(c) {
    c.classList.toggle('active',
      (c.dataset.genre === state.genre && state.genre !== '') ||
      (c.dataset.genre === 'all' && state.genre === 'all' && state.genreGroup === '')
    );
  });

  renderBooks();
}

// ─── SELECT BROWSE (MOBILE CHIPS) ───
function selectBrowseMobile(genre, group) {
  state.genre = genre;
  state.genreGroup = group;
  state.page = 1;

  document.querySelectorAll('.mb-chip').forEach(function(c) {
    c.classList.toggle('active',
      (c.dataset.genre === state.genre && state.genre !== '') ||
      (c.dataset.genre === 'all' && state.genre === 'all' && state.genreGroup === '')
    );
  });

  // Sync sidebar
  document.querySelectorAll('.sb-item').forEach(function(i) { i.classList.remove('active'); });
  if (genre === 'all') {
    var allBtn = document.querySelector('.sb-item[data-genre="all"]');
    if (allBtn) allBtn.classList.add('active');
  } else {
    var subItem = document.querySelector('.sb-item.sb-sub[data-genre="' + genre + '"]');
    if (subItem) subItem.classList.add('active');
  }

  renderBooks();
}

// ─── TOGGLE SIDEBAR ───
function toggleSidebar() {
  var sb = document.getElementById('browseSidebar');
  var ov = document.getElementById('sbOverlay');
  sb.classList.toggle('open');
  ov.classList.toggle('open');
}

// ─── APPLY FILTERS ───
function applyFilters() {
  state.status = document.getElementById('statusFilter').value;
  state.words = document.getElementById('wordsFilter').value;
  state.sort = document.getElementById('sortSelect').value;
  state.page = 1;
  // Sync quick sort chips
  document.querySelectorAll('.qf-chip').forEach(function(c) {
    c.classList.toggle('active', c.dataset.sort === state.sort);
  });
  renderBooks();
}

// ─── QUICK SORT ───
function quickSort(sortBy, el) {
  state.sort = sortBy;
  state.page = 1;
  document.getElementById('sortSelect').value = sortBy;
  document.querySelectorAll('.qf-chip').forEach(function(c) {
    c.classList.toggle('active', c.dataset.sort === sortBy);
  });
  renderBooks();
}

// ─── FILTER MATCHING ───
function bookMatches(b) {
  // Genre filter
  if (state.genre === 'all' && state.genreGroup === '') {
    // Show all
  } else if (state.genre !== '' && state.genre !== 'all') {
    if (b.genre !== state.genre) return false;
  } else if (state.genreGroup !== '') {
    // Check if book's genre belongs to this group
    var gt = ${JSON.stringify(Object.fromEntries(Object.entries(GENRE_TAXONOMY).map(([k,v])=>[k,v.group])))};
    if (!gt[b.genre] || gt[b.genre] !== state.genreGroup) return false;
  }

  // Status filter
  if (state.status !== 'all' && b.status !== state.status) return false;

  // Word count filter
  if (state.words !== 'all') {
    var w = b.wordCount;
    if (state.words === '0-50' && w >= 50000) return false;
    if (state.words === '50-100' && (w < 50000 || w >= 100000)) return false;
    if (state.words === '100-200' && (w < 100000 || w >= 200000)) return false;
    if (state.words === '200+' && w < 200000) return false;
  }

  // Search
  if (state.query) {
    var t = b.title.toLowerCase();
    var a = b.author.toLowerCase();
    if (t.indexOf(state.query) === -1 && a.indexOf(state.query) === -1) return false;
  }

  return true;
}

// ─── RENDER ───
function renderBooks() {
  var filtered = BOOKS.filter(bookMatches);

  // Sort
  if (state.sort === 'rating') {
    filtered.sort(function(a, b) { return b.rating - a.rating; });
  } else if (state.sort === 'chapters') {
    filtered.sort(function(a, b) { return b.chapters - a.chapters; });
  } else if (state.sort === 'words') {
    filtered.sort(function(a, b) { return b.wordCount - a.wordCount; });
  } else if (state.sort === 'newest') {
    filtered.sort(function(a, b) { return Math.random() - 0.5; });
  }

  // Pagination
  var total = filtered.length;
  var totalPages = Math.ceil(total / state.perPage);
  if (state.page > totalPages) state.page = totalPages || 1;
  var start = (state.page - 1) * state.perPage;
  var pageBooks = filtered.slice(start, start + state.perPage);

  // Show/hide cards
  var grid = document.getElementById('bookGrid');
  var cards = grid.querySelectorAll('.bk');
  var pageSlugs = pageBooks.map(function(b) { return b.slug; });
  cards.forEach(function(c) {
    var slug = c.getAttribute('data-slug');
    if (pageSlugs.indexOf(slug) >= 0) {
      c.classList.remove('hidden');
    } else {
      c.classList.add('hidden');
    }
  });

  // Sort visual order
  pageBooks.forEach(function(b, i) {
    var card = grid.querySelector('.bk[data-slug="' + b.slug + '"]');
    if (card) grid.appendChild(card);
  });

  // No results
  document.getElementById('noResults').style.display = total === 0 ? 'block' : 'none';

  // Update label
  var label = state.genre === 'all' && state.genreGroup === '' ? 'All Novels' : '';
  if (!label && state.genreGroup) {
    var gd = ${JSON.stringify(Object.fromEntries(Object.entries(GENRE_GROUPS).map(([k,v])=>[k,v.name])))};
    label = gd[state.genreGroup] || '';
  }
  if (!label && state.genre) {
    var gn = ${JSON.stringify(Object.fromEntries(Object.entries(GENRE_TAXONOMY).map(([k,v])=>[k,v.name])))};
    label = gn[state.genre] || state.genre;
  }
  if (!label) label = 'All Novels';
  var extras = [];
  if (state.status !== 'all') extras.push(state.status === 'ongoing' ? 'Ongoing' : 'Completed');
  if (state.words !== 'all') extras.push(state.words.replace('-','–') + 'k words');
  if (state.query) extras.push('"' + state.query + '"');
  document.getElementById('filterLabel').textContent = label + (extras.length ? ' · ' + extras.join(' · ') : '') + ' (' + total + ')';

  // Update browse page label
  var bpl = document.getElementById('browsePageLabel');
  if (bpl) bpl.textContent = total + ' novels · Page ' + state.page + ' of ' + totalPages;

  // Pagination
  renderPagination(totalPages);

  // Scroll to grid top
  var browseEl = document.getElementById('browse');
  if (browseEl && state.page > 1) {
    browseEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderPagination(totalPages) {
  var pg = document.getElementById('pagination');
  if (totalPages <= 1) { pg.innerHTML = ''; return; }

  var html = '<div class="pg-inner">';
  html += '<button class="pg-btn" onclick="goPage(' + (state.page - 1) + ')" ' + (state.page <= 1 ? 'disabled' : '') + '>◀ Prev</button>';
  html += '<span class="pg-info">Page ' + state.page + ' of ' + totalPages + '</span>';
  html += '<button class="pg-btn" onclick="goPage(' + (state.page + 1) + ')" ' + (state.page >= totalPages ? 'disabled' : '') + '>Next ▶</button>';
  html += '</div>';

  // Page number buttons
  html += '<div class="pg-nums">';
  var startPage = Math.max(1, state.page - 3);
  var endPage = Math.min(totalPages, state.page + 3);
  if (startPage > 1) html += '<button class="pg-num" onclick="goPage(1)">1</button><span class="pg-ellipsis">…</span>';
  for (var p = startPage; p <= endPage; p++) {
    html += '<button class="pg-num ' + (p === state.page ? 'active' : '') + '" onclick="goPage(' + p + ')">' + p + '</button>';
  }
  if (endPage < totalPages) html += '<span class="pg-ellipsis">…</span><button class="pg-num" onclick="goPage(' + totalPages + ')">' + totalPages + '</button>';
  html += '</div>';

  pg.innerHTML = html;
}

function goPage(n) {
  state.page = n;
  renderBooks();
}

// ─── INIT ───
renderBooks();
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

  // Book detail page — SEO optimized with long-tail keywords
  const genreLabel = GENRE_TAXONOMY[book.genre]?.name || book.genre;
  const ltKeywords = [
    `read ${book.title} online free`,
    `${genreLabel} web novel`,
    `best ${genreLabel} stories`,
    `${book.author} novel`,
    'english web novel chapters'
  ].join(', ');
  const seoTitle = `${book.title} — Read ${book.chapters} Chapters Free | ${genreLabel} Web Novel`;
  const seoDesc = `Read ${book.title} by ${book.author} — a ${genreLabel} web novel with ${book.chapters} chapters, ${(book.wordCount/1000).toFixed(0)}k words. ${book.description.substring(0,120).replace(/"/g,'')}... Read online free on FictionVerse.`;
  const detailHTML = `${BASE_HEAD(seoTitle, seoDesc,
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
        <div class="bk-genre" style="margin-bottom:4px">${gn}${dTierBadge}</div>
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

  // Load real chapter content from _content.json
  const contentPath = `data/chapters/${book.slug}_content.json`;
  let contentMap = {};
  if (fs.existsSync(contentPath)) {
    const contentData = JSON.parse(fs.readFileSync(contentPath, 'utf-8'));
    contentData.forEach(c => { contentMap[c.number] = c.content; });
  }

  // Chapter pages
  for (const ch of chs) {
    const prev = ch.number > 1 ? ch.number - 1 : null;
    const next = ch.number < chs.length ? ch.number + 1 : null;
    const snippet = `Read Chapter ${ch.number}: ${ch.title} of ${book.title} by ${book.author}. ${genreLabel} web novel chapter ${ch.number} online free.`;
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

    // Use real content from _content.json, fallback to placeholder
    const rawContent = contentMap[ch.number];
    const text = rawContent
      ? rawContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
      : `<p style="color:var(--dim);font-style:italic">[Content not yet available for Chapter ${ch.number}: ${ch.title}]</p>
<p>The story continues to unfold as ${book.author} builds the world of ${book.title}, taking readers deeper into this ${book.genre} narrative.</p>`;

    const chapterHTML = `${BASE_HEAD(`Chapter ${ch.number}: ${ch.title} — ${book.title}`,
      snippet, `${site.url}/read/${book.slug}/chapters/${ch.number}`,
      `<script type="application/ld+json">${JSON.stringify(chSchema)}</script>
<script type="application/ld+json">${JSON.stringify(chBC)}</script>`)}
${BASE_HEADER}
<script>document.body.dataset.bookSlug='${book.slug}';document.body.dataset.chapterNum='${ch.number}';document.body.dataset.chapterTitle='${ch.title}';document.body.dataset.totalChapters='${chs.length}';document.body.dataset.bookTier='${book.tier||'free'}';document.body.dataset.freeChapters='${book.freeChapters||0}';document.body.dataset.prevChapter='${prev?`/read/${book.slug}/chapters/${prev}`:''}';document.body.dataset.nextChapter='${next?`/read/${book.slug}/chapters/${next}`:''}';</script>

<!-- Progress Bar -->
<div id="reader-pb" style="position:fixed;top:0;left:0;right:0;height:3px;background:rgba(255,255,255,0.04);z-index:300">
  <div id="fv-progress-bar" style="height:100%;background:var(--gold);width:0%;transition:width 0.3s;border-radius:0 2px 2px 0"></div>
</div>

<!-- Mini Header (hidden, tap to show) -->
<header id="reader-mini-hd" style="position:fixed;top:0;left:0;right:0;z-index:200;background:rgba(10,11,16,0.96);border-bottom:1px solid rgba(255,255,255,0.06);padding:10px 16px;display:flex;align-items:center;justify-content:space-between;backdrop-filter:blur(10px);transform:translateY(-100%);transition:transform 0.25s;opacity:0">
  <a href="/read/${book.slug}/" style="font-size:0.8rem;color:var(--gold);text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,sans-serif">← ${book.title}</a>
  <span style="font-size:0.7rem;color:var(--dim);font-family:-apple-system,BlinkMacSystemFont,sans-serif">Chapter ${ch.number} / ${chs.length}</span>
  <button id="fv-fav-btn" style="padding:4px 8px;border:none;background:transparent;font-size:1rem;cursor:pointer">🤍</button>
</header>

<!-- Toggle Tip -->
<div id="reader-tip" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:100;color:rgba(255,255,255,0.2);font-size:2rem;pointer-events:none;opacity:0;transition:opacity 0.6s">👆</div>

<!-- Reader Content -->
<main style="max-width:800px;margin:0 auto;padding:24px 16px 100px;min-height:100vh;cursor:default" onclick="toggleUI()">
  <div class="cp-hd" style="margin-bottom:24px">
    <h1 style="font-size:1.1rem;font-weight:700;color:#fff;margin-bottom:4px">Chapter ${ch.number}: ${ch.title}</h1>
    <p style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.65rem;color:var(--dim)">~${(ch.wordCount/1000).toFixed(1)}k words · ${ch.updated}</p>
  </div>
  <div id="reader-content" style="font-size:18px;line-height:1.8;color:var(--text);min-height:60vh">${text}</div>
  <nav class="cp-nav" style="margin:32px 0 16px;display:flex;justify-content:space-between;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.82rem;padding:14px 0;border-top:1px solid rgba(255,255,255,0.06);border-bottom:1px solid rgba(255,255,255,0.06)">
    <span>${prev ? `<a href="/read/${book.slug}/chapters/${prev}" style="color:var(--gold);text-decoration:none">← Prev</a>` : '<span style="color:var(--dim)">← Start</span>'}</span>
    <span style="color:var(--dim);font-size:0.7rem">${ch.number}/${chs.length}</span>
    <span>${next ? `<a href="/read/${book.slug}/chapters/${next}" style="color:var(--gold);text-decoration:none">Next →</a>` : '<span style="color:var(--dim)">End →</span>'}</span>
  </nav>
</main>

<!-- Bottom Toolbar -->
<div id="reader-tb" style="position:fixed;bottom:0;left:0;right:0;z-index:200;background:rgba(10,11,16,0.96);border-top:1px solid rgba(255,255,255,0.06);padding:8px 0;padding-bottom:max(8px,env(safe-area-inset-bottom));backdrop-filter:blur(10px);transition:opacity 0.3s,transform 0.3s;opacity:0.9;transform:translateY(0)">
  <div style="max-width:600px;margin:0 auto;padding:0 12px;display:flex;align-items:center;justify-content:space-between">
    <button id="fv-font-down" style="padding:8px 10px;border-radius:6px;border:none;background:transparent;color:var(--dim);cursor:pointer;font-size:0.8rem;font-family:inherit">A−</button>
    <span id="fv-font-val" style="font-size:0.62rem;color:var(--dim);min-width:30px;text-align:center">18</span>
    <button id="fv-font-up" style="padding:8px 10px;border-radius:6px;border:none;background:transparent;color:var(--dim);cursor:pointer;font-size:0.8rem;font-family:inherit">A+</button>
    <div style="width:1px;height:20px;background:rgba(255,255,255,0.06)"></div>
    <button id="fv-theme-btn" style="padding:8px 10px;border-radius:6px;border:none;background:transparent;color:var(--dim);cursor:pointer;font-size:1rem;font-family:inherit">🌙</button>
    <button id="fv-mode-btn" style="padding:8px 10px;border-radius:6px;border:none;background:transparent;color:var(--dim);cursor:pointer;font-size:1rem;font-family:inherit">📃</button>
    <button id="fv-bm-btn" style="padding:8px 10px;border-radius:6px;border:none;background:transparent;color:var(--dim);cursor:pointer;font-size:1rem;font-family:inherit;opacity:0.5">🏷</button>
    <button id="fv-drawer-btn" style="padding:8px 10px;border-radius:6px;border:none;background:transparent;color:var(--dim);cursor:pointer;font-size:1rem;font-family:inherit">☰</button>
  </div>
</div>

<!-- Page Nav -->
<div id="fv-page-nav" style="display:none;max-width:800px;margin:0 auto;padding:0 16px 8px;text-align:center">
  <span style="display:inline-flex;align-items:center;gap:16px">
    <button id="fv-page-prev" style="padding:6px 14px;border-radius:6px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);color:var(--dim);cursor:pointer;font-size:0.75rem;font-family:inherit">◀ Prev</button>
    <span id="fv-page-ofs" style="font-size:0.7rem;color:var(--dim)">1/1</span>
    <button id="fv-page-next" style="padding:6px 14px;border-radius:6px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);color:var(--dim);cursor:pointer;font-size:0.75rem;font-family:inherit">Next ▶</button>
  </span>
</div>

<!-- Chapter Drawer -->
<div id="reader-drawer" style="position:fixed;top:0;right:0;bottom:0;width:300px;max-width:80vw;background:var(--card);z-index:400;transform:translateX(100%);transition:transform 0.25s;box-shadow:-4px 0 24px rgba(0,0,0,0.3);overflow-y:auto">
  <div id="reader-ch-list"></div>
</div>
<div id="reader-ov" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:399"></div>

<style>
#reader-mini-hd.on,#reader-tb.on{transform:translateY(0)!important;opacity:1!important}
#reader-pb.on{top:43px}
#fv-fav-btn.on{filter:none}

/* ═══ Reading Themes ═══ */
.fv-dark{--bg:#0a0b10;--card:#11131f;--text:#d8dae0;--dim:#8b8fa0}
.fv-light{--bg:#fff;--card:#f5f5f5;--text:#222;--dim:#777;background:#fff!important}
.fv-light body,.fv-light main{background:#fff;color:#222}
.fv-light #reader-content{color:#222!important}
.fv-light #reader-tb{background:rgba(255,255,255,0.96);border-color:rgba(0,0,0,0.08)}
.fv-light #reader-tb button{color:#555}
.fv-light #reader-mini-hd{background:rgba(255,255,255,0.96);border-color:rgba(0,0,0,0.06)}
.fv-light #reader-mini-hd a,.fv-light #reader-mini-hd span{color:#555}
.fv-light #reader-pb{background:rgba(0,0,0,0.04)}
.fv-light .cp-nav a{color:var(--accent)!important}
.fv-sepia{--bg:#f4ecd8;--card:#ede4d8;--text:#433422;--dim:#8b7355;background:#f4ecd8!important}
.fv-sepia body,.fv-sepia main{background:#f4ecd8;color:#433422}
.fv-sepia #reader-content{color:#433422!important}
.fv-sepia #reader-tb{background:rgba(244,236,216,0.96);border-color:rgba(139,115,85,0.15)}
.fv-sepia #reader-tb button{color:#8b7355}
.fv-sepia #reader-mini-hd{background:rgba(244,236,216,0.96);border-color:rgba(139,115,85,0.1)}
.fv-sepia #reader-mini-hd a,.fv-sepia #reader-mini-hd span{color:#8b7355}
.fv-sepia #reader-pb{background:rgba(139,115,85,0.08)}
.fv-sepia .cp-nav a{color:#8b7355!important}
</style>
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
  const genrePageSize = 20;
  const genreTotalPages = Math.ceil(sortedGBooks.length / genrePageSize);

  // Sub-genre chips for this genre's books
  const subGenres = {};
  for (const bk of stat.books) {
    for (const sg of (bk.genres || [bk.genre])) {
      if (sg !== g) {
        subGenres[sg] = (subGenres[sg] || 0) + 1;
      }
    }
  }
  const subGenreChips = Object.entries(subGenres).sort((a,b)=>b[1]-a[1]).slice(0,6)
    .map(([sg, cnt]) => `<button class="qf-chip" onclick="filterBySubGenre('${sg}')">${GENRE_TAXONOMY[sg]?.name || sg} (${cnt})</button>`).join('\n');
  const hasSubGenres = subGenreChips.length > 0;

  // Pagination HTML
  const genPagination = () => {
    let pg = '';
    if (genreTotalPages <= 1) return pg;
    pg += `<div class="pagination" id="genrePagination"><div class="pg-inner">`;
    pg += `<button class="pg-btn" id="pgPrev" onclick="goPage(-1)" disabled>← Previous</button>`;
    pg += `<span class="pg-info" id="pgInfo">Page 1 of ${genreTotalPages}</span>`;
    pg += `<button class="pg-btn" id="pgNext" onclick="goPage(1)" ${genreTotalPages <= 1 ? 'disabled' : ''}>Next →</button>`;
    pg += `</div><div class="pg-nums" id="pgNums">`;
    for (let p = 1; p <= genreTotalPages; p++) {
      pg += `<button class="pg-num${p===1?' active':''}" onclick="goToPage(${p})">${p}</button>`;
    }
    pg += `</div></div>`;
    return pg;
  };

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
<section class="hero-new" style="min-height:auto;padding:40px 0"><div class="hero-grid" style="grid-template-columns:1fr;text-align:center"><div class="hero-text" style="max-width:100%"><h1>${stat.name}</h1><p class="hero-sub" style="max-width:100%;text-align:center">${stat.desc} · ${stat.books.length} novel${stat.books.length!==1?'s':''}</p></div></div></section>
<main class="ct" data-genre="${g}">
  <nav aria-label="Breadcrumb" style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.72rem;color:var(--dim);padding:16px 0">/ <a href="/">Library</a> / <span>${stat.name}</span></nav>
  <div class="tb">
    <span class="tb-count" id="genreCount">${sortedGBooks.length} novel${sortedGBooks.length!==1?'s':''}</span>
    <select class="tb-sort" id="genreSort" onchange="sortGenre()">
      <option value="rating">⭐ Top Rated</option>
      <option value="chapters">📖 Most Chapters</option>
      <option value="recent">🔥 Recently Updated</option>
      <option value="words">📚 Longest</option>
    </select>
  </div>
  ${hasSubGenres ? `<div class="browse-filters" style="margin-bottom:16px;display:flex;flex-wrap:wrap;gap:8px"><button class="qf-chip active" onclick="filterBySubGenre('all')">All (${stat.books.length})</button>${subGenreChips}</div>` : ''}
  <div class="grid" id="genreGrid">${gCards}</div>
  ${genPagination()}
</main>
<script>
(function(){
  var allCards = Array.from(document.querySelectorAll('#genreGrid .bk'));
  var pageSize = ${genrePageSize};
  var currentPage = 1;
  var activeSubGenre = 'all';
  var sortBy = 'rating';
  function applyFilters(){
    var filtered = allCards.filter(function(card){
      if(activeSubGenre==='all') return true;
      var genres = card.dataset.genre || '';
      return genres.indexOf(activeSubGenre)>=0;
    });
    // Sort
    filtered.sort(function(a,b){
      if(sortBy==='rating') return parseFloat(b.querySelector('.bk-rating')?.textContent||0) - parseFloat(a.querySelector('.bk-rating')?.textContent||0);
      if(sortBy==='chapters'){var ca=parseInt((a.querySelector('.bk-meta span:last-child')?.textContent||'').match(/(\\d+)\\s*ch/)?.[1]||0);var cb=parseInt((b.querySelector('.bk-meta span:last-child')?.textContent||'').match(/(\\d+)\\s*ch/)?.[1]||0);return cb-ca;}
      if(sortBy==='words') return (parseInt(b.dataset.words)||0) - (parseInt(a.dataset.words)||0);
      if(sortBy==='recent') return 0; // static pages, preserve order
      return 0;
    });
    var totalPages = Math.ceil(filtered.length/pageSize);
    var start = (currentPage-1)*pageSize;
    var end = start+pageSize;
    allCards.forEach(function(c){c.style.display='none';});
    filtered.slice(start,end).forEach(function(c){c.style.display='';});
    var grid = document.getElementById('genreGrid');
    // Reorder DOM
    var visible = filtered.slice(start,end).map(function(c){return c;});
    var rest = filtered.slice(end).concat(filtered.slice(0,start)).concat(allCards.filter(function(c){return filtered.indexOf(c)<0;}));
    visible.forEach(function(c){grid.appendChild(c);});
    // Update count
    var countEl = document.getElementById('genreCount');
    if(countEl) countEl.textContent = filtered.length+' of ${sortedGBooks.length} novels';
    // Update pagination
    document.getElementById('pgInfo').textContent = 'Page '+currentPage+' of '+totalPages;
    document.getElementById('pgPrev').disabled = currentPage<=1;
    document.getElementById('pgNext').disabled = currentPage>=totalPages;
    var nums = document.querySelectorAll('#pgNums .pg-num');
    nums.forEach(function(n,i){n.classList.toggle('active',i+1===currentPage);});
    // Show/hide pagination
    var pgDiv = document.getElementById('genrePagination');
    if(pgDiv) pgDiv.style.display = totalPages<=1?'none':'';
  }
  window.goPage = function(dir){currentPage+=dir;applyFilters();window.scrollTo({top:0,behavior:'smooth'});};
  window.goToPage = function(p){currentPage=p;applyFilters();window.scrollTo({top:0,behavior:'smooth'});};
  window.filterBySubGenre = function(sg){
    activeSubGenre=sg;
    currentPage=1;
    document.querySelectorAll('.qf-chip').forEach(function(c){c.classList.toggle('active',c.textContent.trim().startsWith(sg==='all'?'All':sg));});
    applyFilters();
  };
  window.sortGenre = function(){
    sortBy = document.getElementById('genreSort').value;
    currentPage = 1;
    applyFilters();
  };
  applyFilters();
})();
</script>
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
<section class="hero-new" style="min-height:auto;padding:40px 0"><div class="hero-grid" style="grid-template-columns:1fr;text-align:center"><div class="hero-text" style="max-width:100%"><h1>🆓 Free Novels</h1><p class="hero-sub" style="max-width:100%;text-align:center">${freeBooks.length} novel${freeBooks.length!==1?'s':''} — Read all chapters free, no payment ever.</p></div></div></section>
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
<section class="hero-new" style="min-height:auto;padding:40px 0"><div class="hero-grid" style="grid-template-columns:1fr;text-align:center"><div class="hero-text" style="max-width:100%"><h1>🔒 Paid Novels</h1><p class="hero-sub" style="max-width:100%;text-align:center">${paidBooks.length} premium novel${paidBooks.length!==1?'s':''} — First chapters free · One-time unlock · No subscription</p></div></div></section>
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
  <nav style="margin-top:32px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.05);font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.82rem"><a href="/" style="color:var(--gold)">← Back to Library</a></nav>
</main>${BASE_FOOTER}`;
  const filePath = `${slug}.html`;
  fs.writeFileSync(filePath, h);
  console.log(`✓ ${filePath}`);
};

const aboutContent = `<h2 style="font-size:1.05rem;font-weight:700;color:#fff;margin:24px 0 8px">Our Mission</h2>
<p style="font-size:0.85rem;color:var(--dim);margin-bottom:16px">${site.name} is an independent publisher of original English web novels. We believe every storyteller deserves a stage, and every reader deserves a new world to explore. Web novels have exploded across Asia, but English-language independent fiction still lacks a dedicated home — FictionVerse fills that gap.</p>
<h2 style="font-size:1.05rem;font-weight:700;color:#fff;margin:24px 0 8px">What We Stand For</h2>
<p style="font-size:0.85rem;color:var(--dim);margin-bottom:8px"><strong>🎭 Original Stories Only</strong> — No AI-generated filler. No plagiarism. Every novel on FictionVerse is written by a real human author.</p>
<p style="font-size:0.85rem;color:var(--dim);margin-bottom:8px"><strong>🔓 Free to Read</strong> — Every novel starts with free chapters. Readers decide what's worth supporting — not paywalls. No subscriptions, ever.</p>
<p style="font-size:0.85rem;color:var(--dim);margin-bottom:8px"><strong>⚖️ Fair to Authors</strong> — Authors keep 85% of their earnings. We take a small platform fee to keep the lights on.</p>
<p style="font-size:0.85rem;color:var(--dim);margin-bottom:8px"><strong>🛡️ Quality Review</strong> — Every chapter goes through automated content review before publication. No spam, no scams.</p>
<p style="font-size:0.85rem;color:var(--dim);margin-bottom:8px"><strong>💬 Reader Community</strong> — Discuss chapters, share theories, post reviews. Fiction is better when shared.</p>
<h2 style="font-size:1.05rem;font-weight:700;color:#fff;margin:24px 0 8px">How It Works</h2>
<p style="font-size:0.85rem;color:var(--dim);margin-bottom:12px"><strong>For Readers:</strong> Browse our library of ${books.length}+ original novels. Start reading any book's free chapters instantly — no account needed. Create a bookshelf to track your progress and join discussions in the community forum.</p>
<p style="font-size:0.85rem;color:var(--dim);margin-bottom:16px"><strong>For Authors:</strong> Register, verify your email, and start publishing. Upload chapters through your dashboard. Each submission goes through automated quality review. Pass, and your chapter goes live. Get flagged, and you'll receive feedback for revision. Earn 85% of reader payments.</p>
<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:24px">
  <a href="/" style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.82rem;font-weight:600;padding:10px 24px;border-radius:100px;background:var(--gold);color:#0a0b10;display:inline-block">Browse Library</a>
  <a href="/author" style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.78rem;padding:10px 24px;border:1px solid rgba(255,255,255,0.15);border-radius:100px;color:var(--dim);display:inline-block">Become an Author</a>
</div>`;

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

// ─── Bookshelf 页面 (hand-crafted standalone HTML, skip staticPage) ───
// staticPage('bookshelf', ...) — replaced by standalone bookshelf.html

// ─── Community 页面 (hand-crafted standalone HTML, skip staticPage) ───
// staticPage('community', ...) — replaced by standalone community.html

// ─── Unpublished 页面 (hand-crafted standalone HTML, skip staticPage) ───
// staticPage('unpublished', ...) — replaced by standalone unpublished.html

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
let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
sitemap += `  <url><loc>${site.url}/</loc><lastmod>${now}</lastmod><priority>1.0</priority></url>\n`;
sitemap += `  <url><loc>${site.url}/about</loc><lastmod>${now}</lastmod><priority>0.5</priority></url>\n`;
sitemap += `  <url><loc>${site.url}/free/</loc><lastmod>${now}</lastmod><priority>0.7</priority></url>\n`;
sitemap += `  <url><loc>${site.url}/paid/</loc><lastmod>${now}</lastmod><priority>0.7</priority></url>\n`;
sitemap += `  <url><loc>${site.url}/bookshelf</loc><lastmod>${now}</lastmod><priority>0.5</priority></url>\n`;
sitemap += `  <url><loc>${site.url}/community</loc><lastmod>${now}</lastmod><priority>0.5</priority></url>\n`;
sitemap += `  <url><loc>${site.url}/unpublished</loc><lastmod>${now}</lastmod><priority>0.4</priority></url>\n`;
sitemap += `  <url><loc>${site.url}/terms</loc><lastmod>${now}</lastmod><priority>0.3</priority></url>\n`;
sitemap += `  <url><loc>${site.url}/privacy</loc><lastmod>${now}</lastmod><priority>0.3</priority></url>\n`;
sitemap += `  <url><loc>${site.url}/discover/</loc><lastmod>${now}</lastmod><priority>0.8</priority>\n`;
sitemap += `    <image:image><image:loc>${site.url}/images/covers/dao-celestial-blade.png</image:loc></image:image></url>\n`;
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
Disallow: /unlock/
Disallow: /api/
Disallow: /author
Sitemap: ${site.url}/sitemap.xml

User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: DotBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: GPTBot
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Bingbot
Allow: /
Crawl-delay: 0

User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: *
Crawl-delay: 5
`;
fs.writeFileSync('robots.txt', robots);
console.log('✓ robots.txt');

// ─── 9. _redirects ───
fs.writeFileSync('_redirects', '/404 /404.html 404\n');
console.log('✓ _redirects');

// ─── 统计 ───
const totalPages = 1 + books.length + books.reduce((s, b) => s + (b._chapters || []).length, 0) + 3 + 1;
console.log(`\n📊 Built ${totalPages} pages · ${books.length} books · ${totalChapters} chapters · ${(totalWords/1000).toFixed(0)}k words`);
