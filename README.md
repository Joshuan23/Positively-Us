# 💜 Positively Us

An inclusive, stigma-free dating app for adults living with STDs / STIs.

Positively Us is built around one simple idea: the hardest part of dating with
an STD is *the disclosure conversation*. So here, disclosure is built into the
product. Every member shares their status when they join, it lives on their
profile, and you only ever see people who've done the same. No awkward reveal,
no guessing — just people meeting people.

## Core principles

- **Everyone is welcome.** All genders, orientations, and backgrounds.
- **Disclosure is required.** You must share at least one condition (or your own
  brief note) to create a profile. It can be edited, but never emptied.
- **21+ only.** Age is confirmed at signup and enforced from date of birth.
- **Match before you chat.** Messaging unlocks only after a mutual like, so
  conversations are consensual from the start.

## Features

- Email/password accounts with hashed passwords (bcrypt) and JWT session cookies
- Signup with a **21+ age gate** (explicit confirmation **and** birthdate check)
- **Required, structured health disclosure** from a curated condition list, plus
  a free-text "Other" option
- **U=U (Undetectable = Untransmittable)** status for members living with HIV,
  shown as a badge across the app
- Rich profiles: pronouns, orientation, interests, "looking for", verified badge,
  and an avatar
- **Home dashboard** with a greeting, live stats (who likes you, matches,
  visitors), a Community Spotlight and upcoming events
- Swipe-style **Discover** that respects mutual gender preferences
- Mutual-like matching with an **"It's a Match!"** celebration that surfaces
  shared interests
- Match-gated one-to-one **messaging** with a stories row, search, unread badges,
  and read receipts
- A **Community** section: events, HIV/U=U education & support resources, and groups
- Mobile-app UI: deep-navy theme, pink→purple gradient, dual-heart logo, and a
  bottom navigation bar (Home · Discover · Community · Messages · Profile)

## Tech

- **Backend:** Node.js + Express + SQLite (`better-sqlite3`)
- **Auth:** `bcryptjs` + `jsonwebtoken` (httpOnly cookie), rate-limited auth routes
- **Frontend:** dependency-free vanilla-JS single-page app (no build step)

## Getting started

```bash
npm install
npm run seed     # optional: adds 5 demo members (password: "password123")
npm start        # http://localhost:3000
```

Then open http://localhost:3000, create an account (you'll need to confirm
you're 21+ and disclose a status), and start discovering. If you seeded the
demo data, you can also sign in as e.g. `maya@example.com` / `password123`.

## Project layout

```
server/
  index.js          Express app + static hosting
  db.js             SQLite schema
  domain.js         Age helper, condition & gender lists
  auth.js           JWT + cookie + requireAuth middleware
  seed.js           Demo data
  routes/
    auth.js         register / login / logout / me / update
    discovery.js    candidate feed (preference-aware) + home dashboard stats
    matches.js      like / pass / mutual matches / shared interests
    messages.js     match-gated messaging + read receipts
    community.js    events, resources (U=U/HIV education), groups
public/
  index.html, styles.css, app.js   the SPA
```

## Notes & disclaimers

This is a demo/reference application, not medical or legal advice. A real
production deployment for this sensitive a use case would additionally need:
proper identity/age verification, robust privacy controls and data encryption,
content moderation and reporting/blocking, HTTPS + a strong `JWT_SECRET`
(via env var), and review against applicable health-data and dating-platform
regulations.

Set a strong secret in production:

```bash
JWT_SECRET="$(openssl rand -hex 32)" NODE_ENV=production npm start
```
