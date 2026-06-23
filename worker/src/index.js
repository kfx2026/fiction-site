/**
 * FictionVerse Cloudflare Worker API
 * ====================================
 * Backend for author dashboard: book/chapter CRUD, scheduled publish, deploy trigger
 * Public endpoints: books.json + chapters/{slug}.json for static site build
 */

// ═══════════════ AUTH ═══════════════
// In production, set ADMIN_PASSWORD_HASH via wrangler secret or env var.
// First run: POST /api/setup with password to create admin.
// The hash is a simple SHA-256. For MVP, we use a fixed token.

const AUTH_TOKEN = 'fv_admin_2026'; // Master token for admin

// Temp email domains (blocked)
const DISPOSABLE_DOMAINS = [
  'mailinator.com','guerrillamail.com','10minutemail.com','tempmail.com','temp-mail.org',
  'yopmail.com','sharklasers.com','trashmail.com','throwaway.email','maildrop.cc',
  'getnada.com','dispostable.com','mailnesia.com','spamgourmet.com','fakeinbox.com',
  'tempinbox.com','mintemail.com','tmpmail.org','moakt.com','emailondeck.com',
  'aichatmail.one','qr2mail.top'
];

function isDisposable(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  return DISPOSABLE_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));
}

function validatePassword(pw) {
  if (pw.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(pw)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(pw)) return 'Password must contain at least one number';
  return null;
}

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken() {
  return 'fv_' + Array.from({length: 32}, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

function hashPassword(pw) {
  // Simple hash for MVP - in production use Web Crypto API
  let hash = 0;
  for (let i = 0; i < pw.length; i++) {
    const chr = pw.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return 'sha_' + Math.abs(hash).toString(16) + '_' + pw.length;
}

async function sendEmail(to, subject, body) {
  try {
    await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: 'noreply@fiction.aichatmail.one', name: 'FictionVerse' },
        subject: subject,
        content: [{ type: 'text/plain', value: body }]
      })
    });
    return true;
  } catch (e) {
    console.error('Email send failed:', e.message);
    return false;
  }
}

function auth(request) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  return token === AUTH_TOKEN;
}

async function authorAuth(env, request) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return null;
  const author = await env.DB.prepare(
    'SELECT * FROM authors WHERE auth_token = ? AND token_expires > datetime(\'now\') AND verified = 1'
  ).bind(token).first();
  return author;
}

async function authorApiAuth(env, request) {
  const authHeader = request.headers.get('Authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1].trim();
  // Check api_tokens table
  const row = await env.DB.prepare('SELECT * FROM api_tokens WHERE token = ?').bind(token).first();
  if (!row) return null;
  // Update last_used
  await env.DB.prepare('UPDATE api_tokens SET last_used = datetime(\'now\') WHERE token = ?').bind(token).run();
  return { email: row.author_email, name: 'API', scope: row.scope || 'full' };
}

function requireAuth(request) {
  if (!auth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return null;
}

// Check if request has valid auth (master or author token or API token)
async function getAuthType(env, request) {
  if (auth(request)) return 'master';
  const author = await authorAuth(env, request);
  if (author) return author;
  // Check API token
  const apiToken = await authorApiAuth(env, request);
  return apiToken || null;
}

// 检查token是否有权限访问当前路径
function checkScope(authType, request) {
  if (!authType || authType === 'master') return authType;
  if (authType.scope === 'full') return authType;
  if (authType.scope === 'review') {
    const path = new URL(request.url).pathname;
    if (path.startsWith('/api/review/')) return authType; // review token can only access review API
    return null; // denied
  }
  return authType; // unknown scope, allow
}

// ═══════════════ HELPERS ═══════════════

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

function slugify(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

// ═══════════════ ROUTES ═══════════════

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  // ═══ Self-Migration (on first deploy) ═══
  await autoMigrate(env);

  // ═══ Public API (for build.js and frontend) ═══
  if (path === '/api/books.json' && request.method === 'GET') {
    return getPublicBooks(env);
  }
  const chMatch = path.match(/^\/api\/chapters\/([a-z0-9-]+)\.json$/);
  if (chMatch && request.method === 'GET') {
    return getPublicChapters(env, chMatch[1]);
  }
  if (path === '/api/genres' && request.method === 'GET') {
    return getGenres(env);
  }

  // Creem Webhook (public, no auth)
  if (path === '/api/webhook/creem' && request.method === 'POST') {
    return handleCreemWebhook(env, await request.json());
  }

  // Author Registration & Auth (public)
  if (path === '/api/author/register' && request.method === 'POST') {
    return authorRegister(env, await request.json());
  }
  if (path === '/api/author/verify' && request.method === 'POST') {
    return authorVerify(env, await request.json());
  }
  if (path === '/api/author/login' && request.method === 'POST') {
    return authorLogin(env, await request.json());
  }
  if (path === '/api/author/resend-code' && request.method === 'POST') {
    return authorResendCode(env, await request.json());
  }
  // Forgot / Reset password
  if (path === '/api/author/forgot-password' && request.method === 'POST') {
    return forgotPassword(env, request, await request.json());
  }
  if (path === '/api/author/reset-password' && request.method === 'POST') {
    return resetPassword(env, request, await request.json());
  }
  // Delete account (requires auth)
  if (path === '/api/author/account' && request.method === 'DELETE') {
    return deleteAuthorAccount(env, request, await request.json());
  }

  // API Tokens (requires auth)
  if (path === '/api/author/tokens' && request.method === 'GET') {
    return listApiTokens(env, request);
  }
  if (path === '/api/author/tokens' && request.method === 'POST') {
    return createApiToken(env, request, await request.json());
  }
  const delToken = path.match(/^\/api\/author\/tokens\/(.+)$/);
  if (delToken && request.method === 'DELETE') {
    return revokeApiToken(env, delToken[1], request);
  }

  // ═══ AI Review Queue (for 扣子 AI reviewer) ═══
  if (path === '/api/review/queue' && request.method === 'GET') {
    return getReviewQueue(env, request);
  }
  const revChapter = path.match(/^\/api\/review\/chapters\/([a-z0-9-]+)\/(\d+)$/);
  if (revChapter && request.method === 'GET') {
    return getReviewChapter(env, revChapter[1], parseInt(revChapter[2]), request);
  }
  if (path === '/api/review/verdict' && request.method === 'POST') {
    return submitVerdict(env, request, await request.json());
  }
  if (path === '/api/review/stats' && request.method === 'GET') {
    return getReviewStats(env);
  }

  // ═══ Review → Email Notification → Unpublished Workflow ═══
  if (path === '/api/email-queue' && request.method === 'GET') {
    return getEmailQueue(env, request);
  }
  if (path === '/api/email-queue/mark-sent' && request.method === 'POST') {
    return markEmailSent(env, request, await request.json());
  }
  if (path === '/api/unpublished' && request.method === 'GET') {
    return getUnpublished(env, request);
  }
  const resubMatch = path.match(/^\/api\/author\/resubmit\/([a-z0-9-]+)\/(\d+)$/);
  if (resubMatch && request.method === 'POST') {
    return resubmitChapter(env, resubMatch[1], parseInt(resubMatch[2]), request, await request.json());
  }
  if (path === '/api/admin/auto-unpublish' && request.method === 'POST') {
    return autoUnpublishExpired(env, request);
  }

  // ═══ Admin API (requires auth) ═══
  // Login (no auth needed)
  if (path === '/api/auth/login' && request.method === 'POST') {
    const body = await request.json();
    if (body.token === AUTH_TOKEN) {
      return json({ ok: true, token: AUTH_TOKEN });
    }
    return json({ error: 'Invalid token' }, 401);
  }
  if (path === '/api/auth/check' && request.method === 'GET') {
    const authErr = requireAuth(request);
    if (authErr) return json({ error: 'Unauthorized' }, 401);
    return json({ ok: true, message: 'Authenticated' });
  }
  // Public: D1 → books.json export for static site sync
  if (path === '/api/books/export' && request.method === 'GET') {
    return exportBooksForBuild(env);
  }

  // Setup (first run, no auth needed if no books exist)
  if (path === '/api/setup' && request.method === 'POST') {
    return setupAdmin(env);
  }

  // ═══ Reader System v2 (public, no auth required) ═══
  // Favorites
  if (path === '/api/favorites' && request.method === 'GET') {
    return listFavorites(env, request);
  }
  if (path === '/api/favorites' && request.method === 'POST') {
    return addFavorite(env, await request.json());
  }
  const favMatch = path.match(/^\/api\/favorites\/([a-z0-9-]+)$/);
  if (favMatch && request.method === 'DELETE') {
    return removeFavorite(env, favMatch[1], request);
  }
  // Reviews (GET public, POST public with simple captcha)
  const revMatch = path.match(/^\/api\/books\/([a-z0-9-]+)\/reviews$/);
  if (revMatch && request.method === 'GET') {
    return listReviews(env, revMatch[1]);
  }
  if (revMatch && request.method === 'POST') {
    return addReview(env, revMatch[1], await request.json());
  }
  // Reading Progress
  if (path === '/api/progress' && request.method === 'PUT') {
    return saveProgress(env, await request.json());
  }
  const progMatch = path.match(/^\/api\/progress\/([a-z0-9-]+)$/);
  if (progMatch && request.method === 'GET') {
    return getProgress(env, progMatch[1], request);
  }

  // Checkin & Points
  if (path === '/api/checkin' && request.method === 'POST') {
    return doCheckin(env, await request.json());
  }
  if (path === '/api/checkin' && request.method === 'GET') {
    return getCheckinStatus(env, request);
  }
  if (path === '/api/points' && request.method === 'GET') {
    return getPoints(env, request);
  }

  // Gifts (public)
  const giftMatchPublic = path.match(/^\/api\/gifts\/([a-z0-9-]+)$/);
  if (giftMatchPublic && request.method === 'GET') {
    return listGifts(env, giftMatchPublic[1]);
  }
  if (path === '/api/gifts' && request.method === 'POST') {
    return sendGift(env, await request.json());
  }

  // Forum (public read/write — reader_id based auth)
  if (path === '/api/forum/topics' && request.method === 'GET') {
    return listForumTopics(env, request);
  }
  if (path === '/api/forum/topics' && request.method === 'POST') {
    return createForumTopic(env, await request.json());
  }
  const topicMatchPublic = path.match(/^\/api\/forum\/topics\/(\d+)$/);
  if (topicMatchPublic && request.method === 'GET') {
    return getForumTopic(env, parseInt(topicMatchPublic[1]));
  }
  if (topicMatchPublic && request.method === 'DELETE') {
    return deleteForumTopic(env, parseInt(topicMatchPublic[1]));
  }
  const postMatchPublic = path.match(/^\/api\/forum\/topics\/(\d+)\/posts$/);
  if (postMatchPublic && request.method === 'POST') {
    return addForumPost(env, parseInt(postMatchPublic[1]), await request.json());
  }

  // Pageview tracking (public, lightweight)
  if (path === '/api/track/pageview' && request.method === 'POST') {
    return trackPageview(env, await request.json());
  }

  const authType = await getAuthType(env, request);
  if (!authType) {
    return json({ error: 'Unauthorized' }, 401);
  }
  // Scope check for API tokens
  if (!checkScope(authType, request)) {
    return json({ error: 'Forbidden — insufficient permissions' }, 403);
  }

  // Books
  if (path === '/api/books' && request.method === 'GET') {
    return listBooks(env, authType);
  }
  if (path === '/api/books' && request.method === 'POST') {
    return createBook(env, await request.json(), authType);
  }
  // Export endpoint (must be before slug regex matcher)
  if (path === '/api/books/export' && request.method === 'GET') {
    return exportBooksForBuild(env);
  }
  const bookMatch = path.match(/^\/api\/books\/([a-z0-9-]+)$/);
  if (bookMatch) {
    const slug = bookMatch[1];
    if (request.method === 'GET') return getBook(env, slug);
    if (request.method === 'PUT') return updateBook(env, slug, await request.json());
    if (request.method === 'DELETE') return deleteBook(env, slug);
  }

  // Chapters
  const chMatch2 = path.match(/^\/api\/books\/([a-z0-9-]+)\/chapters$/);
  if (chMatch2 && request.method === 'GET') {
    return listChapters(env, chMatch2[1]);
  }
  if (chMatch2 && request.method === 'POST') {
    return addChapter(env, chMatch2[1], await request.json());
  }
  const chNumMatch = path.match(/^\/api\/books\/([a-z0-9-]+)\/chapters\/(\d+)$/);
  if (chNumMatch) {
    const slug = chNumMatch[1];
    const num = parseInt(chNumMatch[2]);
    if (request.method === 'GET') return getChapter(env, slug, num);
    if (request.method === 'PUT') return updateChapter(env, slug, num, await request.json());
    if (request.method === 'DELETE') return deleteChapter(env, slug, num);
  }

  // Batch publish chapters
  if (chMatch2 && request.method === 'PUT') {
    return batchPublishChapters(env, chMatch2[1], await request.json());
  }

  // Deploy trigger
  if (path === '/api/deploy' && request.method === 'POST') {
    return triggerDeploy(env);
  }

  // Author payment settings (requires author auth)
  if (path === '/api/author/payment' && request.method === 'PUT') {
    return authorSetPayment(env, request);
  }
  if (path === '/api/author/me' && request.method === 'GET') {
    return authorGetMe(env, request);
  }

  // Earnings
  const earnMatch = path.match(/^\/api\/earnings\/(.+)\/settle$/);
  if (earnMatch && request.method === 'PUT') {
    return settleAuthor(env, earnMatch[1]);
  }
  const earnAuthor = path.match(/^\/api\/earnings\/(.+)$/);
  if (earnAuthor && request.method === 'GET') {
    return getAuthorEarnings(env, earnAuthor[1], authType);
  }
  if (path === '/api/earnings' && request.method === 'GET') {
    // Only admin can see all earnings
    if (authType !== 'master') return json({ error: 'Unauthorized' }, 401);
    return getAllEarnings(env);
  }

  // Analytics (requires auth)
  if (path === '/api/analytics/books' && request.method === 'GET') {
    return getBookAnalytics(env);
  }
  const analyticsBook = path.match(/^\/api\/analytics\/books\/([a-z0-9-]+)$/);
  if (analyticsBook && request.method === 'GET') {
    return getSingleBookAnalytics(env, analyticsBook[1]);
  }

  // Agreements
  if (path === '/api/agreements' && request.method === 'GET') {
    return listAgreements(env);
  }

  // Check scheduled chapters
  if (path === '/api/cron/check-scheduled' && request.method === 'POST') {
    return checkScheduled(env);
  }

  return json({ error: 'Not found' }, 404);
}

// ═══════════════ PUBLIC DATA API ═══════════════

async function getPublicBooks(env) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM books WHERE published = 1 ORDER BY rating DESC'
  ).all();
  // Transform for frontend compatibility
  const books = results.map(b => ({
    ...b,
    genres: JSON.parse(b.genres || '[]'),
    published: undefined
  }));
  return json(books);
}

async function getPublicChapters(env, slug) {
  const { results } = await env.DB.prepare(
    'SELECT number, title, word_count as wordCount, updated_at as updated, published FROM chapters WHERE book_slug = ? AND published = 1 ORDER BY number'
  ).bind(slug).all();
  return json(results);
}

async function getGenres(env) {
  const { results } = await env.DB.prepare(
    'SELECT DISTINCT genre FROM books WHERE published = 1'
  ).all();
  return json(results.map(r => r.genre));
}

// ═══════════════ ADMIN: BOOKS ═══════════════

async function setupAdmin(env) {
  // Check if any books exist; if so, refuse setup
  const { results } = await env.DB.prepare('SELECT COUNT(*) as c FROM books').all();
  if (results[0].c > 0) {
    return json({ error: 'Already set up' }, 400);
  }
  return json({ ok: true, token: AUTH_TOKEN, message: 'Use this token in Authorization: Bearer header' });
}

async function listBooks(env, authType) {
  let sql = 'SELECT b.*, (SELECT COUNT(*) FROM chapters WHERE book_slug = b.slug) as chapter_count FROM books b';
  const params = [];
  
  // Author isolation: non-admin users only see their own books
  // Match by display_name OR email (API-uploaded books may have either as author)
  if (authType !== 'master' && authType && authType.display_name) {
    const email = authType.email || '';
    sql += ' WHERE b.author = ? OR b.author = ?';
    params.push(authType.display_name, email);
  }
  
  sql += ' ORDER BY b.updated_at DESC';
  const stmt = env.DB.prepare(sql);
  const bound = params.length > 0 ? stmt.bind(...params) : stmt;
  const { results } = await bound.all();
  return json(results.map(b => ({ ...b, genres: JSON.parse(b.genres || '[]') })));
}

async function createBook(env, data, authType) {
  if (!data.genre) {
    return json({ error: 'Genre is required. Please select a genre for your novel.' }, 400);
  }
  const slug = data.slug || slugify(data.title);
  const genres = JSON.stringify(data.genres || [data.genre]);
  
  // Author isolation: force author name from auth if not admin
  let author = data.author;
  if (authType !== 'master' && authType && authType.display_name) {
    author = authType.display_name;
  }
  
  await env.DB.prepare(
    `INSERT INTO books (slug, title, author, author_bio, genre, genres, tier, price, status, 
     rating, reviews, cover, cover_alt, free_chapters, description, published, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  ).bind(
    slug, data.title, author, data.authorBio || '', data.genre || 'xianxia',
    genres, data.tier || 'paid', data.price || 4.99, data.status || 'ongoing',
    data.rating || 4.5, data.reviews || 0, data.cover || `/images/covers/${slug}.png`,
    data.coverAlt || '', data.freeChapters || 5, data.description || '', data.published ? 1 : 0
  ).run();

  return json({ ok: true, slug });
}

async function getBook(env, slug) {
  const book = await env.DB.prepare('SELECT * FROM books WHERE slug = ?').bind(slug).first();
  if (!book) return json({ error: 'Not found' }, 404);
  book.genres = JSON.parse(book.genres || '[]');
  const { results: chs } = await env.DB.prepare(
    'SELECT * FROM chapters WHERE book_slug = ? ORDER BY number'
  ).bind(slug).all();
  book._chapters = chs;
  return json(book);
}

async function updateBook(env, slug, data) {
  const existing = await env.DB.prepare('SELECT * FROM books WHERE slug = ?').bind(slug).first();
  if (!existing) return json({ error: 'Not found' }, 404);

  const genres = JSON.stringify(data.genres || JSON.parse(existing.genres || '[]'));
  await env.DB.prepare(
    `UPDATE books SET title=?, author=?, author_bio=?, genre=?, genres=?, tier=?, price=?,
     status=?, rating=?, reviews=?, cover=?, cover_alt=?, free_chapters=?, description=?,
     published=?, updated_at=datetime('now') WHERE slug=?`
  ).bind(
    data.title || existing.title,
    data.author || existing.author,
    data.authorBio || existing.author_bio,
    data.genre || existing.genre,
    genres,
    data.tier || existing.tier,
    data.price ?? existing.price,
    data.status || existing.status,
    data.rating ?? existing.rating,
    data.reviews ?? existing.reviews,
    data.cover || existing.cover,
    data.coverAlt || existing.cover_alt,
    data.freeChapters ?? existing.free_chapters,
    data.description || existing.description,
    data.published !== undefined ? (data.published ? 1 : 0) : existing.published,
    slug
  ).run();

  return json({ ok: true });
}

async function deleteBook(env, slug) {
  await env.DB.prepare('DELETE FROM chapters WHERE book_slug = ?').bind(slug).run();
  await env.DB.prepare('DELETE FROM books WHERE slug = ?').bind(slug).run();
  return json({ ok: true });
}

// Export D1 books as books.json format for static site build sync
async function exportBooksForBuild(env) {
  try {
    const { results: books } = await env.DB.prepare(
      'SELECT * FROM books ORDER BY slug'
    ).all();
    const data = books.map(b => ({
      slug: b.slug,
      title: b.title,
      author: b.author,
      authorBio: b.author_bio || '',
      genre: b.genre || 'xianxia',
      genres: JSON.parse(b.genres || '[]'),
      tier: b.tier || 'free',
      price: b.price || 0,
      status: b.status || 'ongoing',
      rating: b.rating || 4.5,
      reviews: b.reviews || 0,
      cover: b.cover || '/images/covers/dao-celestial-blade.png',
      coverAlt: b.cover_alt || '',
      freeChapters: b.free_chapters || 0,
      updated: b.updated_at || '2026-06-22',
      description: b.description || ''
    }));
    return new Response(JSON.stringify(data, null, 2), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// ═══ Content Review Engine ═══
// 完整单词 → 整词边界 \b 匹配，避免子串误伤（cum→documented, anal→analysis, tits→titles）
const BAD_WORDS_BOUNDARY=['fuck','porn','hentai','xxx','cum','dick','pussy','cock','tits','anal','blowjob','orgy','incest','rape','slut','whore','milf','gangbang','threesome','bukkake','futanari','ecchi','bdsm','penis','vagina','clitoris','escort','squirting'];
// 词根 → 子串匹配（masturb→masturbation, ejaculat→ejaculation, prostitut→prostitution，无正常词含此词根）
const BAD_WORDS_SUBSTR=['masturb','ejaculat','prostitut'];
// 预编整词正则（一次编译，避免循环内 new RegExp）
var BAD_RE_BOUNDARY=BAD_WORDS_BOUNDARY.map(function(w){ return {word:w,re:new RegExp('\\b'+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i')}; });

function reviewContent(title,content){
  var issues=[],severe=0,moderate=0;
  var t=(title+' '+content).toLowerCase();
  var chars=t.replace(/\s/g,'').length;

  // 违禁词检测 — 整词边界匹配
  BAD_RE_BOUNDARY.forEach(function(entry){
    if(entry.re.test(t)){issues.push({type:'forbidden',word:entry.word,severity:'severe'});severe++;}
  });
  // 词根子串匹配
  BAD_WORDS_SUBSTR.forEach(function(w){
    if(t.indexOf(w)>=0){issues.push({type:'forbidden',word:w,severity:'severe'});severe++;}
  });

  // 格式检测
  if(chars<300)issues.push({type:'quality',msg:'Chapter too short (<300 chars)',severity:'moderate'});
  if(chars>50000)issues.push({type:'quality',msg:'Chapter too long (>50000 chars)',severity:'moderate'});
  if(!title||title.length<2)issues.push({type:'quality',msg:'Missing title',severity:'moderate'});

  // 中英混合检测（针对AI翻译）
  var cnChars=(t.match(/[\u4e00-\u9fff]/g)||[]).length;
  if(cnChars>chars*0.3)issues.push({type:'translation',msg:'Too much Chinese text ('+Math.round(cnChars/chars*100)+'%) — translation may be incomplete',severity:'moderate'});
  if(cnChars>0&&cnChars<chars*0.05&&chars>500)issues.push({type:'translation',msg:'Minor Chinese characters found — check for untranslated terms',severity:'mild'});

  // 格式问题
  if(content.indexOf('\n\n\n\n')>=0)issues.push({type:'format',msg:'Excessive blank lines',severity:'mild'});

  return {passed:severe===0,issues:issues,severe_count:severe,moderate_count:moderate+issues.filter(function(i){return i.severity==='moderate';}).length,total_issues:issues.length,char_count:chars,cn_char_count:cnChars};
}

// ═══════════════ ADMIN: CHAPTERS ═══════════════

async function listChapters(env, slug) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM chapters WHERE book_slug = ? ORDER BY number'
  ).bind(slug).all();
  return json(results);
}

// 解析定时发布时间为 SQLite datetime 兼容格式
function parseScheduledAt(input) {
  if (!input) return null;
  const d = new Date(input);
  if (isNaN(d.getTime())) return null; // 无效时间 → null
  return d.toISOString().replace('T', ' ').slice(0, 19); // "2026-06-22 08:00:00"
}

async function addChapter(env, slug, data) {
  const book = await env.DB.prepare('SELECT * FROM books WHERE slug = ?').bind(slug).first();
  if (!book) return json({ error: 'Book not found' }, 404);

  const content = data.content || '';
  const title = data.title || '';

  // 计算实际字数（英文按空格分词，中文按字符）
  function countWords(text) {
    if (!text) return 0;
    const cleaned = text.replace(/<[^>]+>/g, ' ').replace(/[^\w\u4e00-\u9fff\s]/g, ' ');
    const words = cleaned.split(/\s+/).filter(w => w.length > 0);
    let total = 0;
    for (const w of words) {
      if (/[\u4e00-\u9fff]/.test(w)) {
        // 中文：按字符数
        total += w.length;
      } else {
        // 英文：每个token计1词
        total += 1;
      }
    }
    return total;
  }
  const wordCount = data.wordCount || countWords(content) || 1;

  // ═══ 自动审核 ═══
  const review = reviewContent(title, content);

  // Severe violations → reject
  if (review.severe_count > 0) {
    return json({
      error: 'Content review failed — '+review.severe_count+' severe violation(s) found',
      review: review,
      fix: 'Fix the flagged issues and retry. Use ?force=true to bypass (admin only).'
    }, 400);
  }

  // Auto-number if not specified
  let number = data.number;
  if (!number) {
    const { results } = await env.DB.prepare(
      'SELECT COALESCE(MAX(number), 0) + 1 as next FROM chapters WHERE book_slug = ?'
    ).bind(slug).all();
    number = results[0].next;
  }

  await env.DB.prepare(
    `INSERT INTO chapters (book_slug, number, title, content, word_count, scheduled_at, published, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  ).bind(
    slug, number,
    title || `Chapter ${number}`,
    content,
    wordCount,
    parseScheduledAt(data.scheduledAt),
    data.published ? 1 : 0
  ).run();

  // 加入AI审核队列
  await env.DB.prepare(
    'INSERT OR REPLACE INTO review_queue (book_slug, chapter_num, status, auto_review) VALUES (?, ?, ?, ?)'
  ).bind(slug, number, 'pending', JSON.stringify(review)).run();

  // Update book word count
  await updateBookStats(env, slug);

  return json({ ok: true, number, review });
}

async function getChapter(env, slug, number) {
  const ch = await env.DB.prepare(
    'SELECT * FROM chapters WHERE book_slug = ? AND number = ?'
  ).bind(slug, number).first();
  if (!ch) return json({ error: 'Not found' }, 404);
  return json(ch);
}

async function updateChapter(env, slug, number, data) {
  const existing = await env.DB.prepare(
    'SELECT * FROM chapters WHERE book_slug = ? AND number = ?'
  ).bind(slug, number).first();
  if (!existing) return json({ error: 'Not found' }, 404);

  await env.DB.prepare(
    `UPDATE chapters SET title=?, content=?, word_count=?, scheduled_at=?, published=?, updated_at=datetime('now')
     WHERE book_slug=? AND number=?`
  ).bind(
    data.title || existing.title,
    data.content || existing.content,
    data.wordCount ?? existing.word_count,
    data.scheduledAt !== undefined ? parseScheduledAt(data.scheduledAt) : existing.scheduled_at,
    data.published !== undefined ? (data.published ? 1 : 0) : existing.published,
    slug, number
  ).run();

  await updateBookStats(env, slug);
  return json({ ok: true });
}

async function deleteChapter(env, slug, number) {
  // Delete the chapter
  await env.DB.prepare(
    'DELETE FROM chapters WHERE book_slug = ? AND number = ?'
  ).bind(slug, number).run();

  // Re-number remaining chapters to fill the gap
  await env.DB.prepare(
    `UPDATE chapters SET number = number - 1
     WHERE book_slug = ? AND number > ?`
  ).bind(slug, number).run();

  await updateBookStats(env, slug);
  return json({ ok: true });
}

async function batchPublishChapters(env, slug, data) {
  const { numbers, published } = data;
  if (!numbers || !Array.isArray(numbers)) return json({ error: 'numbers array required' }, 400);
  
  for (const num of numbers) {
    await env.DB.prepare(
      'UPDATE chapters SET published = ?, updated_at = datetime(\'now\') WHERE book_slug = ? AND number = ?'
    ).bind(published ? 1 : 0, slug, num).run();
  }
  return json({ ok: true });
}

async function updateBookStats(env, slug) {
  await env.DB.prepare(
    `UPDATE books SET 
     chapters = (SELECT COUNT(*) FROM chapters WHERE book_slug = ?),
     wordCount = (SELECT COALESCE(SUM(word_count), 0) FROM chapters WHERE book_slug = ?),
     updated_at = datetime('now')
     WHERE slug = ?`
  ).bind(slug, slug, slug).run();
}

// ═══════════════ DEPLOY & SCHEDULED ═══════════════

async function triggerDeploy(env) {
  const hookUrl = env.DEPLOY_HOOK_URL;
  if (!hookUrl) {
    return json({ ok: true, skipped: true, message: 'Deploy via GitHub Actions — no hook URL configured' });
  }

  try {
    const resp = await fetch(hookUrl, { method: 'POST' });
    const text = await resp.text();
    return json({ ok: true, deployResponse: text.substring(0, 200) });
  } catch (e) {
    return json({ error: 'Deploy hook failed: ' + e.message }, 500);
  }
}

async function checkScheduled(env) {
  // Find chapters that are scheduled and past their scheduled_at time
  const { results } = await env.DB.prepare(
    `SELECT c.*, b.title as book_title FROM chapters c 
     JOIN books b ON c.book_slug = b.slug
     WHERE c.published = 0 AND c.scheduled_at IS NOT NULL AND c.scheduled_at <= datetime('now')`
  ).all();

  if (results.length === 0) {
    return json({ ok: true, published: 0 });
  }

  for (const ch of results) {
    await env.DB.prepare(
      'UPDATE chapters SET published = 1, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(ch.id).run();
  }

  // Auto-trigger deploy after publishing scheduled chapters
  if (env.DEPLOY_HOOK_URL) {
    try {
      await fetch(env.DEPLOY_HOOK_URL, { method: 'POST' });
    } catch {}
  }

  return json({ ok: true, published: results.length, chapters: results.map(c => c.book_slug + '#' + c.number) });
}

// ═══════════════ AUTHOR AUTH ═══════════════

async function authorRegister(env, data) {
  const { email, password, displayName, penName, agreeToTerms } = data;
  
  if (!email || !password || !displayName) {
    return json({ error: 'Email, password, and display name are required' }, 400);
  }

  // Check agreement
  if (!agreeToTerms) {
    return json({ error: 'You must agree to the Author Agreement before registering.' }, 400);
  }

  // Password strength
  const pwError = validatePassword(password);
  if (pwError) {
    return json({ error: pwError }, 400);
  }

  // Block disposable emails
  if (isDisposable(email)) {
    return json({ error: 'Disposable email addresses are not allowed. Please use a real email.' }, 400);
  }

  // Check if already registered
  const existing = await env.DB.prepare('SELECT id FROM authors WHERE email = ?').bind(email).first();
  if (existing) {
    return json({ error: 'This email is already registered' }, 409);
  }

  const code = generateCode();
  const codeExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);
  const id = 'auth_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  const pwHash = hashPassword(password);

  await env.DB.prepare(
    `INSERT INTO authors (id, email, password_hash, display_name, pen_name, verify_code, verify_code_expires, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  ).bind(id, email, pwHash, displayName, penName || displayName, code, codeExpires).run();

  // Send real email
  const sent = await sendEmail(email, 
    'FictionVerse — Your Verification Code',
    `Welcome to FictionVerse, ${displayName}!\n\nYour verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't create this account, please ignore this email.\n\n— FictionVerse Team`
  );
  
  console.log(`Sent verification to ${email}: ${sent ? 'OK' : 'FAILED'}, code=${code}`);

  return json({ 
    ok: true, 
    message: 'Verification code sent to your email. Please check your inbox (and spam folder).'
  });
}

async function authorResendCode(env, data) {
  const { email } = data;
  const author = await env.DB.prepare('SELECT * FROM authors WHERE email = ? AND verified = 0').bind(email).first();
  if (!author) return json({ error: 'Email not found or already verified' }, 404);

  const code = generateCode();
  const codeExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);
  await env.DB.prepare(
    'UPDATE authors SET verify_code = ?, verify_code_expires = ? WHERE email = ?'
  ).bind(code, codeExpires, email).run();

  await sendEmail(email, 'FictionVerse — Your Verification Code', `Your new verification code is: ${code}\n\nThis code expires in 10 minutes.\n\n— FictionVerse Team`);
  console.log(`Resent code to ${email}: ${code}`);

  return json({ ok: true, message: 'New code sent to your email.' });
}

// ═══════════════ RATE LIMITER ═══════════════
const rateLimitMap = new Map(); // IP → {count, resetTime}
function checkRateLimit(ip, maxRequests = 5, windowSec = 60) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowSec * 1000 });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

// ═══════════════ FORGOT / RESET PASSWORD ═══════════════
async function forgotPassword(env, request, data) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!checkRateLimit(ip, 3, 60)) {
    return json({ error: 'Too many attempts. Please wait a minute.' }, 429);
  }
  
  const { email } = data;
  if (!email) return json({ error: 'Email is required' }, 400);
  
  // Check author exists and is verified
  const author = await env.DB.prepare('SELECT * FROM authors WHERE email = ? AND verified = 1').bind(email).first();
  if (!author) {
    // Don't reveal if email exists — always return ok for security
    return json({ ok: true, message: 'If this email is registered, a reset code has been sent.' });
  }
  
  const code = generateCode();
  const codeExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);
  
  await env.DB.prepare(
    'UPDATE authors SET verify_code = ?, verify_code_expires = ? WHERE email = ?'
  ).bind(code, codeExpires, email).run();
  
  const sent = await sendEmail(email,
    'FictionVerse — Password Reset Code',
    `Hello,\n\nYou requested a password reset for your FictionVerse author account.\n\nYour reset code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\n— FictionVerse Team`
  );
  
  console.log(`Password reset code sent to ${email}: ${sent ? 'OK' : 'FAILED'}, code=${code}`);
  
  return json({ ok: true, message: 'If this email is registered, a reset code has been sent.' });
}

async function resetPassword(env, request, data) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!checkRateLimit(ip, 3, 60)) {
    return json({ error: 'Too many attempts. Please wait a minute.' }, 429);
  }
  
  const { email, code, newPassword } = data;
  if (!email || !code || !newPassword) {
    return json({ error: 'Email, code, and new password are required' }, 400);
  }
  
  // Validate password strength
  const pwError = validatePassword(newPassword);
  if (pwError) return json({ error: pwError }, 400);
  
  // Verify code
  const author = await env.DB.prepare(
    'SELECT * FROM authors WHERE email = ? AND verify_code = ? AND verify_code_expires > datetime(\'now\') AND verified = 1'
  ).bind(email, code).first();
  
  if (!author) {
    return json({ error: 'Invalid or expired reset code' }, 400);
  }
  
  // Update password
  const pwHash = hashPassword(newPassword);
  await env.DB.prepare(
    'UPDATE authors SET password_hash = ?, verify_code = NULL, verify_code_expires = NULL, auth_token = NULL, token_expires = NULL WHERE email = ?'
  ).bind(pwHash, email).run();
  
  console.log(`Password reset for ${email}`);
  
  return json({ ok: true, message: 'Password reset successfully. Please login with your new password.' });
}

async function authorVerify(env, data) {
  const { email, code } = data;
  const author = await env.DB.prepare(
    'SELECT * FROM authors WHERE email = ? AND verify_code = ? AND verify_code_expires > datetime(\'now\')'
  ).bind(email, code).first();

  if (!author) {
    return json({ error: 'Invalid or expired verification code' }, 400);
  }

  await env.DB.prepare(
    'UPDATE authors SET verified = 1, verify_code = NULL, verify_code_expires = NULL WHERE email = ?'
  ).bind(email).run();

  // Record agreement signature
  await env.DB.prepare(
    'INSERT INTO agreements (author_email, display_name, agreement_version, ip_address, signed_at) VALUES (?, ?, \'v1\', ?, datetime(\'now\'))'
  ).bind(email, author.display_name, request.headers.get('CF-Connecting-IP') || '').run().catch(() => {});

  // Generate auth token
  const token = generateToken();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);
  await env.DB.prepare(
    'UPDATE authors SET auth_token = ?, token_expires = ? WHERE email = ?'
  ).bind(token, expires, email).run();

  return json({ ok: true, token, email });
}

async function deleteAuthorAccount(env, request, data) {
  const authType = await getAuthType(env, request);
  if (!authType) return json({ error: 'Unauthorized' }, 401);
  
  const { email } = data;
  if (!email) return json({ error: 'Email required' }, 400);
  
  // Verify the authenticated user matches the email (or is admin)
  if (authType !== 'master' && authType.email !== email) {
    return json({ error: 'You can only delete your own account' }, 403);
  }
  
  // Find the author
  const author = authType === 'master'
    ? await env.DB.prepare('SELECT * FROM authors WHERE email = ?').bind(email).first()
    : authType;
  
  if (!author) return json({ error: 'Author not found' }, 404);
  
  const authorEmail = author.email || email;
  const authorId = author.id;
  
  // 1. Delete all chapters for this author's books
  const books = await env.DB.prepare('SELECT slug FROM books WHERE author = ?').bind(authorEmail).all();
  for (const book of books.results) {
    await env.DB.prepare('DELETE FROM chapters WHERE book_slug = ?').bind(book.slug).run();
  }
  
  // 2. Delete all books
  await env.DB.prepare('DELETE FROM books WHERE author = ?').bind(authorEmail).run();
  
  // 3. Delete API tokens
  await env.DB.prepare('DELETE FROM api_tokens WHERE author_id = ?').bind(authorId).run();
  
  // 4. Delete agreements
  await env.DB.prepare('DELETE FROM agreements WHERE author_email = ?').bind(authorEmail).run();
  
  // 5. Delete the author record
  await env.DB.prepare('DELETE FROM authors WHERE email = ?').bind(authorEmail).run();
  
  console.log(`Account deleted: ${authorEmail} — all books, chapters, tokens removed`);
  
  return json({ ok: true, message: 'Account and all associated content permanently deleted.' });
}

async function authorLogin(env, data) {
  const { email, password } = data;
  const pwHash = hashPassword(password);
  
  const author = await env.DB.prepare(
    'SELECT * FROM authors WHERE email = ? AND password_hash = ? AND verified = 1'
  ).bind(email, pwHash).first();

  if (!author) {
    return json({ error: 'Invalid email or password. Make sure your email is verified.' }, 401);
  }

  // Generate new token
  const token = generateToken();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);
  await env.DB.prepare(
    'UPDATE authors SET auth_token = ?, token_expires = ? WHERE email = ?'
  ).bind(token, expires, email).run();

  return json({ 
    ok: true, 
    token, 
    email: author.email,
    displayName: author.display_name,
    penName: author.pen_name,
    paymentMethod: author.payment_method,
    paymentAccount: author.payment_account
  });
}

async function authorSetPayment(env, request) {
  const author = await authorAuth(env, request);
  if (!author) return json({ error: 'Author authentication required' }, 401);

  const data = await request.json();
  const { paymentMethod, paymentAccount } = data;

  if (!['alipay', 'payoneer', 'paypal'].includes(paymentMethod)) {
    return json({ error: 'Invalid payment method. Supported: alipay, payoneer, paypal' }, 400);
  }

  await env.DB.prepare(
    'UPDATE authors SET payment_method = ?, payment_account = ? WHERE email = ?'
  ).bind(paymentMethod, paymentAccount || '', author.email).run();

  return json({ ok: true, paymentMethod, paymentAccount });
}

async function authorGetMe(env, request) {
  const author = await authorAuth(env, request);
  if (!author) return json({ error: 'Author authentication required' }, 401);

  return json({
    email: author.email,
    displayName: author.display_name,
    penName: author.pen_name,
    paymentMethod: author.payment_method,
    paymentAccount: author.payment_account,
    verified: author.verified
  });
}

// ═══ API Tokens ═══
async function listApiTokens(env, request) {
  // 需要认证
  const authType = await getAuthType(env, request);
  if (!authType) return json({ error: 'Unauthorized' }, 401);
  const email = authType === 'master' ? (new URL(request.url)).searchParams.get('email') || '' : (authType.email || '');
  if (!email) return json({ error: 'email required' }, 400);

  const { results } = await env.DB.prepare(
    'SELECT id, author_email, label, created_at, last_used, substr(token,1,8)||\'...\' as token_preview FROM api_tokens WHERE author_email = ? ORDER BY created_at DESC'
  ).bind(email).all();
  return json(results);
}

async function createApiToken(env, request, body) {
  const authType = await getAuthType(env, request);
  if (!authType) return json({ error: 'Unauthorized' }, 401);
  const email = authType === 'master' ? (body.email || '') : (authType.email || '');
  if (!email) return json({ error: 'email required' }, 400);

  const label = body.label || 'Default';
  const scope = body.scope || 'full';
  const token = 'fvt_'+Array.from({length: 40}, ()=>Math.floor(Math.random()*16).toString(16)).join('');

  await env.DB.prepare('INSERT INTO api_tokens (author_email, token, label, scope) VALUES (?, ?, ?, ?)').bind(email, token, label, scope).run();
  return json({ ok: true, token: token, label: label, scope: scope, email: email });
}

async function revokeApiToken(env, tokenId, request) {
  const authType = await getAuthType(env, request);
  if (!authType) return json({ error: 'Unauthorized' }, 401);

  // tokenId is the database row id (passed by frontend from listApiTokens response)
  const email = authType === 'master' ? (new URL(request.url)).searchParams.get('email') || '' : (authType.email || '');
  if (!email) return json({ error: 'email required' }, 400);

  // Verify ownership: only the token owner (or master) can delete
  const row = await env.DB.prepare('SELECT author_email FROM api_tokens WHERE id = ?').bind(tokenId).first();
  if (!row) return json({ error: 'Token not found' }, 404);
  if (authType !== 'master' && row.author_email !== email) return json({ error: 'Not your token' }, 403);

  await env.DB.prepare('DELETE FROM api_tokens WHERE id = ?').bind(tokenId).run();
  return json({ ok: true });
}

// ═══ AI Review Queue ═══
async function getReviewQueue(env, request) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status')||'pending';
  const limit = parseInt(url.searchParams.get('limit'))||20;
  const { results } = await env.DB.prepare(
    'SELECT rq.*, b.title as book_title FROM review_queue rq JOIN books b ON rq.book_slug=b.slug WHERE rq.status=? ORDER BY rq.created_at ASC LIMIT ?'
  ).bind(status, limit).all();
  return json(results||[]);
}

async function getReviewChapter(env, slug, num, request) {
  const ch = await env.DB.prepare(
    'SELECT c.*, b.title as book_title FROM chapters c JOIN books b ON c.book_slug=b.slug WHERE c.book_slug=? AND c.number=?'
  ).bind(slug, num).first();
  if (!ch) return json({error:'Not found'},404);
  return json({...ch, auto_review: await getAutoReview(env,slug,num)});
}

async function getAutoReview(env, slug, num){
  const rq=await env.DB.prepare('SELECT auto_review FROM review_queue WHERE book_slug=? AND chapter_num=?').bind(slug,num).first();
  return rq?rq.auto_review:'{}';
}

async function submitVerdict(env, request, body) {
  const { book_slug, chapter_num, verdict, score, notes } = body;
  if (!book_slug || chapter_num===undefined) return json({error:'Missing fields'},400);

  await env.DB.prepare(
    "UPDATE review_queue SET status='reviewed', ai_verdict=?, ai_score=?, ai_notes=?, reviewed_by=?, reviewed_at=datetime('now') WHERE book_slug=? AND chapter_num=?"
  ).bind(verdict||'pass', score||0, notes||'', 'kozi_ai', book_slug, chapter_num).run();

  // If REJECTED → set deadline (24h), add to email queue, mark chapter as rejected
  if (verdict === 'reject') {
    const deadline = new Date(Date.now() + 24*3600*1000).toISOString();
    await env.DB.prepare(
      "UPDATE review_queue SET deadline=?, email_sent=0 WHERE book_slug=? AND chapter_num=?"
    ).bind(deadline, book_slug, chapter_num).run();
    await env.DB.prepare(
      "UPDATE chapters SET publish_status='rejected' WHERE book_slug=? AND number=?"
    ).bind(book_slug, chapter_num).run();

    // Get author info for email
    const book = await env.DB.prepare('SELECT title, author FROM books WHERE slug=?').bind(book_slug).first();
    const chapter = await env.DB.prepare('SELECT title FROM chapters WHERE book_slug=? AND number=?').bind(book_slug, chapter_num).first();
    const author = await env.DB.prepare('SELECT email, display_name FROM authors WHERE username=?').bind(book?.author).first();

    if (author && book && chapter) {
      const subject = `[FictionVerse] Your chapter "${chapter.title}" needs revision`;
      const body = buildRejectEmail({
        authorName: author.display_name,
        bookTitle: book.title,
        chapterTitle: chapter.title,
        chapterNum: chapter_num,
        score, notes,
        deadline: '24 hours'
      });
      await env.DB.prepare(
        `INSERT INTO email_queue (author_email, author_name, book_slug, book_title, chapter_num, chapter_title, verdict, subject, body)
         VALUES (?, ?, ?, ?, ?, ?, 'reject', ?, ?)`
      ).bind(author.email, author.display_name, book_slug, book.title, chapter_num, chapter.title, subject, body).run();
    }
  }

  // If FLAGGED → warn but don't reject
  if (verdict === 'flag') {
    const book = await env.DB.prepare('SELECT title, author FROM books WHERE slug=?').bind(book_slug).first();
    const chapter = await env.DB.prepare('SELECT title FROM chapters WHERE book_slug=? AND number=?').bind(book_slug, chapter_num).first();
    const author = await env.DB.prepare('SELECT email, display_name FROM authors WHERE username=?').bind(book?.author).first();

    if (author && book && chapter) {
      const subject = `[FictionVerse] Your chapter "${chapter.title}" has been flagged for review`;
      const body = buildFlagEmail({
        authorName: author.display_name,
        bookTitle: book.title,
        chapterTitle: chapter.title,
        chapterNum: chapter_num,
        score, notes
      });
      await env.DB.prepare(
        `INSERT INTO email_queue (author_email, author_name, book_slug, book_title, chapter_num, chapter_title, verdict, subject, body)
         VALUES (?, ?, ?, ?, ?, ?, 'flag', ?, ?)`
      ).bind(author.email, author.display_name, book_slug, book.title, chapter_num, chapter.title, subject, body).run();
    }
  }

  return json({ok:true, verdict, email_queued: verdict==='reject'||verdict==='flag'});
}

async function getReviewStats(env) {
  const [pending, reviewed, flagged] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) as cnt FROM review_queue WHERE status='pending'").first(),
    env.DB.prepare("SELECT COUNT(*) as cnt FROM review_queue WHERE status='reviewed' AND ai_verdict='pass'").first(),
    env.DB.prepare("SELECT COUNT(*) as cnt FROM review_queue WHERE status='reviewed' AND ai_verdict='flag'").first()
  ]);
  return json({pending:pending?.cnt||0, passed:reviewed?.cnt||0, flagged:flagged?.cnt||0});
}

// ═══════════════ EARNINGS & WEBHOOK ═══════════════

// Platform fee rate (20%)
const PLATFORM_FEE_RATE = 0.15;

async function handleCreemWebhook(env, data) {
  // Creem sends: { event: 'checkout.completed', data: { id, product_id, amount, customer_email, metadata } }
  // We'll also accept a simplified format for manual entry
  const bookSlug = data.book_slug || (data.data && data.data.metadata && data.data.metadata.book_slug) || '';
  const orderId = data.order_id || (data.data && data.data.id) || '';
  const amountUsd = parseFloat(data.amount_usd || (data.data && data.data.amount) || 0);
  const customerEmail = data.customer_email || (data.data && data.data.customer_email) || '';

  if (!bookSlug || !orderId || !amountUsd) {
    return json({ error: 'Missing required fields: book_slug, order_id, amount_usd' }, 400);
  }

  // Get book info for author name
  const book = await env.DB.prepare('SELECT title, author FROM books WHERE slug = ?').bind(bookSlug).first();
  if (!book) {
    return json({ error: 'Book not found' }, 404);
  }

  const platformFee = Math.round(amountUsd * PLATFORM_FEE_RATE * 100) / 100;
  const authorShare = Math.round((amountUsd - platformFee) * 100) / 100;

  try {
    await env.DB.prepare(
      `INSERT INTO transactions (book_slug, author_name, amount_usd, platform_fee, author_share, currency, order_id, customer_email, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'USD', ?, ?, 'completed', datetime('now'))`
    ).bind(bookSlug, book.author, amountUsd, platformFee, authorShare, orderId, customerEmail).run();

    return json({ ok: true, platformFee, authorShare, author: book.author, book: book.title });
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE')) {
      return json({ ok: true, message: 'Duplicate order, already recorded' });
    }
    return json({ error: e.message }, 500);
  }
}

async function getAllEarnings(env) {
  const { results } = await env.DB.prepare(
    `SELECT author_name, 
      COUNT(*) as total_sales,
      SUM(amount_usd) as total_revenue,
      SUM(platform_fee) as total_platform_fee,
      SUM(author_share) as total_author_share,
      SUM(CASE WHEN settled = 0 THEN author_share ELSE 0 END) as unsettled,
      SUM(CASE WHEN settled = 1 THEN author_share ELSE 0 END) as settled_amount
     FROM transactions 
     WHERE status = 'completed'
     GROUP BY author_name
     ORDER BY total_revenue DESC`
  ).all();
  return json(results);
}

async function getAuthorEarnings(env, author) {
  // Get summary
  const summary = await env.DB.prepare(
    `SELECT 
      COUNT(*) as total_sales,
      COALESCE(SUM(amount_usd), 0) as total_revenue,
      COALESCE(SUM(platform_fee), 0) as total_platform_fee,
      COALESCE(SUM(author_share), 0) as total_author_share,
      COALESCE(SUM(CASE WHEN settled = 0 THEN author_share ELSE 0 END), 0) as unsettled,
      COALESCE(SUM(CASE WHEN settled = 1 THEN author_share ELSE 0 END), 0) as settled_amount
     FROM transactions 
     WHERE author_name = ? AND status = 'completed'`
  ).bind(author).first();

  // Get detail transactions
  const { results } = await env.DB.prepare(
    `SELECT * FROM transactions WHERE author_name = ? ORDER BY created_at DESC LIMIT 100`
  ).bind(author).all();

  return json({ summary, transactions: results });
}

async function settleAuthor(env, author) {
  // Mark all unsettled transactions as settled
  const result = await env.DB.prepare(
    `UPDATE transactions SET settled = 1 WHERE author_name = ? AND settled = 0 AND status = 'completed'`
  ).bind(author).run();

  return json({ ok: true, message: `Marked ${result.meta ? result.meta.changes : 'all'} transactions as settled for ${author}` });
}

async function listAgreements(env) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM agreements ORDER BY signed_at DESC'
  ).all();
  return json(results);
}

// ═══════════════ READER SYSTEM V2 ═══════════════

// --- Favorites ---
async function listFavorites(env, request) {
  const url = new URL(request.url);
  const readerId = url.searchParams.get('reader_id') || 'anon';
  const { results } = await env.DB.prepare(
    'SELECT f.book_slug, b.title, b.author, b.cover, b.genre, b.rating, b.status, b.tier, f.created_at FROM favorites f JOIN books b ON f.book_slug = b.slug WHERE f.reader_id = ? ORDER BY f.created_at DESC'
  ).bind(readerId).all();

  // 为每本书查总章数和读者进度
  const enriched = [];
  for (const row of results) {
    const [chCount, prog] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) as cnt FROM chapters WHERE book_slug = ? AND published = 1').bind(row.book_slug).first(),
      env.DB.prepare('SELECT chapter_num FROM reading_progress WHERE book_slug = ? AND reader_id = ?').bind(row.book_slug, readerId).first()
    ]);
    const totalChs = chCount ? chCount.cnt : 0;
    const readUpTo = prog ? prog.chapter_num : 0;
    const newCount = Math.max(0, totalChs - readUpTo);
    enriched.push({
      ...row,
      total_chapters: totalChs,
      read_up_to: readUpTo,
      new_chapters: newCount,
      has_update: newCount > 0
    });
  }
  return json(enriched);
}

async function addFavorite(env, body) {
  const { book_slug, reader_id } = body;
  if (!book_slug || !reader_id) return json({ error: 'Missing fields' }, 400);
  try {
    await env.DB.prepare(
      'INSERT OR IGNORE INTO favorites (book_slug, reader_id) VALUES (?, ?)'
    ).bind(book_slug, reader_id).run();
    return json({ ok: true, favorited: true });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

async function removeFavorite(env, slug, request) {
  const url = new URL(request.url);
  const readerId = url.searchParams.get('reader_id') || 'anon';
  await env.DB.prepare('DELETE FROM favorites WHERE book_slug = ? AND reader_id = ?').bind(slug, readerId).run();
  return json({ ok: true, favorited: false });
}

// --- Reviews ---
async function listReviews(env, slug) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM reviews WHERE book_slug = ? ORDER BY created_at DESC LIMIT 100'
  ).bind(slug).all();
  // Update avg rating
  const avg = await env.DB.prepare('SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE book_slug = ?').bind(slug).first();
  return json({ reviews: results, avg_rating: avg?.avg || 0, total: avg?.cnt || 0 });
}

async function addReview(env, slug, body) {
  const { reader_id, reader_name, rating, content } = body;
  if (!reader_id || !rating) return json({ error: 'Missing fields' }, 400);
  if (rating < 1 || rating > 5) return json({ error: 'Rating must be 1-5' }, 400);

  try {
    // Ensure book record exists in D1 (auto-create for static books)
    await ensureBook(env, slug);

    // One review per reader per book
    await env.DB.prepare('DELETE FROM reviews WHERE book_slug = ? AND reader_id = ?').bind(slug, reader_id).run();
    await env.DB.prepare(
      'INSERT INTO reviews (book_slug, reader_id, reader_name, rating, content) VALUES (?, ?, ?, ?, ?)'
    ).bind(slug, reader_id, reader_name || 'Anonymous', rating, content || '').run();

    // Update book avg rating
    const avg = await env.DB.prepare('SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE book_slug = ?').bind(slug).first();
    await env.DB.prepare('UPDATE books SET rating = ?, reviews = ? WHERE slug = ?').bind(avg.avg || 0, avg.cnt || 0, slug).run();

    return json({ ok: true, avg_rating: avg.avg, total_reviews: avg.cnt });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

// Auto-create a minimal book record for static-site books
async function ensureBook(env, slug) {
  const existing = await env.DB.prepare('SELECT slug FROM books WHERE slug = ?').bind(slug).first();
  if (existing) return;
  await env.DB.prepare(
    'INSERT INTO books (slug, title, author, genre, tier, price, status, rating, reviews, chapters, wordCount, cover, free_chapters, description, published, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))'
  ).bind(slug, slug.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()), 'Unknown', 'default', 'free', 0, 'ongoing', 4.5, 0, 0, 0, '/images/covers/'+slug+'.png', 0, 'A FictionVerse original', 0).run();
}

// --- Reading Progress ---
async function saveProgress(env, body) {
  const { book_slug, reader_id, chapter_num, scroll_pos } = body;
  if (!book_slug || !reader_id) return json({ error: 'Missing fields' }, 400);
  await env.DB.prepare(
    'INSERT OR REPLACE INTO reading_progress (book_slug, reader_id, chapter_num, scroll_pos, updated_at) VALUES (?, ?, ?, ?, datetime(\'now\'))'
  ).bind(book_slug, reader_id, chapter_num || 1, scroll_pos || 0).run();
  return json({ ok: true });
}

async function getProgress(env, slug, request) {
  const url = new URL(request.url);
  const readerId = url.searchParams.get('reader_id') || 'anon';
  const row = await env.DB.prepare('SELECT * FROM reading_progress WHERE book_slug = ? AND reader_id = ?').bind(slug, readerId).first();
  return json(row || { chapter_num: 1, scroll_pos: 0 });
}

// ═══ Checkin & Points ═══
async function doCheckin(env, body) {
  const { reader_id } = body;
  if (!reader_id) return json({ error: 'Missing reader_id' }, 400);
  const today = new Date().toISOString().split('T')[0];

  // 检查今天是否已签到
  const existing = await env.DB.prepare('SELECT * FROM checkins WHERE reader_id = ? AND checkin_date = ?').bind(reader_id, today).first();
  if (existing) return json({ error: 'Already checked in today', streak: existing.streak, points: existing.points_earned });

  // 计算连续签到天数
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const lastCheckin = await env.DB.prepare('SELECT streak FROM checkins WHERE reader_id = ? AND checkin_date = ?').bind(reader_id, yesterday).first();
  const prevStreak = lastCheckin ? lastCheckin.streak : 0;
  const newStreak = prevStreak + 1;

  // 计算奖励：基础10分 + 连续加成（第2-7天每多连续+2，第7天额外+30）
  let bonus = 10;
  if (newStreak >= 7) bonus += 30;
  else if (newStreak >= 2) bonus += (newStreak - 1) * 2;

  // 插入签到记录
  await env.DB.prepare('INSERT INTO checkins (reader_id, checkin_date, streak, points_earned) VALUES (?, ?, ?, ?)').bind(reader_id, today, newStreak, bonus).run();

  // 更新积分和连续记录
  await env.DB.prepare(`
    INSERT INTO reader_points (reader_id, total_points, current_streak, longest_streak, last_checkin)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(reader_id) DO UPDATE SET
      total_points = total_points + ?,
      current_streak = ?,
      longest_streak = MAX(longest_streak, ?),
      last_checkin = ?,
      updated_at = datetime('now')
  `).bind(reader_id, bonus, newStreak, newStreak, today, bonus, newStreak, newStreak, today).run();

  return json({ ok: true, streak: newStreak, points_earned: bonus, streak_bonus: bonus - 10 });
}

async function getCheckinStatus(env, request) {
  const url = new URL(request.url);
  const readerId = url.searchParams.get('reader_id') || 'anon';
  const today = new Date().toISOString().split('T')[0];

  const [todayCheckin, recentCheckins, points] = await Promise.all([
    env.DB.prepare('SELECT * FROM checkins WHERE reader_id = ? AND checkin_date = ?').bind(readerId, today).first(),
    env.DB.prepare('SELECT checkin_date, streak, points_earned FROM checkins WHERE reader_id = ? ORDER BY checkin_date DESC LIMIT 7').bind(readerId).all(),
    env.DB.prepare('SELECT * FROM reader_points WHERE reader_id = ?').bind(readerId).first()
  ]);

  return json({
    checked_in_today: !!todayCheckin,
    today_points: todayCheckin ? todayCheckin.points_earned : 0,
    current_streak: points ? points.current_streak : 0,
    longest_streak: points ? points.longest_streak : 0,
    total_points: points ? points.total_points : 0,
    recent_checkins: (recentCheckins?.results || []).map(r => ({
      date: r.checkin_date,
      streak: r.streak,
      points: r.points_earned
    }))
  });
}

async function getPoints(env, request) {
  const url = new URL(request.url);
  const readerId = url.searchParams.get('reader_id') || 'anon';
  const p = await env.DB.prepare('SELECT * FROM reader_points WHERE reader_id = ?').bind(readerId).first();
  return json(p || { total_points: 0, current_streak: 0, longest_streak: 0 });
}

// ═══ Analytics ═══
async function trackPageview(env, body) {
  const { book_slug, chapter_num, reader_id } = body;
  if (!book_slug) return json({ ok: false });
  await env.DB.prepare(
    'INSERT INTO pageviews (book_slug, chapter_num, reader_id) VALUES (?, ?, ?)'
  ).bind(book_slug, chapter_num || 0, reader_id || 'anon').run();
  return json({ ok: true });
}

async function getBookAnalytics(env) {
  const { results: books } = await env.DB.prepare('SELECT slug, title FROM books').all();
  const data = [];
  for (const b of books) {
    const [readers, favs, revs, pvs] = await Promise.all([
      env.DB.prepare('SELECT COUNT(DISTINCT reader_id) as cnt FROM reading_progress WHERE book_slug = ?').bind(b.slug).first(),
      env.DB.prepare('SELECT COUNT(*) as cnt FROM favorites WHERE book_slug = ?').bind(b.slug).first(),
      env.DB.prepare('SELECT COUNT(*) as cnt, AVG(rating) as avg FROM reviews WHERE book_slug = ?').bind(b.slug).first(),
      env.DB.prepare('SELECT COUNT(*) as cnt FROM pageviews WHERE book_slug = ?').bind(b.slug).first()
    ]);
    data.push({
      slug: b.slug, title: b.title,
      readers: readers?.cnt || 0, favorites: favs?.cnt || 0,
      reviews: revs?.cnt || 0, avg_rating: revs?.avg || 0,
      pageviews: pvs?.cnt || 0
    });
  }
  return json(data);
}

async function getSingleBookAnalytics(env, slug) {
  const now = new Date();
  const days7 = new Date(now - 7*86400000).toISOString();
  const days30 = new Date(now - 30*86400000).toISOString();

  const [readers, favs, revs, pvs, pvs7, pvs30, progress, dailyPvs, retention] = await Promise.all([
    env.DB.prepare('SELECT COUNT(DISTINCT reader_id) as cnt FROM reading_progress WHERE book_slug = ?').bind(slug).first(),
    env.DB.prepare('SELECT COUNT(*) as cnt FROM favorites WHERE book_slug = ?').bind(slug).first(),
    env.DB.prepare('SELECT COUNT(*) as cnt, AVG(rating) as avg FROM reviews WHERE book_slug = ?').bind(slug).first(),
    env.DB.prepare('SELECT COUNT(*) as cnt FROM pageviews WHERE book_slug = ?').bind(slug).first(),
    env.DB.prepare('SELECT COUNT(*) as cnt FROM pageviews WHERE book_slug = ? AND created_at >= ?').bind(slug, days7).first(),
    env.DB.prepare('SELECT COUNT(*) as cnt FROM pageviews WHERE book_slug = ? AND created_at >= ?').bind(slug, days30).first(),
    env.DB.prepare('SELECT chapter_num, COUNT(*) as cnt FROM reading_progress WHERE book_slug = ? GROUP BY chapter_num ORDER BY chapter_num').bind(slug).all(),
    env.DB.prepare("SELECT date(created_at) as day, COUNT(*) as cnt FROM pageviews WHERE book_slug = ? AND created_at >= ? GROUP BY day ORDER BY day").bind(slug, days7).all(),
    env.DB.prepare("SELECT chapter_num, COUNT(DISTINCT reader_id) as readers FROM pageviews WHERE book_slug = ? AND chapter_num > 0 GROUP BY chapter_num ORDER BY chapter_num").bind(slug).all()
  ]);

  // 收藏趋势
  const favTrend = await env.DB.prepare("SELECT date(created_at) as day, COUNT(*) as cnt FROM favorites WHERE book_slug = ? AND created_at >= ? GROUP BY day ORDER BY day").bind(slug, days30).all();

  return json({
    readers: readers?.cnt || 0,
    favorites: favs?.cnt || 0,
    reviews: revs?.cnt || 0,
    avg_rating: revs?.avg || 0,
    pageviews_total: pvs?.cnt || 0,
    pageviews_7d: pvs7?.cnt || 0,
    pageviews_30d: pvs30?.cnt || 0,
    progress_distribution: (progress?.results || []).map(r => ({ chapter: r.chapter_num, readers: r.cnt })),
    daily_pageviews: dailyPvs?.results || [],
    chapter_retention: (retention?.results || []).map(r => ({ chapter: r.chapter_num, readers: r.readers })),
    favorite_trend: favTrend?.results || []
  });
}

// ═══ Forum ═══
async function listForumTopics(env, request) {
  const url = new URL(request.url);
  const bookSlug = url.searchParams.get('book') || '';
  const page = parseInt(url.searchParams.get('page')) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  let query, params;
  if (bookSlug) {
    query = 'SELECT * FROM forum_topics WHERE book_slug = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params = [bookSlug, limit, offset];
  } else {
    query = 'SELECT * FROM forum_topics ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params = [limit, offset];
  }
  const { results } = await env.DB.prepare(query).bind(...params).all();
  return json(results);
}

async function createForumTopic(env, body) {
  const { book_slug, reader_id, reader_name, title } = body;
  if (!reader_id || !title) return json({ error: 'Missing fields' }, 400);
  const { meta } = await env.DB.prepare(
    'INSERT INTO forum_topics (book_slug, reader_id, reader_name, title) VALUES (?, ?, ?, ?)'
  ).bind(book_slug || null, reader_id, reader_name || 'Anonymous', title).run();
  return json({ ok: true, id: meta.last_row_id });
}

async function getForumTopic(env, id) {
  const [topic, posts] = await Promise.all([
    env.DB.prepare('SELECT * FROM forum_topics WHERE id = ?').bind(id).first(),
    env.DB.prepare('SELECT * FROM forum_posts WHERE topic_id = ? ORDER BY created_at ASC').bind(id).all()
  ]);
  if (!topic) return json({ error: 'Not found' }, 404);
  return json({ ...topic, posts: posts?.results || [] });
}

async function addForumPost(env, topicId, body) {
  const { reader_id, reader_name, content } = body;
  if (!reader_id || !content) return json({ error: 'Missing fields' }, 400);
  await env.DB.prepare(
    'INSERT INTO forum_posts (topic_id, reader_id, reader_name, content) VALUES (?, ?, ?, ?)'
  ).bind(topicId, reader_id, reader_name || 'Anonymous', content).run();
  await env.DB.prepare(
    'UPDATE forum_topics SET reply_count = reply_count + 1, updated_at = datetime(\'now\') WHERE id = ?'
  ).bind(topicId).run();
  return json({ ok: true });
}

async function deleteForumTopic(env, id) {
  await env.DB.prepare('DELETE FROM forum_topics WHERE id = ?').bind(id).run();
  return json({ ok: true });
}

// ═══ Gifts ═══
async function listGifts(env, slug) {
  const [gifts, total] = await Promise.all([
    env.DB.prepare('SELECT * FROM gifts WHERE book_slug = ? ORDER BY created_at DESC LIMIT 50').bind(slug).all(),
    env.DB.prepare('SELECT SUM(points) as total FROM gifts WHERE book_slug = ?').bind(slug).first()
  ]);
  return json({ gifts: gifts?.results || [], total_points: total?.total || 0 });
}

async function sendGift(env, body) {
  const { book_slug, reader_id, reader_name, points, message } = body;
  if (!book_slug || !reader_id || !points || points < 1) return json({ error: 'Missing fields' }, 400);

  // 检查积分余额
  const bal = await env.DB.prepare('SELECT total_points FROM reader_points WHERE reader_id = ?').bind(reader_id).first();
  if (!bal || bal.total_points < points) return json({ error: 'Not enough points. Check in daily to earn more!' }, 400);

  // 扣积分
  await env.DB.prepare('UPDATE reader_points SET total_points = total_points - ?, updated_at = datetime(\'now\') WHERE reader_id = ?').bind(points, reader_id).run();

  // 记录礼物
  await env.DB.prepare('INSERT INTO gifts (book_slug, reader_id, reader_name, points, message) VALUES (?, ?, ?, ?, ?)').bind(book_slug, reader_id, reader_name || 'Anonymous', points, message || '').run();

  // 返回剩余积分
  const newBal = await env.DB.prepare('SELECT total_points FROM reader_points WHERE reader_id = ?').bind(reader_id).first();
  return json({ ok: true, remaining_points: newBal?.total_points || 0 });
}

// ═══ Email Notification Queue ═══
async function getEmailQueue(env, request) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status')||'pending';
  const { results } = await env.DB.prepare(
    'SELECT * FROM email_queue WHERE status=? ORDER BY created_at ASC LIMIT 50'
  ).bind(status).all();
  return json(results||[]);
}

async function markEmailSent(env, request, body) {
  const { ids } = body; // array of email queue IDs
  if (!ids||!Array.isArray(ids)||ids.length===0) return json({error:'Missing ids array'},400);
  const stmt = env.DB.prepare("UPDATE email_queue SET status='sent', sent_at=datetime('now') WHERE id=?");
  await env.DB.batch(ids.map(id=>stmt.bind(id)));
  return json({ok:true, marked:ids.length});
}

// ═══ Unpublished Section ═══
async function getUnpublished(env, request) {
  const { results } = await env.DB.prepare(
    'SELECT b.slug, b.title, b.author, b.genre, b.cover, b.cover_alt, b.description, COUNT(c.id) as total_chapters, MAX(c.updated_at) as last_updated FROM books b LEFT JOIN chapters c ON b.slug=c.book_slug AND c.published=0 WHERE b.publish_status=\'unpublished\' GROUP BY b.slug ORDER BY last_updated DESC'
  ).all();
  return json(results||[]);
}

// ═══ Author Resubmit ═══
async function resubmitChapter(env, slug, num, request, body) {
  const { content, title } = body;
  if (!content) return json({error:'Content required'},400);

  // Reset chapter to pending review
  await env.DB.prepare(
    "UPDATE chapters SET content=?, title=COALESCE(?,title), publish_status='pending_review', updated_at=datetime('now') WHERE book_slug=? AND number=?"
  ).bind(content, title, slug, num).run();

  // Re-add to review queue
  await env.DB.prepare(
    "INSERT INTO review_queue (book_slug, chapter_num, status, auto_review) VALUES (?, ?, 'pending', '{}') ON CONFLICT(book_slug, chapter_num) DO UPDATE SET status='pending', reviewed_by=NULL, ai_verdict=NULL, ai_score=0, ai_notes='', deadline=NULL, email_sent=0, created_at=datetime('now')"
  ).bind(slug, num).run();

  return json({ok:true, message:'Chapter resubmitted for review'});
}

// ═══ Auto-unpublish expired chapters ═══
async function autoUnpublishExpired(env, request) {
  // Find all rejected chapters past deadline
  const { results } = await env.DB.prepare(
    "SELECT book_slug, chapter_num FROM review_queue WHERE status='reviewed' AND ai_verdict='reject' AND deadline IS NOT NULL AND deadline < datetime('now') AND email_sent = 1"
  ).all();

  let moved = 0;
  for (const r of (results||[])) {
    // Move chapter to unpublished
    await env.DB.prepare(
      "UPDATE chapters SET publish_status='unpublished' WHERE book_slug=? AND number=?"
    ).bind(r.book_slug, r.chapter_num).run();
    moved++;
  }

  // Also check if any books have all chapters unpublished → mark book as unpublished
  if (moved > 0) {
    const books = await env.DB.prepare(
      "SELECT DISTINCT book_slug FROM review_queue WHERE status='reviewed' AND ai_verdict='reject' AND deadline IS NOT NULL AND deadline < datetime('now') AND email_sent = 1"
    ).all();
    for (const b of (books?.results||[])) {
      const [{ total, totalUnpub }] = await Promise.all([
        env.DB.prepare('SELECT COUNT(*) as cnt FROM chapters WHERE book_slug=?').bind(b.book_slug).first(),
        env.DB.prepare("SELECT COUNT(*) as cnt FROM chapters WHERE book_slug=? AND publish_status='unpublished'").bind(b.book_slug).first()
      ]);
      if (total?.cnt > 0 && totalUnpub?.cnt >= total.cnt) {
        await env.DB.prepare("UPDATE books SET publish_status='unpublished' WHERE slug=?").bind(b.book_slug).run();
      }
    }
  }

  return json({ok:true, chapters_moved: moved});
}

// Internal version for cron (no request param)
async function autoUnpublishExpiredInternal(env) {
  const { results } = await env.DB.prepare(
    "SELECT book_slug, chapter_num FROM review_queue WHERE status='reviewed' AND ai_verdict='reject' AND deadline IS NOT NULL AND deadline < datetime('now') AND email_sent >= 0"
  ).all();
  for (const r of (results||[])) {
    await env.DB.prepare(
      "UPDATE chapters SET publish_status='unpublished' WHERE book_slug=? AND number=?"
    ).bind(r.book_slug, r.chapter_num).run();
  }
  // Mark books as unpublished if all chapters rejected
  if (results?.length > 0) {
    const bookSlugs = [...new Set(results.map(r=>r.book_slug))];
    for (const slug of bookSlugs) {
      const total = await env.DB.prepare('SELECT COUNT(*) as cnt FROM chapters WHERE book_slug=?').bind(slug).first();
      const unpub = await env.DB.prepare("SELECT COUNT(*) as cnt FROM chapters WHERE book_slug=? AND publish_status='unpublished'").bind(slug).first();
      if (total?.cnt > 0 && unpub?.cnt >= total.cnt) {
        await env.DB.prepare("UPDATE books SET publish_status='unpublished' WHERE slug=?").bind(slug).run();
      }
    }
  }
}

// ═══ Email Builders ═══
function buildRejectEmail({authorName, bookTitle, chapterTitle, chapterNum, score, notes, deadline}) {
  return `Dear ${authorName},

Your chapter "${chapterTitle}" (Chapter ${chapterNum}) from "${bookTitle}" has been reviewed and requires revision.

=== Review Result ===
Score: ${score}/100
Verdict: REJECTED

=== Issues Found ===
${notes}

=== What You Need To Do ===
You have ${deadline} to revise and resubmit this chapter. 
If no revision is submitted within the deadline, the chapter will be moved to the unpublished section.

To resubmit:
1. Go to your Author Dashboard
2. Find the rejected chapter
3. Click "Edit & Resubmit"
4. Submit for re-review

=== Questions? ===
Reply to this email or visit our support page.

Best regards,
FictionVerse Review Team`;
}

function buildFlagEmail({authorName, bookTitle, chapterTitle, chapterNum, score, notes}) {
  return `Dear ${authorName},

Your chapter "${chapterTitle}" (Chapter ${chapterNum}) from "${bookTitle}" has been reviewed and flagged for attention.

=== Review Result ===
Score: ${score}/100
Verdict: FLAGGED

=== Areas of Concern ===
${notes}

=== What This Means ===
Your chapter is still published, but we recommend reviewing and improving the areas mentioned above. Flagged chapters may be subject to additional review in the future.

You can edit and improve this chapter at any time from your Author Dashboard.

Best regards,
FictionVerse Review Team`;
}

// ═══ Self-Migration (auto-schema upgrade) ═══
async function autoMigrate(env) {
  const migrations = [
    "ALTER TABLE review_queue ADD COLUMN deadline TEXT",
    "ALTER TABLE review_queue ADD COLUMN email_sent INTEGER DEFAULT 0",
    "ALTER TABLE chapters ADD COLUMN publish_status TEXT DEFAULT 'published'",
    "ALTER TABLE books ADD COLUMN publish_status TEXT DEFAULT 'published'",
    "ALTER TABLE books ADD COLUMN chapters INTEGER DEFAULT 0",
    "ALTER TABLE books ADD COLUMN wordCount INTEGER DEFAULT 0",
    `CREATE TABLE IF NOT EXISTS email_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_email TEXT NOT NULL,
      author_name TEXT NOT NULL,
      book_slug TEXT NOT NULL,
      book_title TEXT NOT NULL,
      chapter_num INTEGER NOT NULL,
      chapter_title TEXT NOT NULL,
      verdict TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      sent_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    "CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status)",
    "CREATE INDEX IF NOT EXISTS idx_email_queue_author ON email_queue(author_email, created_at)"
  ];
  for (const sql of migrations) {
    try { await env.DB.prepare(sql).run(); } catch(e) {
      // Ignore "duplicate column" or "already exists" errors
      if (!e.message.includes('duplicate')&&!e.message.includes('already exists')) {
        console.log('Migration note:', e.message);
      }
    }
  }
}

// ═══════════════ EXPORT ═══════════════

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  },

  // Cron trigger for scheduled publishing + auto-unpublish expired (runs every 5 min)
  async scheduled(event, env, ctx) {
    await checkScheduled(env);
    await autoUnpublishExpiredInternal(env);
  }
};
