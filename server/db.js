import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'positively-us.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name  TEXT NOT NULL,
    birthdate     TEXT NOT NULL,            -- YYYY-MM-DD, used to enforce 21+
    gender        TEXT NOT NULL,
    pronouns      TEXT DEFAULT '',
    seeking       TEXT NOT NULL,            -- JSON array of genders they're open to
    orientation   TEXT DEFAULT '',
    location      TEXT DEFAULT '',
    bio           TEXT DEFAULT '',
    conditions    TEXT NOT NULL,            -- JSON array; disclosure is REQUIRED
    undetectable  INTEGER DEFAULT 0,        -- U=U status (for members living with HIV)
    interests     TEXT DEFAULT '[]',        -- JSON array
    looking_for   TEXT DEFAULT '[]',        -- JSON array
    verified      INTEGER DEFAULT 0,
    photo_emoji   TEXT DEFAULT '🙂',
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS likes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    liker_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    likee_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_pass    INTEGER NOT NULL DEFAULT 0,  -- 0 = like, 1 = pass
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(liker_id, likee_id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body       TEXT NOT NULL,
    read_at    TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS visits (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    viewer_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(viewer_id, viewed_id)
  );

  CREATE INDEX IF NOT EXISTS idx_likes_likee ON likes(likee_id);
  CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages(sender_id, receiver_id);
  CREATE INDEX IF NOT EXISTS idx_visits_viewed ON visits(viewed_id);
`);

// --- Lightweight migrations for databases created by an earlier version -----
const cols = db.prepare(`PRAGMA table_info(users)`).all().map((c) => c.name);
const addColumn = (name, ddl) => {
  if (!cols.includes(name)) db.exec(`ALTER TABLE users ADD COLUMN ${ddl}`);
};
addColumn('pronouns', `pronouns TEXT DEFAULT ''`);
addColumn('undetectable', `undetectable INTEGER DEFAULT 0`);
addColumn('interests', `interests TEXT DEFAULT '[]'`);
addColumn('looking_for', `looking_for TEXT DEFAULT '[]'`);
addColumn('verified', `verified INTEGER DEFAULT 0`);

const msgCols = db.prepare(`PRAGMA table_info(messages)`).all().map((c) => c.name);
if (!msgCols.includes('read_at')) db.exec(`ALTER TABLE messages ADD COLUMN read_at TEXT`);

export default db;
