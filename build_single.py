#!/usr/bin/env python3
"""Build fiction.aichatmail.one as single-file HTML directory"""
import json, os

BASE = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(BASE, 'data', 'books.json'), 'r', encoding='utf-8') as f:
    books = json.load(f)

free_books = [b for b in books if b.get('tier') == 'free']
premium_books = [b for b in books if b.get('tier') == 'premium']
genres = sorted(set(g for b in books for g in b.get('genres', [])))
total_words = sum(b.get('wordCount', 0) for b in books)
total_chapters = sum(b.get('chapters', 0) for b in books)

def esc(s):
    if not s: return ''
    return str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')

genre_icons = {
    'Xianxia': '⚔️', 'Cultivation': '🧘', 'Wuxia': '🥋', 'Fantasy': '🐉',
    'Romance': '💕', 'Urban': '🏙️', 'Sci-Fi': '🚀', 'Horror': '👻',
    'Mystery': '🔍', 'Thriller': '⚡', 'Adventure': '🗺️', 'Historical': '📜',
    'Comedy': '😂', 'Drama': '🎭', 'Action': '💥'
}

# Build genre-specific book lists
genre_map = {}
for b in books:
    for g in b.get('genres', []):
        genre_map.setdefault(g, []).append(b)

html = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FictionVerse — ''' + str(len(books)) + ''' Original English Web Novels | Free & Premium Chapters</title>
<meta name="description" content="Read ''' + str(len(books)) + ''' original English web novels — Xianxia, Cultivation, Fantasy, Romance, Sci-Fi. ''' + str(f'{total_words/1000:.0f}') + '''K+ words, ''' + str(total_chapters) + ''' chapters. Free and premium stories updated regularly.">
<meta name="keywords" content="web novels, English novels, xianxia, cultivation, fantasy, free novels, FictionVerse, ''' + ', '.join(genres[:8]) + '''">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
<link rel="canonical" href="https://fiction.aichatmail.one/">
<meta property="og:title" content="FictionVerse — ''' + str(len(books)) + ''' Original English Web Novels">
<meta property="og:description" content="Read ''' + str(total_chapters) + ''' chapters across ''' + str(len(books)) + ''' novels. Xianxia, Cultivation, Fantasy, Romance, and more.">
<meta property="og:url" content="https://fiction.aichatmail.one/">
<meta property="og:type" content="website">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "FictionVerse",
  "url": "https://fiction.aichatmail.one/",
  "description": "''' + str(len(books)) + ''' original English web novels — Xianxia, Cultivation, Fantasy, Sci-Fi. ''' + str(total_chapters) + ''' chapters. Read free and premium stories online.",
  "about": {
    "@type": "Book",
    "name": "FictionVerse Library",
    "description": "Collection of original English web novels across multiple genres"
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": {"@type": "EntryPoint", "urlTemplate": "https://fiction.aichatmail.one/?q={search_term_string}"},
    "query-input": "required name=search_term_string"
  }
}
</script>
'''

html += '''
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--ink:#0f0f0f;--gold:#d4a853;--gold-light:#faf3e6;--cream:#faf8f5;--warm-200:#e3d9cb;--white:#fff}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Georgia,serif;color:var(--ink);background:var(--cream);line-height:1.7}
.container{max-width:1280px;margin:0 auto;padding:0 24px}
.nav{position:sticky;top:0;z-index:100;background:rgba(255,255,255,.95);backdrop-filter:blur(12px);border-bottom:1px solid var(--warm-200);padding:16px 0}
.nav-inner{max-width:1280px;margin:0 auto;padding:0 24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
.nav-logo{font-size:22px;font-weight:800;text-decoration:none;color:var(--ink);letter-spacing:-.5px}
.nav-links{display:flex;gap:20px;list-style:none;flex-wrap:wrap}
.nav-links a{text-decoration:none;color:#666;font-size:13px;transition:color .2s}
.nav-links a:hover{color:var(--ink)}
.hero{padding:72px 24px 56px;text-align:center;background:linear-gradient(180deg,#faf3e6 0%,var(--cream) 100%)}
.hero-badge{display:inline-block;background:var(--ink);color:#fff;font-size:12px;font-weight:600;letter-spacing:1px;padding:6px 18px;border-radius:100px;margin-bottom:20px;text-transform:uppercase}
.hero h1{font-size:36px;font-weight:800;max-width:700px;margin:0 auto 16px;line-height:1.25;letter-spacing:-.5px}
.hero p{font-size:16px;color:#555;max-width:550px;margin:0 auto;line-height:1.7}
.hero-stats{display:flex;justify-content:center;gap:40px;margin-top:32px;flex-wrap:wrap}
.hero-stat{text-align:center}
.hero-stat-num{font-size:28px;font-weight:800;color:var(--ink)}
.hero-stat-label{font-size:12px;color:#888;margin-top:4px;text-transform:uppercase;letter-spacing:.5px}
.section{padding:56px 0}
.section-title{font-size:22px;font-weight:700;margin-bottom:24px;padding-bottom:12px;border-bottom:2px solid #e8e0d5}
.book-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:24px}
.book-card{background:var(--white);border:1px solid var(--warm-200);border-radius:12px;padding:24px;transition:all .15s}
.book-card:hover{border-color:var(--gold);transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,.06)}
.book-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px}
.book-title{font-size:16px;font-weight:700;color:var(--ink);line-height:1.3}
.book-meta{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:10px;font-size:12px;color:#888}
.book-meta span{display:flex;align-items:center;gap:4px}
.book-desc{font-size:13px;color:#555;line-height:1.7;margin-bottom:14px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.book-footer{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
.book-genres{display:flex;gap:6px;flex-wrap:wrap}
.book-genre{font-size:11px;padding:2px 10px;border-radius:100px;background:var(--gold-light);color:#8b6914}
.book-tier{font-size:11px;font-weight:700;padding:3px 12px;border-radius:100px}
.tier-free{background:#e8f5e9;color:#2e7d32}
.tier-premium{background:#fff3e0;color:#e65100}
.book-author{font-size:12px;color:#888}
.footer{background:var(--ink);color:rgba(255,255,255,.7);padding:48px 24px;margin-top:48px}
.footer-inner{max-width:1280px;margin:0 auto;text-align:center}
.footer p{font-size:13px;line-height:1.8}
.footer a{color:rgba(255,255,255,.9)}
.footer-divider{border:0;border-top:1px solid rgba(255,255,255,.15);margin:20px 0}
@media(max-width:768px){
  .hero h1{font-size:26px}
  .hero-stats{gap:24px}
  .hero-stat-num{font-size:24px}
  .book-grid{grid-template-columns:1fr}
}
</style>
</head>
<body>
<nav class="nav"><div class="nav-inner">
<a class="nav-logo" href="/">FictionVerse</a>
<ul class="nav-links">
'''
for g in genres:
    icon = genre_icons.get(g, '📖')
    html += f'<a href="#genre-{g.lower().replace(" ","-")}">{icon} {g}</a>\n'

html += '''</ul></div></nav>

<header class="hero">
<div class="hero-badge">Original English Web Novels</div>
<h1>''' + str(len(books)) + ''' Original Web Novels — ''' + str(f'{total_words/1000:.0f}') + '''K+ Words of Stories</h1>
<p>From immortal cultivation epics to urban thrillers — discover your next addiction. ''' + str(len(free_books)) + ''' free novels, ''' + str(len(premium_books)) + ''' premium. New chapters weekly.</p>
<div class="hero-stats">
<div class="hero-stat"><div class="hero-stat-num">''' + str(len(books)) + '''</div><div class="hero-stat-label">Novels</div></div>
<div class="hero-stat"><div class="hero-stat-num">''' + str(total_chapters) + '''</div><div class="hero-stat-label">Chapters</div></div>
<div class="hero-stat"><div class="hero-stat-num">''' + str(f'{total_words/1000:.0f}') + '''K</div><div class="hero-stat-label">Words</div></div>
<div class="hero-stat"><div class="hero-stat-num">''' + str(len(genres)) + '''</div><div class="hero-stat-label">Genres</div></div>
</div></header>

<main class="container">
<section class="section">
<h2 class="section-title">📚 All Novels (''' + str(len(books)) + ''')</h2>
<div class="book-grid">
'''

# Sort by rating descending
sorted_books = sorted(books, key=lambda b: b.get('rating', 0), reverse=True)
for b in sorted_books:
    tier = b.get('tier', 'free')
    genre_tags = ''.join([f'<span class="book-genre">{g}</span>' for g in b.get('genres', [])])
    tier_html = f'<span class="book-tier tier-{tier}">{tier.upper()}</span>'
    rating = b.get('rating', 0)
    chapters = b.get('chapters', 0)
    word_count = b.get('wordCount', 0)
    status = b.get('status', 'ongoing').capitalize()
    
    html += f'''<div class="book-card">
<div class="book-header">
<div class="book-title">{esc(b.get('title', ''))}</div>
{tier_html}
</div>
<div class="book-meta">
<span>⭐ {rating}</span>
<span>📖 {chapters} ch</span>
<span>📝 {word_count//1000}K words</span>
<span>{'🔄' if status == 'Ongoing' else '✅'} {status}</span>
</div>
<div class="book-desc">{esc(b.get('description', '')[:250])}</div>
<div class="book-footer">
<div class="book-genres">{genre_tags}</div>
<div class="book-author">by {esc(b.get('author', 'Unknown'))}</div>
</div>
</div>
'''

html += '</div></section>\n'

# Genre sections
for genre in genres:
    gbooks = genre_map.get(genre, [])
    if len(gbooks) < 2:
        continue
    icon = genre_icons.get(genre, '📖')
    html += f'''<section class="section" id="genre-{genre.lower().replace(' ','-')}">
<h2 class="section-title">{icon} {genre} ({len(gbooks)})</h2>
<div class="book-grid">
'''
    for b in sorted(gbooks, key=lambda b: b.get('rating', 0), reverse=True):
        tier = b.get('tier', 'free')
        genre_tags = ''.join([f'<span class="book-genre">{g}</span>' for g in b.get('genres', [])])
        tier_html = f'<span class="book-tier tier-{tier}">{tier.upper()}</span>'
        
        html += f'''<div class="book-card">
<div class="book-header"><div class="book-title">{esc(b.get('title',''))}</div>{tier_html}</div>
<div class="book-meta"><span>⭐ {b.get('rating',0)}</span><span>📖 {b.get('chapters',0)} ch</span></div>
<div class="book-desc">{esc(b.get('description','')[:200])}</div>
<div class="book-footer"><div class="book-genres">{genre_tags}</div></div>
</div>
'''
    html += '</div></section>\n'

html += '''
</main>

<footer class="footer"><div class="footer-inner">
<p><strong>FictionVerse</strong> — Original English web novels. Read, discover, escape.</p>
<hr class="footer-divider">
<p>All novels are original works. Free chapters available for all titles.</p>
<p>© 2026 · <a href="https://fiction.aichatmail.one/">fiction.aichatmail.one</a></p>
</div></footer>
</body></html>'''

out_path = os.path.join(BASE, 'index_single.html')
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(html)

size_kb = os.path.getsize(out_path) / 1024
print(f"Generated: {out_path}")
print(f"Size: {size_kb:.1f} KB")
print(f"Books: {len(books)} | Free: {len(free_books)} | Premium: {len(premium_books)}")
print(f"Genres: {len(genres)} | Total words: {total_words:,} | Total chapters: {total_chapters}")
