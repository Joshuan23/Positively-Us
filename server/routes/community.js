import express from 'express';
import { requireAuth } from '../auth.js';

const router = express.Router();

// Curated community content shown on the Home and Community screens.
// Static for this reference build; a production app would store & manage these.
const EVENTS = [
  {
    id: 'mixer-05',
    emoji: '🎉',
    title: 'Positively Us Virtual Mixer',
    date: 'May 25 · 7:00 PM',
    blurb: 'Make friends. Have fun. A relaxed video hangout — no pressure, all welcome.',
    tag: 'Social',
  },
  {
    id: 'uu-talk',
    emoji: '💬',
    title: 'U=U: Ask the Experts',
    date: 'Jun 3 · 6:00 PM',
    blurb: 'A live Q&A with an HIV specialist on Undetectable = Untransmittable.',
    tag: 'Education',
  },
  {
    id: 'support-circle',
    emoji: '🫂',
    title: 'Newly Diagnosed Support Circle',
    date: 'Jun 8 · 5:30 PM',
    blurb: 'A warm, moderated peer space for anyone recently diagnosed.',
    tag: 'Support',
  },
  {
    id: 'walk',
    emoji: '🌳',
    title: 'Community Walk & Coffee',
    date: 'Jun 15 · 10:00 AM',
    blurb: 'Meet members in person for an easy morning walk and coffee.',
    tag: 'Social',
  },
];

const RESOURCES = [
  {
    id: 'uu',
    emoji: '💜',
    title: 'U=U: What It Means',
    blurb:
      'Undetectable = Untransmittable. People living with HIV who take treatment and reach an undetectable viral load cannot sexually transmit HIV.',
    tag: 'HIV education',
  },
  {
    id: 'disclosure',
    emoji: '🗣️',
    title: 'Talking About Your Status',
    blurb: 'Tips for confident, healthy conversations about your status — on your terms.',
    tag: 'Guides',
  },
  {
    id: 'testing',
    emoji: '🧪',
    title: 'Testing & Prevention',
    blurb: 'PrEP, PEP, regular testing, and safer-sex basics explained plainly.',
    tag: 'Health',
  },
  {
    id: 'support',
    emoji: '🤝',
    title: 'Find Support',
    blurb: 'Peer groups and helplines for whenever you need someone in your corner.',
    tag: 'Support',
  },
];

const GROUPS = [
  { id: 'g1', emoji: '🌈', name: 'LGBTQ+ Connect', members: 1240 },
  { id: 'g2', emoji: '🧘', name: 'Wellness & Mindfulness', members: 860 },
  { id: 'g3', emoji: '🍳', name: 'Foodies & Cooks', members: 540 },
  { id: 'g4', emoji: '🎮', name: 'Gamers Lounge', members: 720 },
];

router.get('/community', requireAuth, (req, res) => {
  res.json({ events: EVENTS, resources: RESOURCES, groups: GROUPS });
});

export default router;
