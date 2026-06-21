-- FictionVerse D1 Schema
-- Run: wrangler d1 execute fiction-verse-db --file=./schema.sql

CREATE TABLE IF NOT EXISTS authors (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS books (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  author_bio TEXT DEFAULT '',
  genre TEXT NOT NULL DEFAULT 'xianxia',
  genres TEXT DEFAULT '[]',
  tier TEXT NOT NULL DEFAULT 'paid',
  price REAL NOT NULL DEFAULT 4.99,
  status TEXT NOT NULL DEFAULT 'ongoing',
  rating REAL NOT NULL DEFAULT 4.5,
  reviews INTEGER NOT NULL DEFAULT 0,
  cover TEXT NOT NULL DEFAULT '/images/covers/default.png',
  cover_alt TEXT DEFAULT '',
  free_chapters INTEGER NOT NULL DEFAULT 5,
  description TEXT DEFAULT '',
  published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_slug TEXT NOT NULL REFERENCES books(slug) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  word_count INTEGER NOT NULL DEFAULT 2000,
  scheduled_at TEXT,
  published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(book_slug, number)
);

CREATE INDEX IF NOT EXISTS idx_chapters_book ON chapters(book_slug, number);
CREATE INDEX IF NOT EXISTS idx_books_published ON books(published);
CREATE INDEX IF NOT EXISTS idx_chapters_published ON chapters(book_slug, published);

-- ═══ Reader System v2 ═══
CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_slug TEXT NOT NULL REFERENCES books(slug) ON DELETE CASCADE,
  reader_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(book_slug, reader_id)
);
CREATE INDEX IF NOT EXISTS idx_favorites_reader ON favorites(reader_id);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_slug TEXT NOT NULL REFERENCES books(slug) ON DELETE CASCADE,
  reader_id TEXT NOT NULL,
  reader_name TEXT NOT NULL DEFAULT 'Anonymous',
  rating INTEGER NOT NULL CHECK(rating>=1 AND rating<=5),
  content TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_reviews_book ON reviews(book_slug);
CREATE INDEX IF NOT EXISTS idx_reviews_reader ON reviews(reader_id);

CREATE TABLE IF NOT EXISTS reading_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_slug TEXT NOT NULL REFERENCES books(slug) ON DELETE CASCADE,
  reader_id TEXT NOT NULL,
  chapter_num INTEGER NOT NULL DEFAULT 1,
  scroll_pos REAL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(book_slug, reader_id)
);

-- ═══ Engagement System ═══
CREATE TABLE IF NOT EXISTS checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reader_id TEXT NOT NULL,
  checkin_date TEXT NOT NULL,
  streak INTEGER NOT NULL DEFAULT 1,
  points_earned INTEGER NOT NULL DEFAULT 10,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(reader_id, checkin_date)
);
CREATE INDEX IF NOT EXISTS idx_checkins_reader ON checkins(reader_id, checkin_date);

CREATE TABLE IF NOT EXISTS reader_points (
  reader_id TEXT PRIMARY KEY,
  total_points INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_checkin TEXT,
  chapters_read INTEGER NOT NULL DEFAULT 0,
  reviews_written INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ═══ Forum ═══
CREATE TABLE IF NOT EXISTS forum_topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_slug TEXT,
  reader_id TEXT NOT NULL,
  reader_name TEXT NOT NULL DEFAULT 'Anonymous',
  title TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  reply_count INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_forum_book ON forum_topics(book_slug);
CREATE INDEX IF NOT EXISTS idx_forum_latest ON forum_topics(updated_at DESC);

CREATE TABLE IF NOT EXISTS forum_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id INTEGER NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
  reader_id TEXT NOT NULL,
  reader_name TEXT NOT NULL DEFAULT 'Anonymous',
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_forum_posts_topic ON forum_posts(topic_id);

-- ═══ Gifts ═══
CREATE TABLE IF NOT EXISTS gifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_slug TEXT NOT NULL REFERENCES books(slug) ON DELETE CASCADE,
  reader_id TEXT NOT NULL,
  reader_name TEXT NOT NULL DEFAULT 'Anonymous',
  points INTEGER NOT NULL,
  message TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_gifts_book ON gifts(book_slug);

-- ═══ Pageview Tracking ═══
CREATE TABLE IF NOT EXISTS pageviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_slug TEXT NOT NULL,
  chapter_num INTEGER DEFAULT 0,
  reader_id TEXT DEFAULT 'anon',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pageviews_book ON pageviews(book_slug, created_at);
CREATE INDEX IF NOT EXISTS idx_pageviews_chapter ON pageviews(book_slug, chapter_num, created_at);

-- ═══ API Tokens ═══
CREATE TABLE IF NOT EXISTS api_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  label TEXT DEFAULT 'Default',
  scope TEXT NOT NULL DEFAULT 'full',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_used TEXT
);
CREATE INDEX IF NOT EXISTS idx_tokens_author ON api_tokens(author_email);
CREATE INDEX IF NOT EXISTS idx_tokens_token ON api_tokens(token);

-- ═══ AI Review Queue ═══
CREATE TABLE IF NOT EXISTS review_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_slug TEXT NOT NULL,
  chapter_num INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  auto_review TEXT DEFAULT '{}',
  ai_verdict TEXT,
  ai_score INTEGER DEFAULT 0,
  ai_notes TEXT DEFAULT '',
  reviewed_by TEXT DEFAULT '',
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(book_slug, chapter_num)
);
CREATE INDEX IF NOT EXISTS idx_review_queue_status ON review_queue(status);

-- v3: deadline + email notification
ALTER TABLE review_queue ADD COLUMN deadline TEXT;
ALTER TABLE review_queue ADD COLUMN email_sent INTEGER DEFAULT 0;
ALTER TABLE chapters ADD COLUMN publish_status TEXT DEFAULT 'published';
ALTER TABLE books ADD COLUMN publish_status TEXT DEFAULT 'published';

-- v4: book stats columns (for updateBookStats after chapter CRUD)
ALTER TABLE books ADD COLUMN chapters INTEGER DEFAULT 0;
ALTER TABLE books ADD COLUMN wordCount INTEGER DEFAULT 0;

-- ═══ Email Notification Queue ═══
CREATE TABLE IF NOT EXISTS email_queue (
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
);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_author ON email_queue(author_email, created_at);
