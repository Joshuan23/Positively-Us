// Positively Us — vanilla single-page app.
const appEl = document.getElementById('app');

const state = {
  user: null,
  meta: {},
  screen: 'home', // home | discover | community | messages | profile
  chatWith: null, // active conversation user id (within messages)
  data: {},
};

// ---------- API + helpers ----------
async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch('/api' + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try {
    data = await res.json();
  } catch {}
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);

const HEART =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

function logo(h = 26) {
  const id = 'g' + Math.random().toString(36).slice(2, 7);
  return `<svg class="logo-mark" width="${h * 1.55}" height="${h}" viewBox="0 0 48 32" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FF4D8D"/><stop offset="1" stop-color="#7B61FF"/></linearGradient></defs>
    <path d="${HEART}" transform="translate(2 3) scale(0.62)" fill="none" stroke="#FF4D8D" stroke-width="3.2" stroke-linejoin="round"/>
    <path d="${HEART}" transform="translate(19 3) scale(0.62)" fill="none" stroke="#7B61FF" stroke-width="3.2" stroke-linejoin="round"/>
    <path d="${HEART}" transform="translate(13.5 9) scale(0.34)" fill="url(#${id})"/>
  </svg>`;
}
const wordmark = () => `<span class="wordmark">Positively <span class="us">Us</span></span>`;
const verifiedMark = (v) => (v ? '<span class="verified" title="Verified">✔︎</span>' : '');

function toggle(arr, val) {
  const i = arr.indexOf(val);
  if (i >= 0) arr.splice(i, 1);
  else arr.push(val);
}
function timeAgo(iso) {
  if (!iso) return '';
  const s = (Date.now() - new Date(iso + 'Z').getTime()) / 1000;
  if (s < 60) return 'now';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  return Math.floor(s / 86400) + 'd';
}
function go(screen) {
  state.screen = screen;
  state.chatWith = null;
  render();
}

// ---------- Boot ----------
async function boot() {
  appEl.innerHTML = '<div class="center"><div style="color:var(--muted)">Loading…</div></div>';
  try {
    state.meta = await api('/meta');
  } catch {}
  try {
    const { user } = await api('/auth/me');
    state.user = user;
  } catch {}
  render();
}

function render() {
  if (!state.user) return renderLanding();
  appEl.innerHTML = `
    <div class="app">
      ${appHeader()}
      <div class="screen" id="screen"></div>
      ${bottomNav()}
    </div>`;
  wireHeaderAndNav();
  const s = document.getElementById('screen');
  const map = {
    home: renderHome,
    discover: renderDiscover,
    community: renderCommunity,
    messages: renderMessages,
    profile: renderProfile,
  };
  (map[state.screen] || renderHome)(s);
}

function appHeader() {
  return `
    <div class="app-head">
      <div class="brand-row">${logo(24)} ${wordmark()}</div>
      <div class="h-actions">
        <button class="icon-btn" data-bell title="Messages">🔔</button>
      </div>
    </div>`;
}

function bottomNav() {
  const items = [
    ['home', '🏠', 'Home'],
    ['discover', '🔍', 'Discover'],
    ['community', '👥', 'Community'],
    ['messages', '💬', 'Messages'],
    ['profile', '👤', 'Profile'],
  ];
  return `<div class="bottomnav">
    ${items
      .map(
        ([k, ic, label]) =>
          `<button data-tab="${k}" class="${state.screen === k ? 'active' : ''}">
            <span class="ic">${ic}</span>${label}</button>`
      )
      .join('')}
  </div>`;
}

function wireHeaderAndNav() {
  document.querySelectorAll('[data-tab]').forEach((b) =>
    b.addEventListener('click', () => go(b.dataset.tab))
  );
  const bell = document.querySelector('[data-bell]');
  if (bell) bell.addEventListener('click', () => go('messages'));
}

// ======================================================================
// LANDING + AUTH
// ======================================================================
function renderLanding() {
  const welcome = ['Gay', 'Lesbian', 'Bisexual', 'Straight', 'Transgender', 'Nonbinary', 'Queer', 'Everyone'];
  appEl.innerHTML = `
    <div class="landing-top">
      <div class="brand-row">${logo(30)} <div>${wordmark()}<div class="brand-tag">Love. Connection. No Shame.</div></div></div>
    </div>
    <div class="hero">
      <div>
        <div class="age-badge">🔞 21+ community</div>
        <h1>Connect without <span class="grad">hiding who you are.</span></h1>
        <p>
          Positively Us is a warm, judgment-free dating &amp; social community for
          adults living with HIV and other STIs — every gender, orientation, and
          identity welcome. Your status is shared upfront, so you can skip the hard
          conversation and get to the good part: real connection.
        </p>
        <div class="feature-grid">
          ${[
            ['🔒', 'Private by design', 'You control what you share.'],
            ['🛡️', 'Verified &amp; trusted', 'Profiles verified for safety.'],
            ['💜', 'Meaningful connections', 'Dates, friends, and community.'],
            ['👥', 'Inclusive for all', 'All genders &amp; orientations.'],
          ]
            .map(
              ([i, t, d]) =>
                `<div class="feature"><div class="ico">${i}</div><h4>${t}</h4><p>${d}</p></div>`
            )
            .join('')}
        </div>
        <div class="welcome-list">
          <span style="color:var(--muted);font-size:13px;align-self:center">Made for everyone:</span>
          ${welcome.map((w) => `<span class="tag">${w}</span>`).join('')}
        </div>
      </div>
      <div class="card hero-auth" id="auth-card"></div>
    </div>`;
  renderAuthCard();
}

function renderAuthCard() {
  const card = document.getElementById('auth-card');
  state.data.authTab = state.data.authTab || 'signup';
  const tab = state.data.authTab;
  card.innerHTML = `
    <div style="text-align:center;margin-bottom:14px">
      ${logo(34)}
      <div style="margin-top:6px;color:var(--muted);font-size:13px">You belong here. This is a judgment-free space for you.</div>
    </div>
    <div class="auth-tabs">
      <button data-tab="signup" class="${tab === 'signup' ? 'active' : ''}">Create Account</button>
      <button data-tab="login" class="${tab === 'login' ? 'active' : ''}">Log In</button>
    </div>
    <div id="auth-body"></div>`;
  card.querySelectorAll('.auth-tabs [data-tab]').forEach((b) =>
    b.addEventListener('click', () => {
      state.data.authTab = b.dataset.tab;
      renderAuthCard();
    })
  );
  if (tab === 'signup') renderSignup();
  else renderLogin();
}

function renderLogin() {
  document.getElementById('auth-body').innerHTML = `
    <div id="err"></div>
    <label>Email</label><input id="l-email" type="email" autocomplete="email" />
    <label>Password</label><input id="l-pass" type="password" autocomplete="current-password" />
    <div style="height:16px"></div>
    <button class="btn block" id="l-submit">Log In</button>`;
  document.getElementById('l-submit').addEventListener('click', async () => {
    try {
      const { user } = await api('/auth/login', {
        method: 'POST',
        body: {
          email: document.getElementById('l-email').value.trim(),
          password: document.getElementById('l-pass').value,
        },
      });
      state.user = user;
      state.screen = 'home';
      render();
    } catch (e) {
      showErr('err', e.message);
    }
  });
}

function renderSignup() {
  const s = (state.data.signup = state.data.signup || {
    seeking: [], conditions: [], interests: [], lookingFor: [], photoEmoji: '🙂', undetectable: false,
  });
  const emojis = ['🙂', '😊', '😎', '🥰', '🌻', '🦋', '🌈', '🔥', '🎧', '📚', '🌙', '🐱'];
  const m = state.meta;
  document.getElementById('auth-body').innerHTML = `
    <div id="err"></div>
    <div class="row">
      <div><label>Display name</label><input id="s-name" maxlength="40" /></div>
      <div><label>Email</label><input id="s-email" type="email" /></div>
    </div>
    <div class="row">
      <div><label>Password (8+)</label><input id="s-pass" type="password" /></div>
      <div><label>Date of birth</label><input id="s-dob" type="date" /></div>
    </div>
    <div class="row">
      <div><label>I am a…</label><select id="s-gender"><option value="">Select…</option>
        ${m.genders.map((g) => `<option>${esc(g)}</option>`).join('')}</select></div>
      <div><label>Pronouns</label><select id="s-pron"><option value="">—</option>
        ${m.pronouns.map((p) => `<option>${esc(p)}</option>`).join('')}</select></div>
    </div>
    <label>Orientation (optional)</label>
    <select id="s-orient"><option value="">—</option>
      ${m.orientations.map((o) => `<option>${esc(o)}</option>`).join('')}</select>

    <label>Open to meeting</label>
    <div class="chips" id="s-seeking">
      ${m.genders.map((g) => chip(g, s.seeking.includes(g), 'g')).join('')}
    </div>

    <label>Health disclosure <span style="color:var(--pink)">*required</span></label>
    <div class="hint">Being upfront is what makes this community work. Select all that apply — this shows on your profile.</div>
    <div class="chips" id="s-cond" style="margin-top:8px">
      ${m.conditions.map((c) => chip(c, s.conditions.includes(c), 'c')).join('')}
    </div>
    <div id="s-other-wrap" style="${s.conditions.includes('Other') ? '' : 'display:none'}">
      <label>Your note</label><input id="s-other" maxlength="60" placeholder="Specify (kept respectful & brief)" />
    </div>
    <div id="s-uu-wrap" class="toggle" style="${s.conditions.includes(m.uuCondition) ? '' : 'display:none'}">
      <input type="checkbox" id="s-uu" ${s.undetectable ? 'checked' : ''} />
      <label for="s-uu" style="margin:0">I'm undetectable (U=U) 💚</label>
    </div>

    <label>Interests</label>
    <div class="chips" id="s-int">
      ${m.interests.map((i) => chip(i, s.interests.includes(i), 'i')).join('')}
    </div>
    <label>I'm looking for</label>
    <div class="chips" id="s-lf">
      ${m.lookingFor.map((l) => chip(l, s.lookingFor.includes(l), 'l')).join('')}
    </div>

    <label>Location (optional)</label><input id="s-loc" maxlength="80" placeholder="City, Country" />
    <label>About you (optional)</label>
    <textarea id="s-bio" maxlength="600" placeholder="What are you looking for? What lights you up?"></textarea>

    <label>Pick an avatar</label>
    <div class="emoji-picker" id="s-emoji">
      ${emojis.map((e) => `<button type="button" class="${s.photoEmoji === e ? 'on' : ''}" data-e="${e}">${e}</button>`).join('')}
    </div>

    <div class="consent">
      <input type="checkbox" id="s-age" />
      <label for="s-age">I confirm I am <b>21 years of age or older</b> and agree to disclose my health status honestly and treat members with respect.</label>
    </div>
    <div style="height:16px"></div>
    <button class="btn block" id="s-submit">Join Our Community</button>`;

  wireChips('#s-seeking', s.seeking);
  wireChips('#s-int', s.interests);
  wireChips('#s-lf', s.lookingFor);
  document.querySelectorAll('#s-cond .chip').forEach((c) =>
    c.addEventListener('click', () => {
      toggle(s.conditions, c.dataset.v);
      c.classList.toggle('on');
      document.getElementById('s-other-wrap').style.display = s.conditions.includes('Other') ? '' : 'none';
      document.getElementById('s-uu-wrap').style.display = s.conditions.includes(m.uuCondition) ? '' : 'none';
    })
  );
  document.querySelectorAll('#s-emoji button').forEach((b) =>
    b.addEventListener('click', () => {
      s.photoEmoji = b.dataset.e;
      document.querySelectorAll('#s-emoji button').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
    })
  );
  document.getElementById('s-submit').addEventListener('click', submitSignup);
}

function chip(val, on, key) {
  return `<button type="button" class="chip ${on ? 'on' : ''}" data-v="${esc(val)}" data-k="${key}">${esc(val)}</button>`;
}
function wireChips(sel, arr) {
  document.querySelectorAll(sel + ' .chip').forEach((c) =>
    c.addEventListener('click', () => {
      toggle(arr, c.dataset.v);
      c.classList.toggle('on');
    })
  );
}

async function submitSignup() {
  const s = state.data.signup;
  const conditions = [...s.conditions];
  const otherVal = (document.getElementById('s-other')?.value || '').trim();
  if (conditions.includes('Other')) {
    const idx = conditions.indexOf('Other');
    if (otherVal) conditions[idx] = otherVal;
    else conditions.splice(idx, 1);
  }
  const payload = {
    displayName: document.getElementById('s-name').value.trim(),
    email: document.getElementById('s-email').value.trim(),
    password: document.getElementById('s-pass').value,
    birthdate: document.getElementById('s-dob').value,
    gender: document.getElementById('s-gender').value,
    pronouns: document.getElementById('s-pron').value,
    orientation: document.getElementById('s-orient').value,
    seeking: s.seeking,
    conditions,
    undetectable: document.getElementById('s-uu')?.checked || false,
    interests: s.interests,
    lookingFor: s.lookingFor,
    location: document.getElementById('s-loc').value.trim(),
    bio: document.getElementById('s-bio').value.trim(),
    photoEmoji: s.photoEmoji,
    ageConfirm: document.getElementById('s-age').checked,
  };
  try {
    const { user } = await api('/auth/register', { method: 'POST', body: payload });
    state.user = user;
    state.data.signup = null;
    state.screen = 'home';
    render();
  } catch (e) {
    showErr('err', e.message);
  }
}

function showErr(id, msg) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="error">${esc(msg)}</div>`;
}

// ======================================================================
// HOME
// ======================================================================
async function renderHome(s) {
  s.innerHTML = '<div class="empty">Loading…</div>';
  let dash, comm;
  try {
    [dash, comm] = await Promise.all([api('/dashboard'), api('/community')]);
  } catch (e) {
    s.innerHTML = `<div class="error">${esc(e.message)}</div>`;
    return;
  }
  const st = dash.stats;
  const spotlight = comm.resources[0];
  s.innerHTML = `
    <div class="greet-card">
      <h2>Good day, ${esc(dash.displayName)} 👋</h2>
      <p>Ready to make a meaningful connection?</p>
      <button class="btn" data-explore>Explore Matches</button>
    </div>
    <div class="stat-row">
      ${stat('❤️', st.whoLikesYou, 'Who Likes You', 'discover')}
      ${stat('💜', st.matches, 'Matches', 'messages')}
      ${stat('👁️', st.visitors, 'Visitors', null)}
      ${stat('👥', '', 'Community', 'community')}
    </div>

    <div class="section-head"><h3>Community Spotlight</h3><a data-goto="community">See all</a></div>
    <div class="spotlight">
      <div class="emoji">${spotlight.emoji}</div>
      <div><h4>${esc(spotlight.title)}</h4><p>${esc(spotlight.blurb)}</p></div>
    </div>

    <div class="section-head"><h3>Upcoming Events</h3><a data-goto="community">See all</a></div>
    ${comm.events
      .slice(0, 2)
      .map(
        (e) => `<div class="event-item">
          <div class="emoji">${e.emoji}</div>
          <div><h4>${esc(e.title)}</h4><div class="when">${esc(e.date)}</div>
          <div class="blurb">${esc(e.blurb)}</div></div>
        </div>`
      )
      .join('')}`;

  s.querySelector('[data-explore]').addEventListener('click', () => go('discover'));
  s.querySelectorAll('[data-goto]').forEach((a) =>
    a.addEventListener('click', () => go(a.dataset.goto))
  );
  s.querySelectorAll('[data-stat]').forEach((el) =>
    el.addEventListener('click', () => {
      if (el.dataset.stat) go(el.dataset.stat);
    })
  );
}
function stat(ic, num, lbl, nav) {
  return `<div class="stat" data-stat="${nav || ''}" style="${nav ? 'cursor:pointer' : ''}">
    <div class="ic">${ic}</div><div class="num">${num === '' ? '›' : num}</div><div class="lbl">${lbl}</div></div>`;
}

// ======================================================================
// DISCOVER
// ======================================================================
async function renderDiscover(s) {
  s.innerHTML = '<div class="empty">Finding people…</div>';
  let candidates = [];
  try {
    ({ candidates } = await api('/discovery'));
  } catch (e) {
    s.innerHTML = `<div class="error">${esc(e.message)}</div>`;
    return;
  }
  state.data.deck = candidates;
  state.data.deckIdx = 0;
  paintCard(s);
}

function paintCard(s) {
  const deck = state.data.deck || [];
  const idx = state.data.deckIdx || 0;
  if (idx >= deck.length) {
    s.innerHTML = `<div class="empty"><div class="big">🌙</div><h2>That's everyone for now</h2>
      <p>You've seen all the members that match your preferences.<br/>New people join every day — check back soon.</p>
      <button class="btn ghost" data-refresh>Refresh</button></div>`;
    s.querySelector('[data-refresh]').addEventListener('click', () => renderDiscover(s));
    return;
  }
  const p = deck[idx];
  const uu = p.undetectable
    ? `<span class="pill-uu">💚 U=U</span>`
    : '';
  s.innerHTML = `
    <div class="pcard">
      <div class="photo">
        ${esc(p.photoEmoji)}
        <div class="top-badges">
          ${p.verified ? `<span class="badge-soft">✔︎ Verified</span>` : '<span></span>'}
          <span class="badge-soft">${idx + 1}/${deck.length}</span>
        </div>
      </div>
      <div class="info">
        <div class="name">${esc(p.displayName)}, ${p.age} ${verifiedMark(p.verified)}</div>
        <div class="sub">${[p.pronouns, p.gender].filter(Boolean).map(esc).join(' · ')}${
    p.orientation ? ' · ' + esc(p.orientation) : ''
  }</div>
        <div class="sub">${p.location ? '📍 ' + esc(p.location) : ''}</div>
        <div class="status-line">
          ${p.conditions.map((c) => `<span class="tag">💬 ${esc(c)}</span>`).join('')} ${uu}
        </div>
        ${p.bio ? `<div class="block-label">About</div><div class="bio">${esc(p.bio)}</div>` : ''}
        ${
          p.lookingFor.length
            ? `<div class="block-label">Looking for</div><div class="chips">${p.lookingFor
                .map((l) => `<span class="chip on">${esc(l)}</span>`)
                .join('')}</div>`
            : ''
        }
        ${
          p.interests.length
            ? `<div class="block-label">Interests</div><div>${p.interests
                .map((i) => `<span class="tag interest">${esc(i)}</span>`)
                .join('')}</div>`
            : ''
        }
      </div>
    </div>
    <div class="actions">
      <button class="circle-btn pass" data-act="pass" title="Pass">✕</button>
      <button class="circle-btn like" data-act="like" title="Like">♥</button>
    </div>`;
  s.querySelector('[data-act="pass"]').addEventListener('click', () => act(s, p, true));
  s.querySelector('[data-act="like"]').addEventListener('click', () => act(s, p, false));
}

async function act(s, p, pass) {
  try {
    const { matched, matchUser } = await api('/likes', {
      method: 'POST',
      body: { userId: p.id, pass },
    });
    state.data.deckIdx = (state.data.deckIdx || 0) + 1;
    if (matched && matchUser) {
      showMatchModal(matchUser);
    }
  } catch (e) {
    console.warn(e.message);
    state.data.deckIdx = (state.data.deckIdx || 0) + 1;
  }
  paintCard(s);
}

function showMatchModal(m) {
  const shared = m.sharedInterests || [];
  const icons = { Hiking: '🥾', Coffee: '☕', Music: '🎵', Art: '🎨', Yoga: '🧘', Cooking: '🍳', Travel: '✈️', Gaming: '🎮' };
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="match-modal">
      <h2>It's a Match! 💜</h2>
      <p style="color:var(--muted);margin:0">You and ${esc(m.displayName)} liked each other.</p>
      <div class="match-avatars">
        <div class="av">${esc(state.user.photoEmoji)}</div>
        <div class="heart">💜</div>
        <div class="av">${esc(m.photoEmoji)}</div>
      </div>
      ${
        shared.length
          ? `<div class="shared">${shared
              .slice(0, 3)
              .map(
                (i) =>
                  `<div class="item"><div class="b">${icons[i] || '✨'}</div>You both like ${esc(i)}</div>`
              )
              .join('')}</div>`
          : ''
      }
      <button class="btn block" data-msg>Send a Message</button>
      <button class="btn ghost block" style="margin-top:10px" data-keep>Keep Swiping</button>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('[data-keep]').addEventListener('click', () => overlay.remove());
  overlay.querySelector('[data-msg]').addEventListener('click', () => {
    overlay.remove();
    state.chatWith = m.id;
    go('messages');
    state.chatWith = m.id;
    render();
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

// ======================================================================
// COMMUNITY
// ======================================================================
async function renderCommunity(s) {
  s.innerHTML = '<div class="empty">Loading…</div>';
  let comm;
  try {
    comm = await api('/community');
  } catch (e) {
    s.innerHTML = `<div class="error">${esc(e.message)}</div>`;
    return;
  }
  s.innerHTML = `
    <h2 style="margin:2px 0 4px">Community</h2>
    <p style="color:var(--muted);margin:0 0 8px;font-size:14px">Connect beyond dating — events, groups, education &amp; support.</p>

    <div class="section-head"><h3>Upcoming Events</h3></div>
    ${comm.events
      .map(
        (e) => `<div class="event-item">
          <div class="emoji">${e.emoji}</div>
          <div style="flex:1"><h4>${esc(e.title)} <span class="tag">${esc(e.tag)}</span></h4>
          <div class="when">${esc(e.date)}</div><div class="blurb">${esc(e.blurb)}</div></div>
        </div>`
      )
      .join('')}

    <div class="section-head"><h3>Learn &amp; Support</h3></div>
    <div class="card-soft">
      ${comm.resources
        .map(
          (r) => `<div class="res-item"><div class="emoji">${r.emoji}</div>
            <div><h4>${esc(r.title)} <span class="tag interest">${esc(r.tag)}</span></h4>
            <p>${esc(r.blurb)}</p></div></div>`
        )
        .join('')}
    </div>

    <div class="section-head"><h3>Groups</h3></div>
    <div class="group-row">
      ${comm.groups
        .map(
          (g) => `<div class="group"><div class="emoji">${g.emoji}</div>
            <div><div class="name">${esc(g.name)}</div><div class="cnt">${g.members.toLocaleString()} members</div></div></div>`
        )
        .join('')}
    </div>`;
}

// ======================================================================
// MESSAGES (list + thread)
// ======================================================================
async function renderMessages(s) {
  if (state.chatWith) return renderThread(s, state.chatWith);
  s.innerHTML = '<div class="empty">Loading…</div>';
  let matches = [];
  try {
    ({ matches } = await api('/matches'));
  } catch (e) {
    s.innerHTML = `<div class="error">${esc(e.message)}</div>`;
    return;
  }
  if (!matches.length) {
    s.innerHTML = `<div class="empty"><div class="big">💬</div><h2>No conversations yet</h2>
      <p>When you and someone both like each other, you can chat here.</p>
      <button class="btn" data-disc>Start discovering</button></div>`;
    s.querySelector('[data-disc]').addEventListener('click', () => go('discover'));
    return;
  }
  const q = state.data.msgSearch || '';
  const filtered = matches.filter((m) => m.displayName.toLowerCase().includes(q.toLowerCase()));
  s.innerHTML = `
    <h2 style="margin:2px 0 12px">Messages</h2>
    <div class="stories">
      ${matches
        .map(
          (m) => `<button class="story" data-open="${m.id}">
            <div class="ring"><div class="inner">${esc(m.photoEmoji)}</div></div>
            <div class="lbl">${esc(m.displayName)}</div></button>`
        )
        .join('')}
    </div>
    <div class="search-box"><span class="mag">🔍</span>
      <input id="msg-search" placeholder="Search messages" value="${esc(q)}" /></div>
    <div id="conv-list">
      ${filtered.map(convRow).join('') || '<div class="empty">No matches found.</div>'}
    </div>`;

  const search = document.getElementById('msg-search');
  search.addEventListener('input', () => {
    state.data.msgSearch = search.value;
    const list = document.getElementById('conv-list');
    const f = matches.filter((m) => m.displayName.toLowerCase().includes(search.value.toLowerCase()));
    list.innerHTML = f.map(convRow).join('') || '<div class="empty">No matches found.</div>';
    wireConvs(s);
  });
  wireConvs(s);
}

function convRow(m) {
  return `<button class="conv" data-open="${m.id}">
    <div class="av">${esc(m.photoEmoji)}</div>
    <div style="min-width:0">
      <div class="who">${esc(m.displayName)} ${verifiedMark(m.verified)}</div>
      <div class="snippet">${m.lastMessage ? esc(m.lastMessage) : 'Say hello 👋'}</div>
    </div>
    <div class="meta">
      <div class="time">${m.lastMessageAt ? timeAgo(m.lastMessageAt) : ''}</div>
      ${m.unread ? `<div class="unread">${m.unread}</div>` : ''}
    </div>
  </button>`;
}
function wireConvs(s) {
  s.querySelectorAll('[data-open]').forEach((b) =>
    b.addEventListener('click', () => {
      state.chatWith = Number(b.dataset.open);
      renderMessages(s);
    })
  );
}

async function renderThread(s, otherId) {
  let matches = [];
  try {
    ({ matches } = await api('/matches'));
  } catch (e) {
    s.innerHTML = `<div class="error">${esc(e.message)}</div>`;
    return;
  }
  const m = matches.find((x) => x.id === otherId);
  if (!m) {
    state.chatWith = null;
    return renderMessages(s);
  }
  s.innerHTML = `
    <div class="chat-head">
      <button class="icon-btn" data-back>‹</button>
      <div class="av">${esc(m.photoEmoji)}</div>
      <div><b>${esc(m.displayName)}, ${m.age}</b> ${verifiedMark(m.verified)}
        <div style="font-size:12px;color:var(--muted)">${m.conditions.map(esc).join(' · ')}${
    m.undetectable ? ' · 💚 U=U' : ''
  }</div></div>
    </div>
    <div class="messages" id="messages"></div>
    <form class="chat-input" id="chat-form">
      <input id="chat-text" placeholder="Write a message…" autocomplete="off" maxlength="2000" />
      <button class="btn" type="submit">Send</button>
    </form>`;
  s.querySelector('[data-back]').addEventListener('click', () => {
    state.chatWith = null;
    renderMessages(s);
  });
  await loadMessages(otherId);
  document.getElementById('chat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-text');
    const body = input.value.trim();
    if (!body) return;
    input.value = '';
    try {
      await api('/messages/' + otherId, { method: 'POST', body: { body } });
      await loadMessages(otherId);
    } catch (err) {
      console.warn(err.message);
    }
  });
}

async function loadMessages(otherId) {
  const box = document.getElementById('messages');
  if (!box) return;
  try {
    const { messages } = await api('/messages/' + otherId);
    box.innerHTML = messages.length
      ? messages.map((mm) => `<div class="bubble ${mm.fromMe ? 'me' : 'them'}">${esc(mm.body)}</div>`).join('')
      : `<div style="margin:auto;text-align:center;color:var(--muted)">This is the start of your conversation.<br/>Break the ice 💜</div>`;
    box.scrollTop = box.scrollHeight;
  } catch (e) {
    box.innerHTML = `<div class="error">${esc(e.message)}</div>`;
  }
}

// ======================================================================
// PROFILE
// ======================================================================
function renderProfile(s) {
  const u = state.user;
  const m = state.meta;
  const ed = (state.data.edit = {
    seeking: [...u.seeking], conditions: [...u.conditions], interests: [...u.interests],
    lookingFor: [...u.lookingFor], photoEmoji: u.photoEmoji, undetectable: u.undetectable,
  });
  const emojis = ['🙂', '😊', '😎', '🥰', '🌻', '🦋', '🌈', '🔥', '🎧', '📚', '🌙', '🐱'];
  s.innerHTML = `
    <div class="prof-hero">
      <div class="av">${esc(u.photoEmoji)}</div>
      <h2 style="margin:2px 0">${esc(u.displayName)}, ${u.age} ${verifiedMark(u.verified)}</h2>
      <div style="color:var(--muted);font-size:13px">${[u.pronouns, u.gender].filter(Boolean).map(esc).join(' · ')}</div>
      <div style="margin-top:8px">${u.conditions.map((c) => `<span class="tag">${esc(c)}</span>`).join('')}${
    u.undetectable ? ' <span class="pill-uu">💚 U=U</span>' : ''
  }</div>
    </div>
    <div id="err"></div><div id="saved"></div>

    <label>Avatar</label>
    <div class="emoji-picker" id="p-emoji">
      ${emojis.map((e) => `<button type="button" class="${ed.photoEmoji === e ? 'on' : ''}" data-e="${e}">${e}</button>`).join('')}
    </div>

    <label>Pronouns</label>
    <select id="p-pron"><option value="">—</option>
      ${m.pronouns.map((p) => `<option ${p === u.pronouns ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select>
    <label>Orientation</label>
    <select id="p-orient"><option value="">—</option>
      ${m.orientations.map((o) => `<option ${o === u.orientation ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>

    <label>Open to meeting</label>
    <div class="chips" id="p-seeking">${m.genders.map((g) => chip(g, ed.seeking.includes(g), 'g')).join('')}</div>

    <label>Health disclosure <span style="color:var(--pink)">*required</span></label>
    <div class="chips" id="p-cond">${m.conditions.map((c) => chip(c, ed.conditions.includes(c), 'c')).join('')}</div>
    <div id="p-uu-wrap" class="toggle" style="${ed.conditions.includes(m.uuCondition) ? '' : 'display:none'}">
      <input type="checkbox" id="p-uu" ${ed.undetectable ? 'checked' : ''} />
      <label for="p-uu" style="margin:0">I'm undetectable (U=U) 💚</label>
    </div>

    <label>Interests</label>
    <div class="chips" id="p-int">${m.interests.map((i) => chip(i, ed.interests.includes(i), 'i')).join('')}</div>
    <label>I'm looking for</label>
    <div class="chips" id="p-lf">${m.lookingFor.map((l) => chip(l, ed.lookingFor.includes(l), 'l')).join('')}</div>

    <label>Location</label><input id="p-loc" maxlength="80" value="${esc(u.location)}" />
    <label>About you</label><textarea id="p-bio" maxlength="600">${esc(u.bio)}</textarea>

    <div style="height:16px"></div>
    <button class="btn block" id="p-save">Save changes</button>
    <button class="btn ghost block" style="margin-top:10px" id="p-logout">Log out</button>`;

  wireChips('#p-seeking', ed.seeking);
  wireChips('#p-int', ed.interests);
  wireChips('#p-lf', ed.lookingFor);
  s.querySelectorAll('#p-cond .chip').forEach((c) =>
    c.addEventListener('click', () => {
      toggle(ed.conditions, c.dataset.v);
      c.classList.toggle('on');
      document.getElementById('p-uu-wrap').style.display = ed.conditions.includes(m.uuCondition) ? '' : 'none';
    })
  );
  s.querySelectorAll('#p-emoji button').forEach((b) =>
    b.addEventListener('click', () => {
      ed.photoEmoji = b.dataset.e;
      s.querySelectorAll('#p-emoji button').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
    })
  );
  s.querySelector('#p-logout').addEventListener('click', async () => {
    await api('/auth/logout', { method: 'POST' });
    state.user = null;
    render();
  });
  s.querySelector('#p-save').addEventListener('click', async () => {
    const payload = {
      seeking: ed.seeking,
      conditions: ed.conditions,
      interests: ed.interests,
      lookingFor: ed.lookingFor,
      photoEmoji: ed.photoEmoji,
      undetectable: document.getElementById('p-uu')?.checked || false,
      pronouns: document.getElementById('p-pron').value,
      orientation: document.getElementById('p-orient').value,
      location: document.getElementById('p-loc').value.trim(),
      bio: document.getElementById('p-bio').value.trim(),
    };
    try {
      const { user } = await api('/auth/me', { method: 'PATCH', body: payload });
      state.user = user;
      document.getElementById('saved').innerHTML = `<div class="notice" style="margin-top:12px">✅ Profile saved.</div>`;
      setTimeout(() => renderProfile(s), 600);
    } catch (e) {
      showErr('err', e.message);
    }
  });
}

boot();
