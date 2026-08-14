import express from 'express';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { router as authRouter } from './routes/auth.js';
import discoveryRouter from './routes/discovery.js';
import matchesRouter from './routes/matches.js';
import messagesRouter from './routes/messages.js';
import { CONDITIONS, GENDERS, MIN_AGE } from './domain.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// Basic protection against brute-force on auth endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

// Public metadata used to build the signup form (condition list, genders, age).
app.get('/api/meta', (req, res) => {
  res.json({ conditions: CONDITIONS, genders: GENDERS, minAge: MIN_AGE });
});

app.use('/api/auth', authLimiter, authRouter);
app.use('/api', discoveryRouter);
app.use('/api', matchesRouter);
app.use('/api', messagesRouter);

// Serve the static single-page frontend.
app.use(express.static(path.join(__dirname, '..', 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  💜 Positively Us running at http://localhost:${PORT}`);
  console.log(`     Inclusive dating for people living with STDs/STIs. ${MIN_AGE}+ only.\n`);
});
