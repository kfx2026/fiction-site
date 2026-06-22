/**
 * FictionVerse Client App
 * =======================
 * Zone tabs · localStorage unlock · reading progress · My Library
 */

(function() {
'use strict';

const LS_UNLOCK = 'fv_unlocked';
const LS_PROGRESS = 'fv_progress';

// ═══════════════════════════════════════
// 1. LOCALSTORAGE HELPERS
// ═══════════════════════════════════════

function getUnlocked() {
  try { return JSON.parse(localStorage.getItem(LS_UNLOCK) || '{}'); }
  catch { return {}; }
}

function setUnlocked(slug, orderId) {
  var u = getUnlocked();
  u[slug] = { orderId: orderId || '', unlockedAt: new Date().toISOString() };
  localStorage.setItem(LS_UNLOCK, JSON.stringify(u));
  try { document.cookie = 'fv_'+slug+'=1; max-age=31536000; path=/; SameSite=Lax'; }
  catch {}
}

function isUnlocked(slug) {
  var u = getUnlocked();
  if (u[slug]) return true;
  // fallback: check cookie
  try {
    var c = document.cookie.split(';').map(function(x){return x.trim()});
    return c.indexOf('fv_'+slug+'=1') >= 0;
  } catch { return false; }
}

function getProgress() {
  try { return JSON.parse(localStorage.getItem(LS_PROGRESS) || '{}'); }
  catch { return {}; }
}

function setProgress(slug, chapter, title) {
  var p = getProgress();
  p[slug] = { chapter: chapter, title: title || '', updatedAt: new Date().toISOString() };
  localStorage.setItem(LS_PROGRESS, JSON.stringify(p));
}

// ═══════════════════════════════════════
// 2. ZONE TABS (homepage)
// ═══════════════════════════════════════

function initZoneTabs() {
  var tabs = document.querySelectorAll('.zt');
  if (!tabs.length) return;

  // Restore last active tab
  var lastTab = sessionStorage.getItem('fv_last_tab') || 'all';
  var activeBtn = document.querySelector('.zt[data-zone="'+lastTab+'"]');
  if (activeBtn) switchZone(lastTab, activeBtn);

  tabs.forEach(function(t) {
    t.addEventListener('click', function() {
      switchZone(this.dataset.zone, this);
    });
  });
}

function switchZone(zone, btn) {
  var grid = document.getElementById('bookGrid');
  var noRes = document.getElementById('noResults');
  var myLib = document.getElementById('myLibrary');
  var cards = grid ? [...grid.querySelectorAll('.bk')] : [];

  // Update tab styles
  document.querySelectorAll('.zt').forEach(function(t) { t.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  sessionStorage.setItem('fv_last_tab', zone);

  // Hide My Library, show grid
  if (myLib) myLib.style.display = 'none';
  if (grid) grid.style.display = 'grid';

  if (zone === 'library') {
    // Show My Library section
    showMyLibrary();
    return;
  }

  var vis = 0;
  cards.forEach(function(c) {
    var tier = c.dataset.tier || 'free';
    var show = zone === 'all' || tier === zone;
    c.classList.toggle('hidden', !show);
    if (show) vis++;
  });

  if (noRes) noRes.style.display = vis === 0 ? 'block' : 'none';
  updateCount(vis);
}

function showMyLibrary() {
  var grid = document.getElementById('bookGrid');
  var myLib = document.getElementById('myLibrary');
  var libGrid = document.getElementById('libGrid');
  var libEmpty = document.getElementById('libEmpty');

  if (grid) grid.style.display = 'none';
  if (!myLib) return;
  myLib.style.display = 'block';

  var unlocked = getUnlocked();
  var progress = getProgress();
  var unlockedSlugs = Object.keys(unlocked);

  if (unlockedSlugs.length === 0) {
    if (libGrid) libGrid.innerHTML = '';
    if (libEmpty) libEmpty.style.display = 'block';
    return;
  }

  if (libEmpty) libEmpty.style.display = 'none';

  // Build library cards
  var allCards = document.querySelectorAll('#bookGrid .bk');
  var html = '';
  unlockedSlugs.forEach(function(slug) {
    var card = null;
    allCards.forEach(function(c) {
      if (c.dataset.title && c.querySelector('a')) {
        var href = c.querySelector('a').getAttribute('href') || '';
        if (href.indexOf('/read/'+slug+'/') >= 0) card = c;
      }
    });
    if (!card) return;

    var prog = progress[slug];
    var cv = card.querySelector('.bk-cv');
    var img = cv ? cv.outerHTML : '';
    var genreEl = card.querySelector('.bk-genre');
    var genre = genreEl ? genreEl.outerHTML.replace('$${','').replace('4.99}','') : '';
    var titleEl = card.querySelector('.bk-title a');
    var title = titleEl ? titleEl.outerHTML : '';
    var authorEl = card.querySelector('.bk-author');
    var author = authorEl ? authorEl.textContent : '';
    var ratingEl = card.querySelector('.bk-rating');
    var rating = ratingEl ? ratingEl.outerHTML : '';

    var progHtml = prog ? '<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.62rem;color:var(--green);margin-top:4px">📖 Continue: Chapter '+prog.chapter+'</div>' : '';

    html += '<article class="bk" style="position:relative">'+
      img +
      '<div class="bk-bd">'+
        genre +
        '<h2 class="bk-title">'+title+'</h2>'+
        '<div class="bk-author">'+author+'</div>'+
        '<div class="bk-meta">'+rating+'</div>'+
        progHtml +
      '</div>'+
    '</article>';
  });

  if (libGrid) libGrid.innerHTML = html;
}

// ═══════════════════════════════════════
// 3. READING PROGRESS (chapter pages)
// ═══════════════════════════════════════

function initReadingProgress() {
  // Detect if we're on a chapter page
  var slug = document.body.dataset.bookSlug;
  var chapter = parseInt(document.body.dataset.chapterNum || '0');
  var title = document.body.dataset.chapterTitle || '';

  if (!slug || !chapter) return;

  setProgress(slug, chapter, title);
}

// ═══════════════════════════════════════
// 4. UNLOCK PAGE (/unlock/{slug}/)
// ═══════════════════════════════════════

function initUnlockPage() {
  var slug = document.body.dataset.unlockSlug;
  if (!slug) return;

  var params = new URLSearchParams(window.location.search);
  var orderId = params.get('order_id') || params.get('checkout_id') || '';

  if (orderId) {
    setUnlocked(slug, orderId);
  }

  // Countdown then redirect to book
  var count = 3;
  var el = document.getElementById('unlockCountdown');
  if (el) {
    var iv = setInterval(function() {
      count--;
      if (count <= 0) { clearInterval(iv); window.location.href = '/read/'+slug+'/'; return; }
      el.textContent = count;
    }, 1000);
  }

  // Manual button
  var btn = document.getElementById('unlockGo');
  if (btn) {
    btn.addEventListener('click', function() {
      window.location.href = '/read/'+slug+'/';
    });
  }
}

// ═══════════════════════════════════════
// 5. PAYWALL CHECK (book detail page)
// ═══════════════════════════════════════

function initPaywallCheck() {
  var slug = document.body.dataset.bookSlug;
  var tier = document.body.dataset.bookTier;
  if (!slug || tier !== 'paid') return;

  var freeCh = parseInt(document.body.dataset.freeChapters || '0');
  if (!freeCh) return;

  var unlocked = isUnlocked(slug);
  var chItems = document.querySelectorAll('.ch-item');

  chItems.forEach(function(item) {
    var numEl = item.querySelector('.ch-num');
    if (!numEl) return;
    var num = parseInt(numEl.textContent);
    if (!num) return;

    if (num > freeCh && !unlocked) {
      // Lock this chapter
      var titleEl = item.querySelector('.ch-title a');
      if (titleEl) {
        titleEl.style.color = 'var(--dim)';
        titleEl.style.opacity = '0.4';
        titleEl.style.pointerEvents = 'none';
      }
      var lockBadge = document.createElement('span');
      lockBadge.style.cssText = 'font-size:0.6rem;color:var(--gold);margin-left:6px;font-family:-apple-system,BlinkMacSystemFont,sans-serif';
      lockBadge.textContent = '🔒';
      item.appendChild(lockBadge);
    }
  });

  // Add unlock banner if not yet unlocked
  if (!unlocked) {
    var chSec = document.querySelector('.ch-sec');
    if (!chSec) return;

    var priceEl = document.body.dataset.bookPrice || '4.99';
    var banner = document.createElement('div');
    banner.style.cssText = 'background:rgba(232,192,64,0.08);border:1px solid rgba(232,192,64,0.2);border-radius:10px;padding:16px 20px;margin:20px 0;text-align:center';
    banner.innerHTML =
      '<p style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.85rem;color:var(--gold);margin-bottom:8px">🔒 Unlock all '+document.querySelectorAll('.ch-item').length+' chapters</p>'+
      '<p style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.72rem;color:var(--dim);margin-bottom:12px">One-time payment. No subscription. Read forever on this device.</p>'+
      '<a class="gf-chip active" style="display:inline-block;text-decoration:none;padding:8px 24px;font-size:0.82rem" href="https://www.creem.io/payment/prod_5xzHM5PbLT31XXRxAcaGID?redirect='+encodeURIComponent(window.location.origin+'/unlock/'+slug+'/?order_id={order_id}')+'">Unlock — $'+priceEl+'</a>'+
      '<p style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:0.58rem;color:var(--dim);margin-top:8px">Already purchased? Your unlock persists automatically on this device.</p>';
    chSec.parentNode.insertBefore(banner, chSec);
  }
}

// ═══════════════════════════════════════
// 6. UPDATE COUNT (helpers)
// ═══════════════════════════════════════

function updateCount(visibleCount) {
  var cntEl = document.getElementById('tbCount');
  if (!cntEl) return;
  var totalBooks = (window._FV_BOOK_COUNT) || 0;
  cntEl.textContent = visibleCount + ' of ' + totalBooks + ' novels';
}

// ═══════════════════════════════════════
// 7. INIT
// ═══════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {
  initZoneTabs();
  initReadingProgress();
  initUnlockPage();
  initPaywallCheck();
});

})();
