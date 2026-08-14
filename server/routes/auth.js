import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { signToken, setAuthCookie, clearAuthCookie, requireAuth } from '../auth.js';
import { isAdult21, ageFromBirthdate, CONDITIONS, GENDERS, UU_CONDITION } from '../domain.js';

const router = express.Router();

const arr = (v) => (Array.isArray(v) ? v.filter(Boolean) : []);

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    displayName: u.display_name,
    age: ageFromBirthdate(u.birthdate),
    gender: u.gender,
    pronouns: u.pronouns || '',
    seeking: JSON.parse(u.seeking || '[]'),
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

router.post('/register', (req, res) => {
  const {
    email,
    password,
    displayName,
    birthdate,
    gender,
    pronouns = '',
    seeking,
    orientation = '',
    location = '',
    bio = '',
    conditions,
    undetectable = false,
    interests = [],
    lookingFor = [],
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

  const seekingArr = arr(seeking);
  if (seekingArr.length === 0) {
    return res.status(400).json({ error: 'Please choose who you are open to meeting.' });
  }

  // Health disclosure is REQUIRED — core to the platform's purpose.
  const conditionsArr = arr(conditions);
  if (conditionsArr.length === 0) {
    return res.status(400).json({
      error:
        'Disclosure is required. Please share at least one status (or your own note) so members can make informed, respectful choices.',
    });
  }
  if (conditionsArr.some((c) => !CONDITIONS.includes(c) && c.length > 60)) {
    return res.status(400).json({ error: 'A disclosure entry is too long.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }

  const uu = conditionsArr.includes(UU_CONDITION) && undetectable ? 1 : 0;
  const hash = bcrypt.hashSync(String(password), 10);
  const info = db
    .prepare(
      `INSERT INTO users
        (email, password_hash, display_name, birthdate, gender, pronouns, seeking,
         orientation, location, bio, conditions, undetectable, interests, looking_for, photo_emoji)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      email.toLowerCase(),
      hash,
      String(displayName).slice(0, 40),
      birthdate,
      gender,
      String(pronouns).slice(0, 20),
      JSON.stringify(seekingArr),
      String(orientation).slice(0, 40),
      String(location).slice(0, 80),
      String(bio).slice(0, 600),
      JSON.stringify(conditionsArr),
      uu,
      JSON.stringify(arr(interests).slice(0, 12)),
      JSON.stringify(arr(lookingFor).slice(0, 6)),
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
  const b = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  // Disclosure remains required — can be edited but not emptied.
  let conditionsJson = user.conditions;
  if (b.conditions !== undefined) {
    const c = arr(b.conditions);
    if (c.length === 0) {
      return res.status(400).json({ error: 'Disclosure cannot be removed entirely.' });
    }
    conditionsJson = JSON.stringify(c);
  }
  const conditionsNow = JSON.parse(conditionsJson);

  let seekingJson = user.seeking;
  if (b.seeking !== undefined) {
    const s = arr(b.seeking);
    if (s.length === 0) {
      return res.status(400).json({ error: 'Please choose who you are open to meeting.' });
    }
    seekingJson = JSON.stringify(s);
  }

  const uu =
    (b.undetectable !== undefined ? !!b.undetectable : !!user.undetectable) &&
    conditionsNow.includes(UU_CONDITION)
      ? 1
      : 0;

  db.prepare(
    `UPDATE users SET
       bio = ?, location = ?, orientation = ?, pronouns = ?, seeking = ?, conditions = ?,
       undetectable = ?, interests = ?, looking_for = ?, photo_emoji = ?
     WHERE id = ?`
  ).run(
    b.bio !== undefined ? String(b.bio).slice(0, 600) : user.bio,
    b.location !== undefined ? String(b.location).slice(0, 80) : user.location,
    b.orientation !== undefined ? String(b.orientation).slice(0, 40) : user.orientation,
    b.pronouns !== undefined ? String(b.pronouns).slice(0, 20) : user.pronouns,
    seekingJson,
    conditionsJson,
    uu,
    b.interests !== undefined ? JSON.stringify(arr(b.interests).slice(0, 12)) : user.interests,
    b.lookingFor !== undefined ? JSON.stringify(arr(b.lookingFor).slice(0, 6)) : user.looking_for,
    b.photoEmoji !== undefined ? String(b.photoEmoji).slice(0, 8) || '🙂' : user.photo_emoji,
    req.userId
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  res.json({ user: publicUser(updated) });
});

export { router, publicUser };
