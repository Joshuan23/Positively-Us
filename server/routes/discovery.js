import express from 'express';
import db from '../db.js';
import { requireAuth } from '../auth.js';
import { ageFromBirthdate } from '../domain.js';

const router = express.Router();

function card(u) {
  return {
    id: u.id,
    displayName: u.display_name,
    age: ageFromBirthdate(u.birthdate),
    gender: u.gender,
    orientation: u.orientation,
    location: u.location,
    bio: u.bio,
    conditions: JSON.parse(u.conditions || '[]'),
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
    // Show people whose gender I'm open to, and who are open to my gender.
    const theirSeeking = JSON.parse(u.seeking || '[]');
    const iWantThem = mySeeking.length === 0 || mySeeking.includes(u.gender);
    const theyWantMe = theirSeeking.length === 0 || theirSeeking.includes(me.gender);
    return iWantThem && theyWantMe;
  });

  res.json({ candidates: candidates.map(card) });
});

export default router;
