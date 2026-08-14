import express from 'express';
import db from '../db.js';
import { requireAuth } from '../auth.js';
import { ageFromBirthdate } from '../domain.js';

const router = express.Router();

// Public-facing profile card (never exposes email/password).
export function card(u) {
  return {
    id: u.id,
    displayName: u.display_name,
    age: ageFromBirthdate(u.birthdate),
    gender: u.gender,
    pronouns: u.pronouns || '',
    orientation: u.orientation,
    location: u.location,
    bio: u.bio,
    conditions: JSON.parse(u.conditions || '[]'),
    undetectable: !!u.undetectable,
    interests: JSON.parse(u.interests || '[]'),
    lookingFor: JSON.parse(u.looking_for || '[]'),
    verified: !!u.verified,
    photoEmoji: u.photo_emoji,
  };
}

// Candidates the current user hasn't liked or passed yet, respecting the
// mutual "seeking" preference where possible.
router.get('/discovery', requireAuth, (req, res) => {
  const me = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!me) return res.status(404).json({ error: 'User not found.' });
  const mySeeking = JSON.parse(me.seeking || '[]');

  const rows = db
    .prepare(
      `SELECT * FROM users
       WHERE id != ?
         AND id NOT IN (SELECT likee_id FROM likes WHERE liker_id = ?)
       ORDER BY created_at DESC`
    )
    .all(req.userId, req.userId);

  const candidates = rows.filter((u) => {
    const theirSeeking = JSON.parse(u.seeking || '[]');
    const iWantThem = mySeeking.length === 0 || mySeeking.includes(u.gender);
    const theyWantMe = theirSeeking.length === 0 || theirSeeking.includes(me.gender);
    return iWantThem && theyWantMe;
  });

  res.json({ candidates: candidates.map(card) });
});

// Home dashboard summary: greeting counts + spotlight content.
router.get('/dashboard', requireAuth, (req, res) => {
  const me = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!me) return res.status(404).json({ error: 'User not found.' });

  // People who liked me that I haven't liked/passed back yet.
  const whoLikesYou = db
    .prepare(
      `SELECT COUNT(*) n FROM likes l
       WHERE l.likee_id = ? AND l.is_pass = 0
         AND l.liker_id NOT IN (SELECT likee_id FROM likes WHERE liker_id = ?)`
    )
    .get(req.userId, req.userId).n;

  const matches = db
    .prepare(
      `SELECT COUNT(*) n FROM likes mine
       JOIN likes yours ON yours.liker_id = mine.likee_id AND yours.likee_id = mine.liker_id
       WHERE mine.liker_id = ? AND mine.is_pass = 0 AND yours.is_pass = 0`
    )
    .get(req.userId).n;

  const visitors = db
    .prepare('SELECT COUNT(*) n FROM visits WHERE viewed_id = ?')
    .get(req.userId).n;

  const unread = db
    .prepare('SELECT COUNT(*) n FROM messages WHERE receiver_id = ? AND read_at IS NULL')
    .get(req.userId).n;

  res.json({
    displayName: me.display_name,
    stats: { whoLikesYou, matches, visitors, unread },
  });
});

export default router;
