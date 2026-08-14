// Positively Us — vanilla single-page app.
const app = document.getElementById('app');

const state = {
  user: null,
  meta: { conditions: [], genders: [], minAge: 21 },
  view: 'landing',
  data: {}, // per-view scratch
};

// ---------- API helper ----------
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
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);

function nav(view) {
  state.view = view;
  render();
}

// ---------- Boot ----------
async function boot() {
  app.innerHTML = '<div class="center"><div class="spinner">Loading…</div></div>';
  try {
    state.meta = await api('/meta');
  } catch {}
  try {
    const { user } = await api('/auth/me');
    state.user = user;
    state.view = 'discover';
  } catch {
    state.view = 'landing';
  }
  render();
}

// ---------- Views ----------
function render() {
  if (!state.user) return renderLanding();
  app.innerHTML = topbar() + `<div class="container" id="main"></div>`;
  wireTopbar();
  const main = document.getElementById('main');
  if (state.view === 'discover') renderDiscover(main);
  else if (state.view === 'matches') renderMatches(main);
  else if (state.view === 'chat') renderChat(main);
  else if (state.view === 'profile') renderProfile(main);
  else renderDiscover(main);
}

function topbar() {
  const tabs = [
    ['discover', 'Discover'],
    ['matches', 'Matches'],
    ['chat', 'Messages'],
    ['profile', 'Profile'],
  ];
  return `
    <div class="topbar">
      <div class="brand">
        <span class="logo">💜</span>
        <div>Positively Us<small>Come as you are · 21+</small></div>
      </div>
      <div class="nav">
        ${tabs
          .map(
            ([k, label]) =>
              `<button data-nav="${k}" class="${state.view === k ? 'active' : ''}">${label}</button>`
          )
          .join('')}
        <button data-logout>Log out</button>
      </div>
    </div>`;
}

function wireTopbar() {
  document.querySelectorAll('[data-nav]').forEach((b) =>
    b.addEventListener('click', () => nav(b.dataset.nav))
  );
  const lo = document.querySelector('[data-logout]');
  if (lo)
    lo.addEventListener('click', async () => {
      await api('/auth/logout', { method: 'POST' });
      state.user = null;
      state.view = 'landing';
      render();
    });
}

// ---------- Landing + Auth ----------
function renderLanding() {
  state.data.authTab = state.data.authTab || 'signup';
  app.innerHTML = `
    <div class="topbar">
      <div class="brand"><span class="logo">💜</span><div>Positively Us<small>Come as you are · 21+</small></div></div>
    </div>
    <div class="container">
      <div class="hero">
        <div>
          <div class="badge age-badge">🔞 21+ community</div>
          <h1>Dating without the <span class="grad">disclosure dread</span>.</h1>
          <p>
            Positively Us is a warm, judgment-free community for adults living with
            STDs and STIs — every gender, orientation, and background welcome.
            Here, your status is shared upfront, so you can skip the hard
            conversation and get to the fun part: connecting.
          </p>
          <div class="badges">
            <span class="badge">✅ Disclosure built in</span>
            <span class="badge">🌈 All people welcome</span>
            <span class="badge">🔒 Match before you chat</span>
          </div>
        </div>
        <div class="card" id="auth-card"></div>
      </div>
    </div>`;
  renderAuthCard();
}

function renderAuthCard() {
  const card = document.getElementById('auth-card');
  const tab = state.data.authTab;
  card.innerHTML = `
    <div class="auth-tabs">
      <button data-tab="signup" class="${tab === 'signup' ? 'active' : ''}">Create account</button>
      <button data-tab="login" class="${tab === 'login' ? 'active' : ''}">Sign in</button>
    </div>
    <div id="auth-body"></div>`;
  card.querySelectorAll('[data-tab]').forEach((b) =>
    b.addEventListener('click', () => {
      state.data.authTab = b.dataset.tab;
      renderAuthCard();
    })
  );
  if (tab === 'signup') renderSignup();
  else renderLogin();
}

function renderLogin() {
  const body = document.getElementById('auth-body');
  body.innerHTML = `
    <div id="err"></div>
    <label>Email</label>
    <input id="l-email" type="email" autocomplete="email" />
    <label>Password</label>
    <input id="l-pass" type="password" autocomplete="current-password" />
    <div style="height:16px"></div>
    <button class="btn block" id="l-submit">Sign in</button>`;
  document.getElementById('l-submit').addEventListener('click', async () => {
    const email = document.getElementById('l-email').value.trim();
    const password = document.getElementById('l-pass').value;
    try {
      const { user } = await api('/auth/login', { method: 'POST', body: { email, password } });
      state.user = user;
      state.view = 'discover';
      render();
    } catch (e) {
      showErr('err', e.message);
    }
  });
}

function renderSignup() {
  const body = document.getElementById('auth-body');
  state.data.signup = state.data.signup || {
    seeking: [],
    conditions: [],
    otherCondition: '',
    photoEmoji: '🙂',
  };
  const s = state.data.signup;
  const emojis = ['🙂', '😊', '😎', '🥰', '🌻', '🦋', '🌈', '🔥', '🎧', '📚', '🌙', '🐱'];

  body.innerHTML = `
    <div id="err"></div>
    <div class="row">
      <div><label>Display name</label><input id="s-name" maxlength="40" /></div>
      <div><label>Email</label><input id="s-email" type="email" /></div>
    </div>
    <div class="row">
      <div><label>Password (8+ chars)</label><input id="s-pass" type="password" /></div>
      <div><label>Date of birth</label><input id="s-dob" type="date" /></div>
    </div>
    <div class="row">
      <div>
        <label>I am a…</label>
        <select id="s-gender">
          <option value="">Select…</option>
          ${state.meta.genders.map((g) => `<option>${esc(g)}</option>`).join('')}
        </select>
      </div>
      <div><label>Orientation (optional)</label><input id="s-orient" maxlength="40" placeholder="e.g. Bisexual" /></div>
    </div>
    <label>Open to meeting</label>
    <div class="chips" id="s-seeking">
      ${state.meta.genders
        .map((g) => `<button type="button" class="chip ${s.seeking.includes(g) ? 'on' : ''}" data-g="${esc(g)}">${esc(g)}</button>`)
        .join('')}
    </div>

    <label>Health disclosure <span style="color:var(--primary-2)">*required</span></label>
    <div class="hint">Being upfront is what makes this community work. Select all that apply — this shows on your profile.</div>
    <div class="chips" id="s-conditions" style="margin-top:8px">
      ${state.meta.conditions
        .map((c) => `<button type="button" class="chip ${s.conditions.includes(c) ? 'on' : ''}" data-c="${esc(c)}">${esc(c)}</button>`)
        .join('')}
    </div>
    <div id="s-other-wrap" style="${s.conditions.includes('Other') ? '' : 'display:none'}">
      <label>Your note</label>
      <input id="s-other" maxlength="60" placeholder="Specify (kept respectful & brief)" value="${esc(s.otherCondition)}" />
    </div>

    <label>Location (optional)</label>
    <input id="s-loc" maxlength="80" placeholder="City, Country" />
    <label>About you (optional)</label>
    <textarea id="s-bio" maxlength="600" placeholder="What are you looking for? What lights you up?"></textarea>

    <label>Pick an avatar</label>
    <div class="emoji-picker" id="s-emoji">
      ${emojis.map((e) => `<button type="button" class="${s.photoEmoji === e ? 'on' : ''}" data-e="${e}">${e}</button>`).join('')}
    </div>

    <div class="consent">
      <input type="checkbox" id="s-age" />
      <label for="s-age">I confirm I am <b>21 years of age or older</b> and I agree to disclose my health status honestly and treat other members with respect.</label>
    </div>
    <div style="height:16px"></div>
    <button class="btn block" id="s-submit">Join Positively Us</button>`;

  // Chip wiring
  body.querySelectorAll('#s-seeking .chip').forEach((c) =>
    c.addEventListener('click', () => {
      toggle(s.seeking, c.dataset.g);
      c.classList.toggle('on');
    })
  );
  body.querySelectorAll('#s-conditions .chip').forEach((c) =>
    c.addEventListener('click', () => {
      toggle(s.conditions, c.dataset.c);
      c.classList.toggle('on');
      document.getElementById('s-other-wrap').style.display = s.conditions.includes('Other')
        ? ''
        : 'none';
    })
  );
  body.querySelectorAll('#s-emoji button').forEach((b) =>
    b.addEventListener('click', () => {
      s.photoEmoji = b.dataset.e;
      body.querySelectorAll('#s-emoji button').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
    })
  );

  document.getElementById('s-submit').addEventListener('click', submitSignup);
}

function toggle(arr, val) {
  const i = arr.indexOf(val);
  if (i >= 0) arr.splice(i, 1);
  else arr.push(val);
}

async function submitSignup() {
  const s = state.data.signup;
  const conditions = [...s.conditions];
  // Replace "Other" with the free-text note.
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
    orientation: document.getElementById('s-orient').value.trim(),
    seeking: s.seeking,
    location: document.getElementById('s-loc').value.trim(),
    bio: document.getElementById('s-bio').value.trim(),
    conditions,
    photoEmoji: s.photoEmoji,
    ageConfirm: document.getElementById('s-age').checked,
  };
  try {
    const { user } = await api('/auth/register', { method: 'POST', body: payload });
    state.user = user;
    state.data.signup = null;
    state.view = 'discover';
    render();
  } catch (e) {
    showErr('err', e.message);
  }
}

function showErr(id, msg) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="error">${esc(msg)}</div>`;
}

// ---------- Discover ----------
async function renderDiscover(main) {
  main.innerHTML = '<div class="spinner" style="text-align:center;padding:40px">Finding people…</div>';
  let candidates = [];
  try {
    ({ candidates } = await api('/discovery'));
  } catch (e) {
    main.innerHTML = `<div class="error">${esc(e.message)}</div>`;
    return;
  }
  state.data.deck = candidates;
  state.data.deckIdx = 0;
  paintCard(main);
}

function paintCard(main) {
  const deck = state.data.deck || [];
  const idx = state.data.deckIdx || 0;
  if (idx >= deck.length) {
    main.innerHTML = `
      <div class="empty">
        <div class="big">🌙</div>
        <h2>That's everyone for now</h2>
        <p>You've seen all the members that match your preferences.<br/>Check back soon — new people join every day.</p>
        <button class="btn ghost" onclick="location.reload()">Refresh</button>
      </div>`;
    return;
  }
  const p = deck[idx];
  main.innerHTML = `
    <div class="deck">
      <div class="profile-card" id="pc">
        <div class="avatar">${esc(p.photoEmoji)}</div>
        <h2>${esc(p.displayName)}, ${p.age}</h2>
        <div class="sub">${esc(p.gender)}${p.orientation ? ' · ' + esc(p.orientation) : ''}${
    p.location ? ' · ' + esc(p.location) : ''
  }</div>
        ${p.bio ? `<div class="bio">${esc(p.bio)}</div>` : ''}
        <div class="disclosure-box">
          <div class="lbl">💬 Discloses</div>
          ${p.conditions.map((c) => `<span class="tag">${esc(c)}</span>`).join('')}
        </div>
      </div>
      <div class="actions">
        <button class="circle-btn pass" data-act="pass" title="Pass">✕</button>
        <button class="circle-btn like" data-act="like" title="Like">♥</button>
      </div>
      <div id="match-note"></div>
    </div>`;

  main.querySelector('[data-act="pass"]').addEventListener('click', () => act(main, p.id, true));
  main.querySelector('[data-act="like"]').addEventListener('click', () => act(main, p.id, false));
}

async function act(main, userId, pass) {
  try {
    const { matched } = await api('/likes', { method: 'POST', body: { userId, pass } });
    if (matched) {
      const note = document.getElementById('match-note');
      if (note)
        note.innerHTML = `<div class="notice" style="margin-top:16px;text-align:center">🎉 It's a match! Head to <b>Messages</b> to say hi.</div>`;
      await new Promise((r) => setTimeout(r, 900));
    }
  } catch (e) {
    showErrToast(e.message);
  }
  state.data.deckIdx = (state.data.deckIdx || 0) + 1;
  paintCard(main);
}

function showErrToast(msg) {
  console.warn(msg);
}

// ---------- Matches ----------
async function renderMatches(main) {
  main.innerHTML = '<div class="spinner" style="text-align:center;padding:40px">Loading matches…</div>';
  let matches = [];
  try {
    ({ matches } = await api('/matches'));
  } catch (e) {
    main.innerHTML = `<div class="error">${esc(e.message)}</div>`;
    return;
  }
  if (!matches.length) {
    main.innerHTML = `
      <div class="empty">
        <div class="big">💜</div>
        <h2>No matches yet</h2>
        <p>When you and someone else both like each other, they'll show up here.</p>
        <button class="btn" id="go-discover">Start discovering</button>
      </div>`;
    document.getElementById('go-discover').addEventListener('click', () => nav('discover'));
    return;
  }
  main.innerHTML = `
    <h2 style="margin:6px 0 18px">Your matches</h2>
    <div class="grid">
      ${matches
        .map(
          (m) => `
        <div class="match-card">
          <div class="avatar">${esc(m.photoEmoji)}</div>
          <h3 style="margin:8px 0 2px">${esc(m.displayName)}, ${m.age}</h3>
          <div class="sub" style="color:var(--muted);font-size:13px">${esc(m.gender)}${
            m.location ? ' · ' + esc(m.location) : ''
          }</div>
          <div style="margin:10px 0">${m.conditions.map((c) => `<span class="tag">${esc(c)}</span>`).join('')}</div>
          <button class="btn sm" data-chat="${m.id}">Message</button>
        </div>`
        )
        .join('')}
    </div>`;
  main.querySelectorAll('[data-chat]').forEach((b) =>
    b.addEventListener('click', () => {
      state.data.activeChat = Number(b.dataset.chat);
      nav('chat');
    })
  );
}

// ---------- Chat ----------
async function renderChat(main) {
  main.innerHTML = '<div class="spinner" style="text-align:center;padding:40px">Loading…</div>';
  let matches = [];
  try {
    ({ matches } = await api('/matches'));
  } catch (e) {
    main.innerHTML = `<div class="error">${esc(e.message)}</div>`;
    return;
  }
  if (!matches.length) {
    main.innerHTML = `<div class="empty"><div class="big">✉️</div><h2>No conversations yet</h2><p>Match with someone first to start chatting.</p></div>`;
    return;
  }
  if (!state.data.activeChat || !matches.find((m) => m.id === state.data.activeChat)) {
    state.data.activeChat = matches[0].id;
  }
  const active = matches.find((m) => m.id === state.data.activeChat);

  main.innerHTML = `
    <div class="chat-wrap">
      <div class="chat-list">
        ${matches
          .map(
            (m) => `
          <button class="chat-list-item ${m.id === active.id ? 'active' : ''}" data-open="${m.id}">
            <div class="mini">${esc(m.photoEmoji)}</div>
            <div>
              <div class="who">${esc(m.displayName)}</div>
              <div class="snippet">${m.lastMessage ? esc(m.lastMessage) : 'Say hello 👋'}</div>
            </div>
          </button>`
          )
          .join('')}
      </div>
      <div class="chat-panel">
        <div class="chat-head">
          <div class="mini" style="width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:var(--bg-soft);font-size:20px">${esc(
            active.photoEmoji
          )}</div>
          <div><b>${esc(active.displayName)}</b>, ${active.age}
            <div style="font-size:12px;color:var(--muted)">${active.conditions
              .map((c) => esc(c))
              .join(' · ')}</div>
          </div>
        </div>
        <div class="messages" id="messages"></div>
        <form class="chat-input" id="chat-form">
          <input id="chat-text" placeholder="Write a message…" autocomplete="off" maxlength="2000" />
          <button class="btn" type="submit">Send</button>
        </form>
      </div>
    </div>`;

  main.querySelectorAll('[data-open]').forEach((b) =>
    b.addEventListener('click', () => {
      state.data.activeChat = Number(b.dataset.open);
      renderChat(main);
    })
  );

  await loadMessages(active.id);
  document.getElementById('chat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-text');
    const body = input.value.trim();
    if (!body) return;
    input.value = '';
    try {
      await api('/messages/' + active.id, { method: 'POST', body: { body } });
      await loadMessages(active.id);
    } catch (err) {
      showErrToast(err.message);
    }
  });
}

async function loadMessages(otherId) {
  const box = document.getElementById('messages');
  if (!box) return;
  try {
    const { messages } = await api('/messages/' + otherId);
    if (!messages.length) {
      box.innerHTML = `<div style="margin:auto;text-align:center;color:var(--muted)">This is the start of your conversation.<br/>Break the ice 💜</div>`;
    } else {
      box.innerHTML = messages
        .map((m) => `<div class="bubble ${m.fromMe ? 'me' : 'them'}">${esc(m.body)}</div>`)
        .join('');
    }
    box.scrollTop = box.scrollHeight;
  } catch (e) {
    box.innerHTML = `<div class="error">${esc(e.message)}</div>`;
  }
}

// ---------- Profile ----------
function renderProfile(main) {
  const u = state.user;
  state.data.edit = { seeking: [...u.seeking], conditions: [...u.conditions], photoEmoji: u.photoEmoji };
  const ed = state.data.edit;
  const emojis = ['🙂', '😊', '😎', '🥰', '🌻', '🦋', '🌈', '🔥', '🎧', '📚', '🌙', '🐱'];

  main.innerHTML = `
    <div style="max-width:620px;margin:0 auto">
      <div class="card">
        <div style="text-align:center">
          <div class="avatar">${esc(u.photoEmoji)}</div>
          <h2 style="margin:8px 0 2px">${esc(u.displayName)}</h2>
          <div class="sub" style="color:var(--muted)">${esc(u.email)}</div>
        </div>
        <div id="err"></div>
        <div id="saved"></div>

        <label>Avatar</label>
        <div class="emoji-picker" id="p-emoji">
          ${emojis.map((e) => `<button type="button" class="${ed.photoEmoji === e ? 'on' : ''}" data-e="${e}">${e}</button>`).join('')}
        </div>

        <label>Open to meeting</label>
        <div class="chips" id="p-seeking">
          ${state.meta.genders
            .map((g) => `<button type="button" class="chip ${ed.seeking.includes(g) ? 'on' : ''}" data-g="${esc(g)}">${esc(g)}</button>`)
            .join('')}
        </div>

        <label>Health disclosure <span style="color:var(--primary-2)">*required</span></label>
        <div class="chips" id="p-conditions" style="margin-top:8px">
          ${state.meta.conditions
            .map((c) => `<button type="button" class="chip ${ed.conditions.includes(c) ? 'on' : ''}" data-c="${esc(c)}">${esc(c)}</button>`)
            .join('')}
        </div>
        <div style="margin-top:8px">${u.conditions.map((c) => `<span class="tag">${esc(c)}</span>`).join('')}</div>

        <label>Orientation</label>
        <input id="p-orient" maxlength="40" value="${esc(u.orientation)}" />
        <label>Location</label>
        <input id="p-loc" maxlength="80" value="${esc(u.location)}" />
        <label>About you</label>
        <textarea id="p-bio" maxlength="600">${esc(u.bio)}</textarea>

        <div style="height:16px"></div>
        <button class="btn block" id="p-save">Save changes</button>
      </div>
    </div>`;

  main.querySelectorAll('#p-seeking .chip').forEach((c) =>
    c.addEventListener('click', () => {
      toggle(ed.seeking, c.dataset.g);
      c.classList.toggle('on');
    })
  );
  main.querySelectorAll('#p-conditions .chip').forEach((c) =>
    c.addEventListener('click', () => {
      toggle(ed.conditions, c.dataset.c);
      c.classList.toggle('on');
    })
  );
  main.querySelectorAll('#p-emoji button').forEach((b) =>
    b.addEventListener('click', () => {
      ed.photoEmoji = b.dataset.e;
      main.querySelectorAll('#p-emoji button').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
    })
  );

  document.getElementById('p-save').addEventListener('click', async () => {
    const payload = {
      seeking: ed.seeking,
      conditions: ed.conditions,
      photoEmoji: ed.photoEmoji,
      orientation: document.getElementById('p-orient').value.trim(),
      location: document.getElementById('p-loc').value.trim(),
      bio: document.getElementById('p-bio').value.trim(),
    };
    try {
      const { user } = await api('/auth/me', { method: 'PATCH', body: payload });
      state.user = user;
      document.getElementById('saved').innerHTML = `<div class="notice" style="margin-top:12px">✅ Profile saved.</div>`;
      setTimeout(() => renderProfile(main), 700);
    } catch (e) {
      showErr('err', e.message);
    }
  });
}

boot();
