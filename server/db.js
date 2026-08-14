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
    seeking       TEXT NOT NULL,            -- JSON array of genders they're open to
    orientation   TEXT DEFAULT '',
    location      TEXT DEFAULT '',
    bio           TEXT DEFAULT '',
    conditions    TEXT NOT NULL,            -- JSON array; disclosure is REQUIRED
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
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_likes_likee ON likes(likee_id);
  CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages(sender_id, receiver_id);
`);

export default db;
