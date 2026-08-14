import express from 'express';
import db from '../db.js';
import { requireAuth } from '../auth.js';

const router = express.Router();

// Two users may only message each other once they have mutually matched.
function areMatched(a, b) {
  const mine = db
    .prepare('SELECT id FROM likes WHERE liker_id = ? AND likee_id = ? AND is_pass = 0')
    .get(a, b);
  const yours = db
    .prepare('SELECT id FROM likes WHERE liker_id = ? AND likee_id = ? AND is_pass = 0')
    .get(b, a);
  return !!(mine && yours);
}

router.get('/messages/:userId', requireAuth, (req, res) => {
  const otherId = Number(req.params.userId);
  if (!otherId) return res.status(400).json({ error: 'Invalid user.' });
  if (!areMatched(req.userId, otherId)) {
    return res.status(403).json({ error: 'You can only message people you have matched with.' });
  }
  // Mark the other person's messages to me as read.
  db.prepare(
    `UPDATE messages SET read_at = datetime('now')
     WHERE sender_id = ? AND receiver_id = ? AND read_at IS NULL`
  ).run(otherId, req.userId);
  const rows = db
    .prepare(
      `SELECT id, sender_id, receiver_id, body, created_at FROM messages
       WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
       ORDER BY created_at ASC`
    )
    .all(req.userId, otherId, otherId, req.userId);
  res.json({
    messages: rows.map((m) => ({
      id: m.id,
      fromMe: m.sender_id === req.userId,
      body: m.body,
      createdAt: m.created_at,
    })),
  });
});

router.post('/messages/:userId', requireAuth, (req, res) => {
  const otherId = Number(req.params.userId);
  const body = String(req.body?.body || '').trim();
  if (!otherId) return res.status(400).json({ error: 'Invalid user.' });
  if (!body) return res.status(400).json({ error: 'Message cannot be empty.' });
  if (body.length > 2000) return res.status(400).json({ error: 'Message is too long.' });
  if (!areMatched(req.userId, otherId)) {
    return res.status(403).json({ error: 'You can only message people you have matched with.' });
  }
  const info = db
    .prepare('INSERT INTO messages (sender_id, receiver_id, body) VALUES (?, ?, ?)')
    .run(req.userId, otherId, body);
  const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({
    message: { id: msg.id, fromMe: true, body: msg.body, createdAt: msg.created_at },
  });
});

export default router;
