// Seeds a handful of demo members so the app isn't empty on first run.
// Run with:  npm run seed
import bcrypt from 'bcryptjs';
import db from './db.js';

const demo = [
  {
    email: 'alex@example.com', name: 'Alex', birthdate: '1996-03-11', gender: 'Non-binary',
    pronouns: 'they/them', seeking: ['Woman', 'Man', 'Non-binary'], orientation: 'Queer',
    location: 'Los Angeles, USA',
    bio: 'Dog lover 🐶, coffee addict ☕, sunrise chaser 🌅, and always down for a deep conversation.',
    conditions: ['HIV'], undetectable: 1, verified: 1,
    interests: ['Hiking', 'Coffee', 'Music', 'Art', 'Yoga', 'Cooking'],
    lookingFor: ['A long-term relationship', 'New friendships'], emoji: '🌈',
  },
  {
    email: 'jordan@example.com', name: 'Jordan', birthdate: '1990-09-01', gender: 'Man',
    pronouns: 'he/him', seeking: ['Woman', 'Non-binary'], orientation: 'Bisexual',
    location: 'Los Angeles, USA',
    bio: 'Software dev by day, home cook by night. Living well and undetectable.',
    conditions: ['HIV'], undetectable: 1, verified: 1,
    interests: ['Hiking', 'Coffee', 'Music', 'Gaming', 'Foodie'],
    lookingFor: ['A long-term relationship'], emoji: '🎧',
  },
  {
    email: 'maya@example.com', name: 'Maya', birthdate: '1994-04-12', gender: 'Woman',
    pronouns: 'she/her', seeking: ['Man', 'Non-binary'], orientation: 'Bisexual',
    location: 'Austin, USA',
    bio: 'Yoga teacher, plant hoarder, and terrible at board games. HSV-2, stigma-free zone.',
    conditions: ['Herpes (HSV-2)'], undetectable: 0, verified: 1,
    interests: ['Yoga', 'Nature', 'Cooking', 'Travel', 'Dogs'],
    lookingFor: ['Community & support', 'New friendships'], emoji: '🌻',
  },
  {
    email: 'sam@example.com', name: 'Sam', birthdate: '1996-02-20', gender: 'Non-binary',
    pronouns: 'they/them', seeking: ['Woman', 'Non-binary', 'Man'], orientation: 'Pansexual',
    location: 'Portland, USA',
    bio: 'Illustrator and dog parent. Big believer in honesty and soft launches.',
    conditions: ['HPV'], undetectable: 0, verified: 0,
    interests: ['Art', 'Photography', 'Dogs', 'Movies', 'Live shows'],
    lookingFor: ['Something casual', 'New friendships'], emoji: '🦋',
  },
  {
    email: 'lena@example.com', name: 'Lena', birthdate: '1988-11-30', gender: 'Woman',
    pronouns: 'she/her', seeking: ['Woman'], orientation: 'Lesbian', location: 'Chicago, USA',
    bio: 'Nurse, marathoner, and matcha addict. HSV-1, managed and open about it.',
    conditions: ['Herpes (HSV-1)'], undetectable: 0, verified: 1,
    interests: ['Fitness', 'Reading', 'Coffee', 'Travel', 'Cooking'],
    lookingFor: ['A long-term relationship'], emoji: '🏃',
  },
  {
    email: 'theo@example.com', name: 'Theo', birthdate: '1992-07-08', gender: 'Man',
    pronouns: 'he/him', seeking: ['Woman', 'Non-binary'], orientation: 'Straight',
    location: 'Denver, USA',
    bio: 'Rock climber and amateur baker. Managing Hep B — happy to talk about it openly.',
    conditions: ['Hepatitis B'], undetectable: 0, verified: 0,
    interests: ['Fitness', 'Cooking', 'Nature', 'Music', 'Foodie'],
    lookingFor: ['A long-term relationship', 'New friendships'], emoji: '🧗',
  },
];

const insert = db.prepare(
  `INSERT OR IGNORE INTO users
    (email, password_hash, display_name, birthdate, gender, pronouns, seeking, orientation,
     location, bio, conditions, undetectable, interests, looking_for, verified, photo_emoji)
   VALUES (@email, @hash, @name, @birthdate, @gender, @pronouns, @seeking, @orientation,
     @location, @bio, @conditions, @undetectable, @interests, @looking_for, @verified, @emoji)`
);

let added = 0;
for (const d of demo) {
  const res = insert.run({
    ...d,
    hash: bcrypt.hashSync('password123', 10),
    seeking: JSON.stringify(d.seeking),
    conditions: JSON.stringify(d.conditions),
    interests: JSON.stringify(d.interests),
    looking_for: JSON.stringify(d.lookingFor),
  });
  if (res.changes) added++;
}

console.log(`Seeded ${added} demo members (password for all: "password123").`);
