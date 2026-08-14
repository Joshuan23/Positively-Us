import express from 'express';
import db from '../db.js';
import { requireAuth } from '../auth.js';
import { ageFromBirthdate } from '../domain.js';

const router = express.Router();

const recordVisit = db.prepare(
  `INSERT OR IGNORE INTO visits (viewer_id, viewed_id) VALUES (?, ?)`
);

// Like or pass on a member. A mutual like creates a match.
router.post('/likes', requireAuth, (req, res) => {
  const { userId, pass } = req.body || {};
  const likeeId = Number(userId);
  if (!likeeId || likeeId === req.userId) {
    return res.status(400).json({ error: 'Invalid target user.' });
  }
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(likeeId);
  if (!target) return res.status(404).json({ error: 'User not found.' });

  // Acting on a card counts as having viewed that member's profile.
  recordVisit.run(req.userId, likeeId);

  db.prepare(
    `INSERT INTO likes (liker_id, likee_id, is_pass)
     VALUES (?, ?, ?)
     ON CONFLICT(liker_id, likee_id) DO UPDATE SET is_pass = excluded.is_pass`
  ).run(req.userId, likeeId, pass ? 1 : 0);

  let matched = false;
  let matchUser = null;
  if (!pass) {
    const reciprocal = db
      .prepare('SELECT id FROM likes WHERE liker_id = ? AND likee_id = ? AND is_pass = 0')
      .get(likeeId, req.userId);
    matched = !!reciprocal;
    if (matched) {
      const me = db.prepare('SELECT interests FROM users WHERE id = ?').get(req.userId);
      const myInterests = JSON.parse(me.interests || '[]');
      const theirInterests = JSON.parse(target.interests || '[]');
      const shared = myInterests.filter((i) => theirInterests.includes(i));
      matchUser = {
        id: target.id,
        displayName: target.display_name,
        photoEmoji: target.photo_emoji,
        sharedInterests: shared,
      };
    }
  }
  res.json({ ok: true, matched, matchUser });
});

// All mutual matches for the current user.
router.get('/matches', requireAuth, (req, res) => {
  const me = db.prepare('SELECT interests FROM users WHERE id = ?').get(req.userId);
  const myInterests = JSON.parse(me?.interests || '[]');

  const rows = db
    .prepare(
      `SELECT u.* FROM users u
       JOIN likes mine  ON mine.likee_id = u.id AND mine.liker_id = ? AND mine.is_pass = 0
       JOIN likes yours ON yours.liker_id = u.id AND yours.likee_id = ? AND yours.is_pass = 0
       ORDER BY u.display_name`
    )
    .all(req.userId, req.userId);

  const matches = rows.map((u) => {
    const last = db
      .prepare(
        `SELECT body, created_at FROM messages
         WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
         ORDER BY created_at DESC LIMIT 1`
      )
      .get(req.userId, u.id, u.id, req.userId);
    const unread = db
      .prepare(
        'SELECT COUNT(*) n FROM messages WHERE sender_id = ? AND receiver_id = ? AND read_at IS NULL'
      )
      .get(u.id, req.userId).n;
    const theirInterests = JSON.parse(u.interests || '[]');
    return {
      id: u.id,
      displayName: u.display_name,
      age: ageFromBirthdate(u.birthdate),
      gender: u.gender,
      pronouns: u.pronouns || '',
      location: u.location,
      conditions: JSON.parse(u.conditions || '[]'),
      undetectable: !!u.undetectable,
      verified: !!u.verified,
      photoEmoji: u.photo_emoji,
      sharedInterests: myInterests.filter((i) => theirInterests.includes(i)),
      lastMessage: last ? last.body : null,
      lastMessageAt: last ? last.created_at : null,
      unread,
    };
  });
  res.json({ matches });
});

export default router;
