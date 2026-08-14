import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { signToken, setAuthCookie, clearAuthCookie, requireAuth } from '../auth.js';
import { isAdult21, CONDITIONS, GENDERS } from '../domain.js';

const router = express.Router();

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    displayName: u.display_name,
    gender: u.gender,
    seeking: JSON.parse(u.seeking || '[]'),
    orientation: u.orientation,
    location: u.location,
    bio: u.bio,
    conditions: JSON.parse(u.conditions || '[]'),
    photoEmoji: u.photo_emoji,
  };
}

router.post('/register', (req, res) => {
  const {
    email,
    password,
    displayName,
    birthdate,
    gender,
    seeking,
    orientation = '',
    location = '',
    bio = '',
    conditions,
    photoEmoji = '🙂',
    ageConfirm,
  } = req.body || {};

  // --- Validation --------------------------------------------------------
  if (!email || !password || !displayName || !birthdate || !gender) {
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  // 21+ age gate — enforced both by explicit confirmation and by birthdate.
  if (!ageConfirm) {
    return res.status(400).json({ error: 'You must confirm you are 21 or older.' });
  }
  if (!isAdult21(birthdate)) {
    return res.status(403).json({
      error: 'You must be at least 21 years old to join Positively Us.',
    });
  }

  if (!GENDERS.includes(gender)) {
    return res.status(400).json({ error: 'Please select a valid gender.' });
  }

  const seekingArr = Array.isArray(seeking) ? seeking : [];
  if (seekingArr.length === 0) {
    return res.status(400).json({ error: 'Please choose who you are open to meeting.' });
  }

  // Health disclosure is REQUIRED — core to the platform's purpose.
  const conditionsArr = Array.isArray(conditions) ? conditions.filter(Boolean) : [];
  if (conditionsArr.length === 0) {
    return res.status(400).json({
      error:
        'Disclosure is required. Please share at least one condition (or your own note) so members can make informed, respectful choices.',
    });
  }
  const invalid = conditionsArr.filter(
    (c) => !CONDITIONS.includes(c) && c.length > 60
  );
  if (invalid.length) {
    return res.status(400).json({ error: 'A disclosure entry is too long.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }

  const hash = bcrypt.hashSync(String(password), 10);
  const info = db
    .prepare(
      `INSERT INTO users
        (email, password_hash, display_name, birthdate, gender, seeking,
         orientation, location, bio, conditions, photo_emoji)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      email.toLowerCase(),
      hash,
      String(displayName).slice(0, 40),
      birthdate,
      gender,
      JSON.stringify(seekingArr),
      String(orientation).slice(0, 40),
      String(location).slice(0, 80),
      String(bio).slice(0, 600),
      JSON.stringify(conditionsArr),
      String(photoEmoji).slice(0, 8) || '🙂'
    );

  const token = signToken(info.lastInsertRowid);
  setAuthCookie(res, token);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase());
  if (!user || !bcrypt.compareSync(String(password), user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }
  const token = signToken(user.id);
  setAuthCookie(res, token);
  res.json({ user: publicUser(user) });
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: publicUser(user) });
});

router.patch('/me', requireAuth, (req, res) => {
  const { bio, location, orientation, seeking, conditions, photoEmoji } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  // Disclosure remains required — can be edited but not emptied.
  let conditionsJson = user.conditions;
  if (conditions !== undefined) {
    const arr = Array.isArray(conditions) ? conditions.filter(Boolean) : [];
    if (arr.length === 0) {
      return res.status(400).json({ error: 'Disclosure cannot be removed entirely.' });
    }
    conditionsJson = JSON.stringify(arr);
  }

  let seekingJson = user.seeking;
  if (seeking !== undefined) {
    const arr = Array.isArray(seeking) ? seeking : [];
    if (arr.length === 0) {
      return res.status(400).json({ error: 'Please choose who you are open to meeting.' });
    }
    seekingJson = JSON.stringify(arr);
  }

  db.prepare(
    `UPDATE users SET
       bio = ?, location = ?, orientation = ?, seeking = ?, conditions = ?, photo_emoji = ?
     WHERE id = ?`
  ).run(
    bio !== undefined ? String(bio).slice(0, 600) : user.bio,
    location !== undefined ? String(location).slice(0, 80) : user.location,
    orientation !== undefined ? String(orientation).slice(0, 40) : user.orientation,
    seekingJson,
    conditionsJson,
    photoEmoji !== undefined ? String(photoEmoji).slice(0, 8) || '🙂' : user.photo_emoji,
    req.userId
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  res.json({ user: publicUser(updated) });
});

export { router, publicUser };
