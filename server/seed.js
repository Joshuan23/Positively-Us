// Seeds a handful of demo members so the app isn't empty on first run.
// Run with:  npm run seed
import bcrypt from 'bcryptjs';
import db from './db.js';

const demo = [
  {
    email: 'maya@example.com', name: 'Maya', birthdate: '1994-04-12', gender: 'Woman',
    seeking: ['Man', 'Non-binary'], orientation: 'Bisexual', location: 'Austin, USA',
    bio: 'Yoga teacher, plant hoarder, and terrible at board games. HSV-2 since college — no big deal to me anymore.',
    conditions: ['Herpes (HSV-2)'], emoji: '🌻',
  },
  {
    email: 'jordan@example.com', name: 'Jordan', birthdate: '1990-09-01', gender: 'Man',
    seeking: ['Woman'], orientation: 'Straight', location: 'Austin, USA',
    bio: 'Software dev by day, home cook by night. Living well with HIV (undetectable = untransmittable).',
    conditions: ['HIV'], emoji: '🎧',
  },
  {
    email: 'sam@example.com', name: 'Sam', birthdate: '1996-02-20', gender: 'Non-binary',
    seeking: ['Woman', 'Non-binary', 'Man'], orientation: 'Queer', location: 'Portland, USA',
    bio: 'Illustrator and dog parent. Big believer in honesty and soft launches.',
    conditions: ['HPV'], emoji: '🦋',
  },
  {
    email: 'lena@example.com', name: 'Lena', birthdate: '1988-11-30', gender: 'Woman',
    seeking: ['Woman'], orientation: 'Lesbian', location: 'Chicago, USA',
    bio: 'Nurse, marathoner, and matcha addict. HSV-1, managed and stigma-free here.',
    conditions: ['Herpes (HSV-1)'], emoji: '🌈',
  },
  {
    email: 'theo@example.com', name: 'Theo', birthdate: '1992-07-08', gender: 'Man',
    seeking: ['Woman', 'Non-binary'], orientation: 'Pansexual', location: 'Denver, USA',
    bio: 'Rock climber and amateur baker. Managing Hep B — happy to talk about it openly.',
    conditions: ['Hepatitis B'], emoji: '🔥',
  },
];

const insert = db.prepare(
  `INSERT OR IGNORE INTO users
    (email, password_hash, display_name, birthdate, gender, seeking, orientation, location, bio, conditions, photo_emoji)
   VALUES (@email, @hash, @name, @birthdate, @gender, @seeking, @orientation, @location, @bio, @conditions, @emoji)`
);

let added = 0;
for (const d of demo) {
  const res = insert.run({
    ...d,
    hash: bcrypt.hashSync('password123', 10),
    seeking: JSON.stringify(d.seeking),
    conditions: JSON.stringify(d.conditions),
  });
  if (res.changes) added++;
}

console.log(`Seeded ${added} demo members (password for all: "password123").`);
