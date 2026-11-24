(() => {
  const { DAYS, DAY_NAMES, MEALS } = Engine;
  const $ = (id) => document.getElementById(id);
  const ALLERGENS = ['dairy', 'egg', 'gluten', 'nuts', 'fish'];
  const TIMES = { breakfast: '8:00', lunch: '12:30', snack: '4:00', dinner: '7:00' };
  const EXAMPLES = ['No dairy for now', 'Ragi twice a week', 'Only fruit on Sundays', 'Iron-rich food 5 days a week', 'সপ্তাহে তিনদিন মাছ', 'No dinner on Saturday'];

  const fresh = () => ({ profile: null, rules: [], swaps: {}, posts: [], chat: [], prefs: { bn: true }, groceryDone: {}, done: {}, hide: {}, play: [], playPosts: [], updatedAt: 0 });
  const normalize = (s) => ({ ...fresh(), ...(s || {}), prefs: { bn: true, ...((s && s.prefs) || {}) } });
  let state = fresh();
  let ui = { day: todayKey(), view: 'day', week: 0, gro: 1 };
  let account = null, syncTimer = null, resetToken = null, acctView = 'out';

  // On-device copy lives in IndexedDB (see store.js) so the PWA works fully offline.
  async function loadState() {
    let s = await Store.get('state');
    if (!s) { // migrate from the earlier localStorage versions
      try { s = JSON.parse(localStorage.getItem('littlebites.v2')) || JSON.parse(localStorage.getItem('littlebites.v1')); } catch (_) {}
      if (s) Store.set('state', s);
    }
    return s;
  }
  function save() { Store.set('state', state); }
  function todayKey() { return DAYS[(new Date().getDay() + 6) % 7]; }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // ---------- sync (local-first, last-write-wins) ----------
  async function api(path, opts = {}) {
    try {
      const r = await fetch(path, { headers: { 'content-type': 'application/json' }, ...opts });
      let json = null; try { json = await r.json(); } catch (_) {}
      return { ok: r.ok, status: r.status, json: json || {} };
    } catch (_) { return { ok: false, status: 0, json: {} }; }
  }
  const setSync = (m) => { $('syncState').textContent = m; };
  function touch() { state.updatedAt = Date.now(); save(); if (account) { clearTimeout(syncTimer); syncTimer = setTimeout(push, 800); setSync('Saving…'); } }
  async function push() {
    const r = await api('/api/state', { method: 'PUT', body: JSON.stringify({ state, updatedAt: state.updatedAt }) });
    if (!r.ok) return setSync(r.status === 401 ? 'Signed out' : 'Offline: will sync when back online');
    if (r.json.conflict) adopt(r.json); else setSync('Synced just now');
  }
  function adopt(j) {
    if (!j.state) return;
    state = normalize(j.state); state.updatedAt = j.updatedAt; save(); render(); setSync('Synced just now');
  }
  async function pull() {
    if (!account) return;
    const r = await api('/api/state');
    if (r.status === 401) { account = null; renderAcct(); return; }
    if (!r.ok) return setSync('Offline: will sync when back online');
    if (r.json.state && r.json.updatedAt > state.updatedAt) adopt(r.json);
    else if (state.updatedAt > (r.json.updatedAt || 0)) push();
    else setSync('Synced just now');
  }
  function showAcct(v) {
    acctView = v;
    [['out', 'acctOut'], ['forgot', 'acctForgot'], ['reset', 'acctReset'], ['in', 'acctIn']].forEach(([k, id]) => { $(id).style.display = k === v ? '' : 'none'; });
  }
  function renderAcct() {
    $('acctBtn').textContent = account ? account.email.split('@')[0] : 'Sign in';
    if (acctView !== 'reset' && acctView !== 'forgot') showAcct(account ? 'in' : 'out');
    if (account) {
      $('aWho').textContent = account.email;
      $('aVerified').innerHTML = account.verified ? 'Email verified ✓' : 'Email not verified yet. <button class="link" id="aResend">Resend email</button>';
    }
  }
  const ACCT_ERR = { invalid: 'Wrong email or password.', exists: 'That email already has an account. Try logging in.', bad_email: 'Please enter a valid email.', weak_password: 'Use at least 8 characters.', rate: 'Too many attempts. Please wait a while.', invalid_token: 'This link has expired or was already used. Please request a new one.' };
  async function handleLink() {
    const m = location.hash.match(/^#(reset|verify)=([\w-]+)$/);
    if (!m) return;
    history.replaceState(null, '', location.pathname + location.search); // keep the token out of history
    if (m[1] === 'reset') { resetToken = m[2]; showAcct('reset'); $('rMsg').textContent = ''; $('account').showModal(); return; }
    const r = await api('/api/verify', { method: 'POST', body: JSON.stringify({ token: m[2] }) });
    if (r.ok && account) account.verified = true;
    acctView = 'out'; renderAcct();
    if (!account) $('aErr').textContent = r.ok ? 'Email confirmed. You can log in.' : ACCT_ERR.invalid_token;
    else $('aVerified').textContent = r.ok ? 'Email verified ✓' : ACCT_ERR.invalid_token;
    $('account').showModal();
  }
  async function auth(kind) {
    const email = $('aEmail').value.trim(), password = $('aPw').value;
    $('aErr').textContent = ''; $('aErr').style.color = '';
    if (!email || password.length < 8) { $('aErr').textContent = 'Enter an email and a password of 8+ characters.'; return; }
    const r = await api('/api/' + kind, { method: 'POST', body: JSON.stringify({ email, password }) });
    if (!r.ok) { $('aErr').textContent = ACCT_ERR[r.json.error] || 'Could not reach the server. Try again.'; return; }
    account = { email: r.json.email, verified: !!r.json.verified }; $('aPw').value = ''; acctView = 'in'; renderAcct();
    const s = await api('/api/state');
    if (s.ok && s.json.state) {
      const useServer = !state.profile || confirm('This account already has saved data. Press OK to use it on this device, or Cancel to replace it with this device\'s data.');
      if (useServer) adopt(s.json); else { touch(); }
    } else if (state.profile) touch();
    setSync('Synced just now'); $('account').close(); render();
  }

  // ---------- rule helpers ----------
  const list = (a, all) => (a && a.length ? a.map((d) => DAY_NAMES[d] || d).join(', ') : all);
  function describe(r) {
    const days = r.days && r.days.length ? ` on ${list(r.days)}` : '';
    const meals = r.meals && r.meals.length ? ` (${r.meals.join(', ')})` : '';
    const age = r.minAge && r.maxAge ? ` · ${r.minAge}–${r.maxAge} mo` : r.minAge ? ` · from ${r.minAge} mo` : r.maxAge ? ` · until ${r.maxAge} mo` : '';
    let t = r.kind;
    if (r.kind === 'exclude') t = `No ${r.target}${days}${meals}`;
    else if (r.kind === 'include') t = `${cap(r.target)} ${r.timesPerWeek}× a week${days}${meals}`;
    else if (r.kind === 'day_only') t = `Only ${r.target}${days}${meals}`;
    else if (r.kind === 'remove_meal') t = `No ${r.meals.join(', ')}${r.days && r.days.length ? ' on ' + list(r.days) : ''}`;
    return t + age;
  }
  function cleanRule(r, post) {
    if (!r || !['exclude', 'include', 'day_only', 'remove_meal'].includes(r.kind)) return null;
    const target = String(r.target || '').toLowerCase().trim().slice(0, 40);
    const days = (Array.isArray(r.days) ? r.days : []).filter((d) => DAYS.includes(d));
    const meals = (Array.isArray(r.meals) ? r.meals : []).filter((m) => MEALS.includes(m));
    if (r.kind !== 'remove_meal' && !target) return null;
    if (r.kind === 'remove_meal' && !meals.length) return null;
    if (r.kind === 'day_only' && !days.length) return null;
    const out = { id: uid(), kind: r.kind, target, days, meals };
    if (r.kind === 'include') out.timesPerWeek = Math.min(7, Math.max(1, parseInt(r.timesPerWeek, 10) || 3));
    const mn = parseInt(r.minAge, 10), mx = parseInt(r.maxAge, 10);
    if (mn >= 6 && mn <= 36) out.minAge = mn;
    if (mx >= 6 && mx <= 36) out.maxAge = mx;
    if (post) out.post = post;
    return out;
  }

  // ---------- instruction parsing: Gemini via server, simple offline fallback ----------
  function vocab() {
    const s = (k) => [...new Set(FOODS.flatMap(k))].sort();
    return { ingredients: s((f) => f.ing), categories: s((f) => [f.cat]), nutrients: s((f) => f.nut), allergens: s((f) => f.a), dishes: FOODS.map((f) => f.n) };
  }
  const NUM = { once: 1, one: 1, twice: 2, two: 2, thrice: 3, three: 3, four: 4, five: 5, six: 6 };
  function localParse(text) {
    const t = text.toLowerCase();
    const add = [];
    const days = DAYS.filter((d) => new RegExp(`\\b${d}`).test(t));
    const meals = MEALS.filter((m) => t.includes(m));
    const resolve = (p) => {
      p = p.replace(/-?rich\b/g, ' ').replace(/\b(any|the|for now|please|food|foods|items?|a|an|on|in|my|baby|him|her)\b/g, ' ').replace(/\s+/g, ' ').trim();
      const v = vocab(); const terms = [...v.allergens, ...v.categories, ...v.nutrients, ...v.ingredients];
      return terms.filter((x) => p.includes(x)).sort((a, b) => b.length - a.length)[0] || p;
    };
    const parts = (s) => s.split(/,| and | or | & /).map((x) => x.trim()).filter(Boolean);
    let m;
    if ((m = t.match(/(?:\bno\b|without|avoid|exclude|remove|skip|stop|allergic to|don'?t (?:give|add|include))\s+([a-z ,&\-]+?)(?:\s+(?:on|for|in)\b.*|$)/))) {
      if (meals.length && /^(breakfast|lunch|snack|dinner)/.test(m[1].trim())) add.push({ kind: 'remove_meal', meals, days });
      else parts(m[1]).forEach((p) => add.push({ kind: 'exclude', target: resolve(p), days, meals }));
    }
    if ((m = t.match(/([a-z \-]+?)\s+(once|twice|thrice|\d)\s*(?:times?|days?)?\s*(?:a|per|every|each)\s*week/))) {
      const n = NUM[m[2]] || parseInt(m[2], 10);
      parts(m[1].replace(/^(add|include|give|feed|more)\s+/, '')).forEach((p) => add.push({ kind: 'include', target: resolve(p), timesPerWeek: n, meals }));
    } else if ((m = t.match(/only\s+([a-z ,&\-]+?)(?:\s+on\b.*|\s+for\b.*|$)/)) && days.length) {
      parts(m[1]).forEach((p) => add.push({ kind: 'day_only', target: resolve(p), days, meals }));
    } else if ((m = t.match(/(?:add|include|more|give)\s+([a-z ,&\-]+?)(?:\s+(?:every|daily|on)\b.*|$)/)) && !add.length) {
      parts(m[1]).forEach((p) => add.push({ kind: 'include', target: resolve(p), timesPerWeek: 4, meals }));
    }
    return { add, remove: [], reply: add.length ? 'Done (offline mode: English, simple phrasing only).' : "I couldn't understand that offline. Try 'no paneer', 'ragi twice a week' or 'only fruit on Sunday'. Bengali and Hindi need the online connection.", notes: [] };
  }

  // ---------- influencer post guidance ----------
  function shrinkImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file); const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 1400 / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        resolve({ type: 'image/jpeg', data: c.toDataURL('image/jpeg', 0.85).split(',')[1] });
      };
      img.onerror = () => reject(new Error('image'));
      img.src = url;
    });
  }
  const errText = (r) => r.status === 503 ? 'Reading posts needs the AI connection, which is not set up on this server.' : r.status === 429 ? 'Too many requests this hour. Please try again later.' : (r.json && r.json.error === 'upstream' && (r.json.detail === 401 || r.json.detail === 403)) ? 'Reading posts is unavailable: the server\'s Gemini API key was rejected. The site owner needs to update GEMINI_API_KEY.' : (r.json && r.json.error === 'bad_url') ? 'That does not look like a public link. Paste the full address (https://...) of a public post.' : (r.json && (r.json.error === 'unreadable' || r.json.error === 'fetch_failed' || r.json.error === 'timeout')) ? 'I could not read that link. Instagram, Facebook and X often hide posts behind a login. Paste the caption or upload a screenshot instead.' : 'Could not read the post. Please try again.';
  // ---------- chat: menu instructions and shared posts, one conversation ----------
  const chat = { image: null, busy: false };
  const CHAT_CAP = 40;
  const addMsg = (m) => { state.chat = (state.chat || []).concat(m).slice(-CHAT_CAP); };
  const clip = (v, n) => String(v == null ? '' : v).replace(/[<>]/g, '').trim().slice(0, n);
  function msgHtml(m, i) {
    if (m.role === 'user') return `<div class="msg me"><div class="bub">${esc(m.text)}${m.img ? '<div class="tip" style="color:#ffe3ec">Screenshot attached</div>' : ''}</div></div>`;
    let h = esc(m.text).replace(/\n/g, '<br>');
    const changes = (m.savedText || []).map((t) => '<div>+ ' + esc(t) + '</div>').concat((m.removedText || []).map((t) => '<div>− ' + esc(t) + '</div>'));
    if (m.undone) h += '<div class="tip">Undone. Nothing from this message is saved.</div>';
    else if (changes.length) {
      h += `<div class="saved-list"><b>Saved to your menu</b>${changes.join('')}</div>`;
      h += `<button class="undo" data-undo="${i}">Undo</button> <button class="link" data-tab="menu">View menu</button>`;
    }
    (m.review || []).forEach((s, j) => {
      h += `<div class="rev"><b>${esc(describe(s.rule))}</b>${s.why ? `<br><span class="tip">${esc(s.why)}</span>` : ''}${s.caution ? `<span class="cw">${esc(s.caution)}</span>` : ''}` +
        (s.added ? '<div class="tip">Added.</div>' : m.undone ? '' : `<button data-addrev="${i}:${j}">Add anyway</button>`) + '</div>';
    });
    if ((m.notes || []).length) h += `<div class="tip"><i>${m.notes.map(esc).join(' ')}</i></div>`;
    if (m.link) h += `<div class="tip"><a href="${esc(m.link)}" target="_blank" rel="noopener noreferrer">Source link</a></div>`;
    return `<div class="msg bot${m.error ? ' err' : ''}"><div class="bub">${h}</div></div>`;
  }
  function renderChat(typing) {
    const log = $('chatLog'); if (!log) return;
    const msgs = state.chat || [];
    const hello = `<div class="msg bot"><div class="bub">Hi! Tell me how you'd like the menu to change, in English, বাংলা or हिन्दी. You can also paste a link to a post, paste its caption or attach a screenshot. I'll work out what it means for your baby and save the rules.</div></div><div class="ex" id="examples">${EXAMPLES.map((x) => `<button data-ex="${esc(x)}">${esc(x)}</button>`).join('')}</div>`;
    log.innerHTML = (msgs.length ? msgs.map(msgHtml).join('') : hello) + (typing ? '<div class="msg bot"><div class="bub typing" aria-label="Thinking"><i></i><i></i><i></i></div></div>' : '');
    log.scrollTop = log.scrollHeight;
  }
  function ensurePost(m) {
    if (m.postId || !m.post) return m.postId;
    m.postId = uid();
    state.posts.unshift({ id: m.postId, source: m.post.source, language: m.post.language, summary: m.post.summary, date: new Date().toISOString().slice(0, 10), rules: 0, ...(m.link ? { link: m.link } : {}) });
    return m.postId;
  }
  function undoMsg(i) {
    const m = (state.chat || [])[i]; if (!m || m.undone) return;
    const ids = m.saved || [];
    state.rules = state.rules.filter((r) => !ids.includes(r.id)).concat(m.removed || []);
    if (m.postId && !state.rules.some((r) => r.post === m.postId)) state.posts = state.posts.filter((p) => p.id !== m.postId);
    m.undone = true; touch(); render(); renderChat();
  }
  function addReview(i, j) {
    const m = (state.chat || [])[i], s = m && m.review && m.review[j]; if (!s || s.added) return;
    const pid = ensurePost(m);
    const r = { ...s.rule, id: uid() }; if (pid) { r.post = pid; const p = state.posts.find((x) => x.id === pid); if (p) p.rules++; }
    state.rules.push(r); s.added = true; (m.saved = m.saved || []).push(r.id); (m.savedText = m.savedText || []).push(describe(r));
    touch(); render(); renderChat();
  }
  async function sendChat() {
    if (chat.busy) return;
    const text = $('chatIn').value.trim(), image = chat.image;
    if (!text && !image) return;
    chat.busy = true; $('chatSend').disabled = true;
    const history = (state.chat || []).filter((m) => !m.error).slice(-8).map((m) => ({ role: m.role, text: m.text }));
    addMsg({ role: 'user', text, img: !!image });
    $('chatIn').value = ''; $('chatIn').style.height = ''; chat.image = null; $('chatChip').hidden = true; $('chatImg').value = '';
    renderChat(true);
    const r = await api('/api/chat', { method: 'POST', body: JSON.stringify({ text, image, history, vocab: vocab(), rules: state.rules.map((x) => ({ id: x.id, summary: describe(x) })), context: { ageMonths: current ? current.age : 6, allergies: (state.profile && state.profile.allergies) || [] } }) });
    let m;
    if (r.ok) m = interpret(r.json);
    else if ((r.status === 0 || r.status === 503) && !image && !/https?:\/\//i.test(text)) {
      const local = localParse(text), added = local.add.map((x) => cleanRule(x)).filter(Boolean);
      state.rules.push(...added);
      m = { role: 'bot', text: local.reply, saved: added.map((x) => x.id), savedText: added.map(describe), removed: [], removedText: [] };
    } else m = { role: 'bot', error: true, text: chatErr(r) };
    addMsg(m); touch(); render(); renderChat();
    chat.busy = false; $('chatSend').disabled = false;
  }
  function chatErr(r) {
    const e = r.json && r.json.error;
    if (r.status === 503) return 'The chat needs the AI connection, which is not set up on this server.';
    if (r.status === 429) return 'Too many requests this hour. Please try again later.';
    if (e === 'upstream' && (r.json.detail === 401 || r.json.detail === 403)) return 'The chat is unavailable: the server\'s Gemini API key was rejected. The site owner needs to update GEMINI_API_KEY.';
    if (e === 'bad_url') return 'That does not look like a public link. Paste the full address (https://...) of a public post.';
    if (e === 'unreadable' || e === 'fetch_failed' || e === 'timeout') return 'I could not read that link. Instagram, Facebook and X often hide posts behind a login. Paste the caption or attach a screenshot instead.';
    if (e === 'bad_image') return 'I could not use that image. Try a PNG or JPG.';
    return 'Something went wrong. Please try again.';
  }
  function interpret(res) {
    const removeIds = (Array.isArray(res.remove) ? res.remove : []).filter((x) => typeof x === 'string');
    const removed = state.rules.filter((x) => removeIds.includes(x.id));
    state.rules = state.rules.filter((x) => !removeIds.includes(x.id));
    const added = (Array.isArray(res.add) ? res.add : []).slice(0, 8).map((x) => cleanRule(x)).filter(Boolean);
    const g = res.post && typeof res.post === 'object' ? res.post : null;
    const src = res.source && /^https?:\/\//.test(res.source.url || '') ? res.source : null;
    const m = { role: 'bot', text: String(res.reply || '').slice(0, 900) || 'Done.', saved: [], savedText: [], removed, removedText: removed.map(describe), notes: (Array.isArray(res.notes) ? res.notes : []).slice(0, 4).map((x) => String(x).slice(0, 300)), review: [] };
    if (g) { m.post = { source: clip(g.source || (src && (src.author || src.host)) || 'Saved post', 60), language: clip(g.language, 40), summary: clip(g.summary_en, 600) }; if (src) m.link = src.url.slice(0, 300); }
    if (g && added.length) { const pid = ensurePost(m); added.forEach((x) => { x.post = pid; }); state.posts[0].rules = added.length; }
    state.rules.push(...added);
    m.saved = added.map((x) => x.id); m.savedText = added.map(describe);
    m.review = (Array.isArray(res.review) ? res.review : []).slice(0, 8).map((s) => ({ rule: cleanRule(s && s.rule), why: clip(s && s.why, 300), caution: clip(s && s.caution, 300) })).filter((s) => s.rule);
    return m;
  }

  // ---------- rendering ----------
  let current, planKey = '';
  function plan() {
    state.profile.ageMonths = Engine.profileAge(state.profile);
    // Planning 52 weeks costs a few hundred ms with rules, so only rebuild when the inputs (or the day) change.
    const key = JSON.stringify([state.profile, state.rules, state.swaps, new Date().toDateString()]);
    if (key !== planKey) { current = Engine.buildPlan(FOODS, state.profile, state.rules, state.swaps); planKey = key; }
    return current;
  }
  const fmtDay = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const dayDate = (wk, d) => { const x = new Date(wk.start); x.setDate(x.getDate() + DAYS.indexOf(d)); return x; };
  function stageText(age) {
    if (age < 7) return ['6 months: first tastes', 'Four small tasting meals a day: 1 to 3 spoonfuls of smooth purée or thin mash each. Breast/formula milk is still the main nutrition.'];
    if (age < 8) return ['7 months: thicker mashes', 'Four small meals: thicker, slightly textured mashes, one new food at a time, 3 to 5 spoonfuls. Milk feeds continue.'];
    if (age < 9) return ['8 months: lumps & finger foods', 'Four meals: coarse mashes with soft lumps and first finger foods (soft sticks, torn pieces). Fish, chicken and egg can be offered if your diet setting includes them.'];
    if (age < 12) return ['9-11 months: building variety', 'Four meals: mashed and finely chopped foods, more finger foods, bigger portions. Offer water in a cup.'];
    return ['12+ months: joining family meals', 'Four meals: soft chopped family foods. Keep salt and sugar low.'];
  }
  function render() {
    renderAcct();
    const p = state.profile; if (!p) return;
    Play.render();
    const all = plan();
    ui.week = Math.min(ui.week, all.weeks.length - 1);
    const w = all.weeks[ui.week];
    $('who').textContent = `${p.name ? p.name + ', ' : ''}${all.age} mo`;
    const [t, d] = stageText(w.age);
    const early = Engine.profileAge(p) < 6 ? '<br><b style="display:inline">Note:</b> <span>Menu starts at 6 months; check with your paediatrician before starting solids.</span>' : '';
    $('stage').innerHTML = `<b>${t}</b><span>${d}</span>${early}`;
    $('viewSeg').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === ui.view));
    const auto = !p.ageOverride, nowAge = Engine.profileAge(p);
    $('ageSel').innerHTML = `<option value="auto"${auto ? ' selected' : ''}>Automatic${p.dob ? ' (from date of birth)' : ''}: ${Math.max(6, nowAge)} mo</option>` +
      Array.from({ length: 19 }, (_, i) => i + 6).map((m) => `<option value="${m}"${!auto && m === Math.max(6, nowAge) ? ' selected' : ''}>${m} months${m >= 12 ? ` (${(m / 12).toFixed(m % 12 ? 1 : 0)} yr)` : ''}</option>`).join('');
    $('ageUp').disabled = nowAge >= 24;
    $('weeks').innerHTML = all.weeks.map((x) => {
      const end = new Date(x.start); end.setDate(end.getDate() + 6);
      return `<button data-wk="${x.week}" class="${x.week === ui.week ? 'on' : ''}">Week ${x.week + 1}${x.week >= Engine.WEEKS ? `<small class="rep">${x.repeatOf != null ? `repeats wk ${x.repeatOf + 1}` : 'updated for age'}</small>` : ''}<small>${fmtDay(x.start)} – ${fmtDay(end)}</small><small>${x.age} mo${x.age !== all.age ? ' ↑' : ''}</small></button>`;
    }).join('');
    const onBtn = $('weeks').querySelector('.on'); if (onBtn && onBtn.scrollIntoView) onBtn.scrollIntoView({ inline: 'center', block: 'nearest' });
    $('days').style.display = ui.view === 'day' ? 'flex' : 'none';
    $('days').innerHTML = DAYS.map((d) => `<button data-d="${d}" class="${d === ui.day ? 'on' : ''}">${DAY_NAMES[d].slice(0, 3)}<small>${ui.week === 0 && d === todayKey() ? 'today' : fmtDay(dayDate(w, d))}</small></button>`).join('');
    $('menu').innerHTML = (ui.view === 'day' ? dayView(w, all) : weekView(w, all)) +
      (w.warnings.length ? `<div class="reply warn">${w.warnings.map(esc).join('<br>')}</div>` : '');
    renderSaved();
    renderGrocery(all);
  }
  function renderSaved() {
    const postName = (id) => { const x = state.posts.find((q) => q.id === id); return x ? x.source : ''; };
    $('savedSum').textContent = `Saved rules${state.rules.length ? ` (${state.rules.length})` : ''}`;
    $('rules').innerHTML = state.rules.length
      ? state.rules.map((r) => `<li><span>${esc(describe(r))}${r.post ? `<small>from ${esc(postName(r.post))}</small>` : ''}</span><button data-del="${r.id}" aria-label="Remove rule">×</button></li>`).join('')
      : '<li class="empty">No custom rules yet. Showing the default menu.</li>';
    $('posts').innerHTML = state.posts.map((x) => `<li><span><b>${esc(x.source)}</b> <small>${esc(x.language)} · ${esc(x.date)} · ${x.rules} rule(s)</small>${esc(x.summary)}</span><button data-delpost="${x.id}" aria-label="Remove post and its rules">×</button></li>`).join('');
  }
  // ---------- grocery list ----------
  // Built from the weeks selected in the strip: this week, this + next week, or four weeks from there.
  function groceryRange(all) {
    const first = ui.week, last = Math.min(first + ui.gro, all.weeks.length) - 1;
    const a = all.weeks[first], b = all.weeks[last];
    const end = new Date(b.start); end.setDate(end.getDate() + 6);
    const label = (first === last ? `Week ${first + 1}` : `Weeks ${first + 1}–${last + 1}`) + ` · ${fmtDay(a.start)} – ${fmtDay(end)}`;
    return { weeks: all.weeks.slice(first, last + 1), label, key: `${first}-${last}` };
  }
  const groDone = (range) => (item) => !!(state.groceryDone && state.groceryDone[`${range.key}|${item}`]);
  function renderGrocery(all) {
    const range = groceryRange(all), list = Grocery.build(range.weeks, DAYS, all.meals), done = groDone(range);
    $('groSeg').querySelectorAll('button').forEach((b) => b.classList.toggle('on', +b.dataset.gro === ui.gro));
    $('groRange').textContent = `${range.label} · ${list.itemCount} items for ${list.mealCount} meals`;
    $('groList').innerHTML = list.groups.map((g) => `<div class="gro-group">${esc(g.title)}</div>` + g.items.map((i) =>
      `<label class="gro-item${done(i.label) ? ' done' : ''}"><input type="checkbox" data-gitem="${esc(i.label)}" ${done(i.label) ? 'checked' : ''}><span class="t">${esc(i.label)}<small>${esc(i.dishes.slice(0, 3).join(', '))}${i.dishes.length > 3 ? ` +${i.dishes.length - 3} more` : ''}</small></span><span class="n">${i.meals} ${i.meals === 1 ? 'meal' : 'meals'}</span></label>`).join('')).join('') || '<div class="tip">No meals planned for this range.</div>';
    groCur = { range, list };
  }
  let groCur = null;
  const groText = () => Grocery.toText(groCur.range.label, groCur.list, groDone(groCur.range));
  const groMsg = (t) => { $('groMsg').textContent = t; setTimeout(() => { if ($('groMsg').textContent === t) $('groMsg').textContent = ''; }, 3000); };
  $('groSeg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { ui.gro = +b.dataset.gro; render(); } });
  $('groList').addEventListener('change', (e) => {
    const k = e.target.dataset.gitem; if (k == null || !groCur) return;
    state.groceryDone = state.groceryDone || {};
    const key = `${groCur.range.key}|${k}`;
    if (e.target.checked) state.groceryDone[key] = 1; else delete state.groceryDone[key];
    e.target.closest('.gro-item').classList.toggle('done', e.target.checked); touch();
  });
  $('groClear').addEventListener('click', () => {
    if (!groCur) return;
    Object.keys(state.groceryDone || {}).filter((k) => k.startsWith(groCur.range.key + '|')).forEach((k) => delete state.groceryDone[k]);
    touch(); render();
  });
  $('groCopy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(groText()); groMsg('List copied. Paste it into Notes or a message.'); } catch (_) { groMsg('Could not copy here. Use Download instead.'); }
  });
  $('groSave').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([groText()], { type: 'text/plain' }));
    a.download = `little-bites-grocery-${groCur.range.key}.txt`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    groMsg('Saved.');
  });

  function dayView(w, all) {
    const rows = all.meals.map((m) => {
      const f = w.plan[ui.day][m], lock = w.locked[ui.day][m];
      if (!f) return `<div class="card meal m-${m}"><div class="time"><b>${m}</b>${TIMES[m]}</div><div class="body skipped">Skipped</div></div>`;
      const chips = f.nut.slice(0, 3).map((n) => `<span class="chip">${esc(n)}</span>`).join('') +
        (lock === 'rule' ? '<span class="chip lock">from your rules</span>' : '') + (lock === 'manual' ? '<span class="chip man">your pick</span>' : '') +
        (f.tags.includes('finger') ? '<span class="chip">finger food</span>' : '');
      return `<div class="card meal m-${m}"><div class="time"><b>${m}</b>${TIMES[m]}</div><div class="body"><h3>${esc(f.n)}</h3>${state.prefs.bn && f.bn ? `<div class="bn" lang="bn">${esc(f.bn)}</div>` : ''}<div class="chips">${chips}</div><div class="tip">${esc(f.tip)}</div>
        ${lock === 'rule' ? '' : `<div class="acts"><button class="link" data-swap="${w.cycle}|${ui.day}|${m}">Swap this dish</button></div>`}</div></div>`;
    }).join('');
    return `<div>${rows}</div><div class="milk">Breast/formula milk continues on demand between meals.</div>`;
  }
  function weekView(w, all) {
    const head = DAYS.map((d) => `<th class="${ui.week === 0 && d === todayKey() ? 'today' : ''}">${DAY_NAMES[d].slice(0, 3)}</th>`).join('');
    const body = all.meals.map((m) => `<tr><th style="text-transform:capitalize">${m}</th>${DAYS.map((d) => {
      const f = w.plan[d][m]; return `<td data-go="${d}" class="${w.locked[d][m] === 'rule' ? 'lk' : ''}">${f ? esc(f.n) : '<i>skipped</i>'}${f && state.prefs.bn && f.bn ? `<br><span class="bn" lang="bn">${esc(f.bn)}</span>` : ''}</td>`;
    }).join('')}</tr>`).join('');
    return `<div class="weekwrap"><table class="week"><tr><th></th>${head}</tr>${body}</table></div><div class="tip" style="margin-top:6px">Green cells come from your rules. Tap a cell to open that day.</div>`;
  }
  function swap(key) {
    const [, day, meal] = key.split('|'); const wk = current.weeks[ui.week];
    const cands = Engine.candidates(FOODS, { ...state.profile, ageMonths: wk.age }, state.rules, day, meal);
    if (cands.length < 2) return;
    const cur = wk.plan[day][meal];
    const i = cands.findIndex((f) => f.id === (cur && cur.id));
    state.swaps[key] = cands[(i + 1) % cands.length].id;
    touch(); render();
  }

  // ---------- setup dialog ----------
  function openSetup() {
    const p = state.profile || {};
    $('bName').value = p.name || ''; $('bDob').value = p.dob || ''; $('bDiet').value = p.diet || 'veg';
    $('bDob').max = new Date().toISOString().slice(0, 10); $('bBn').checked = state.prefs.bn !== false;
    $('bAllergies').innerHTML = ALLERGENS.map((a) => `<label><input type="checkbox" value="${a}" ${(p.allergies || []).includes(a) ? 'checked' : ''}> ${cap(a)}</label>`).join('');
    $('setup').showModal();
  }
  $('setupForm').addEventListener('submit', () => {
    state.profile = {
      name: $('bName').value.trim(), dob: $('bDob').value, diet: $('bDiet').value,
      allergies: [...$('bAllergies').querySelectorAll('input:checked')].map((i) => i.value),
      ageOverride: state.profile && state.profile.ageOverride,
      seed: (state.profile && state.profile.seed) || Math.floor(Math.random() * 1e6),
    };
    state.prefs.bn = $('bBn').checked; state.swaps = {}; touch(); render();
  });

  // ---------- age control ----------
  // A manual age is stored with the date it was set, so it keeps advancing automatically from then on.
  function setAge(v) {
    if (v === 'auto') delete state.profile.ageOverride;
    else state.profile.ageOverride = { months: +v, since: new Date().toISOString().slice(0, 10) };
    state.swaps = {}; touch(); render();
  }
  $('ageSel').addEventListener('change', (e) => setAge(e.target.value));
  $('ageUp').addEventListener('click', () => setAge(String(Engine.profileAge(state.profile) + 1)));

  // ---------- events ----------
  function setTab(t) { document.body.dataset.tab = t; document.querySelectorAll('.tabbar button').forEach((b) => b.classList.toggle('on', b.dataset.tab === t)); scrollTo(0, 0); }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('button,td'); if (!b) return;
    if (b.dataset.wk) { ui.week = +b.dataset.wk; render(); }
    else if (b.dataset.d) { ui.day = b.dataset.d; render(); }
    else if (b.dataset.v) { ui.view = b.dataset.v; render(); }
    else if (b.dataset.go) { ui.day = b.dataset.go; ui.view = 'day'; render(); }
    else if (b.dataset.swap) swap(b.dataset.swap);
    else if (b.dataset.del) { state.rules = state.rules.filter((r) => r.id !== b.dataset.del); touch(); render(); renderChat(); }
    else if (b.dataset.delpost) { state.rules = state.rules.filter((r) => r.post !== b.dataset.delpost); state.posts = state.posts.filter((p) => p.id !== b.dataset.delpost); touch(); render(); renderChat(); }
    else if (b.dataset.tab) setTab(b.dataset.tab);
    else if (b.dataset.ex) { $('chatIn').value = b.dataset.ex; $('chatIn').focus(); }
    else if (b.dataset.undo) undoMsg(+b.dataset.undo);
    else if (b.dataset.addrev) { const [i, j] = b.dataset.addrev.split(':').map(Number); addReview(i, j); }
    else if (b.dataset.acct) { showAcct(b.dataset.acct); }
    else if (b.id === 'aResend') { api('/api/verify/resend', { method: 'POST', body: '{}' }).then((r) => { $('aVerified').textContent = r.ok ? 'Verification email sent. Check your inbox.' : ACCT_ERR[r.json.error] || 'Could not send. Try again later.'; }); }
  });
  document.querySelectorAll('.appsw button').forEach((b) => b.addEventListener('click', () => {
    document.body.dataset.app = b.dataset.app; document.querySelectorAll('.appsw button').forEach((x) => x.classList.toggle('on', x === b)); scrollTo(0, 0); Play.render();
  }));
  Play.init({ $, esc, uid, api, touch, state: () => state, age: () => Engine.profileAge(state.profile), shrink: shrinkImage, errText });
  $('chatForm').addEventListener('submit', (e) => { e.preventDefault(); sendChat(); });
  $('chatIn').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); sendChat(); } });
  $('chatIn').addEventListener('input', (e) => { const t = e.target; t.style.height = 'auto'; t.style.height = Math.min(140, t.scrollHeight) + 'px'; });
  $('chatImg').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { chat.image = await shrinkImage(f); $('chatChip').hidden = false; } catch (_) { chat.image = null; e.target.value = ''; addMsg({ role: 'bot', error: true, text: chatErr({ json: { error: 'bad_image' } }) }); renderChat(); }
  });
  $('chatClearImg').addEventListener('click', () => { chat.image = null; $('chatImg').value = ''; $('chatChip').hidden = true; });
  $('settingsBtn').addEventListener('click', openSetup);
  $('acctBtn').addEventListener('click', () => { acctView = 'out'; renderAcct(); $('aErr').textContent = ''; $('aErr').style.color = ''; $('account').showModal(); });
  $('aForgot').addEventListener('click', () => { showAcct('forgot'); $('fMsg').textContent = ''; $('fMsg').style.color = ''; $('fEmail').value = $('aEmail').value; });
  $('forgotForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await api('/api/forgot', { method: 'POST', body: JSON.stringify({ email: $('fEmail').value.trim() }) });
    $('fMsg').style.color = 'var(--green)'; $('fMsg').textContent = 'If that email has an account, a reset link is on its way. Check your inbox and spam folder.';
  });
  $('resetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const r = await api('/api/reset', { method: 'POST', body: JSON.stringify({ token: resetToken, password: $('rPw').value }) });
    if (!r.ok) { $('rMsg').textContent = ACCT_ERR[r.json.error] || 'Could not reach the server. Try again.'; return; }
    resetToken = null; $('rPw').value = ''; account = null; acctView = 'out'; renderAcct();
    $('aErr').style.color = 'var(--green)'; $('aErr').textContent = 'Password updated. Please log in with your new password.';
  });
  $('pwForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const r = await api('/api/password', { method: 'POST', body: JSON.stringify({ current: $('pCur').value, password: $('pNew').value }) });
    $('pMsg').style.color = r.ok ? 'var(--green)' : '';
    $('pMsg').textContent = r.ok ? 'Password updated. Other devices were signed out.' : (r.json.error === 'invalid' ? 'Current password is wrong.' : ACCT_ERR[r.json.error] || 'Could not update. Try again.');
    if (r.ok) { $('pCur').value = ''; $('pNew').value = ''; }
  });
  $('authForm').addEventListener('submit', (e) => { e.preventDefault(); auth('login'); });
  $('aSignup').addEventListener('click', () => auth('signup'));
  $('aGuest').addEventListener('click', () => $('account').close());
  $('aClose').addEventListener('click', () => $('account').close());
  $('aOut').addEventListener('click', async () => { await api('/api/logout', { method: 'POST', body: '{}' }); account = null; renderAcct(); $('account').close(); });
  $('aDel').addEventListener('click', async () => {
    if (!confirm('Delete your account and the synced copy of your data? This device keeps its local copy.')) return;
    await api('/api/account', { method: 'DELETE' }); account = null; renderAcct(); $('account').close();
  });
  $('resetAll').addEventListener('click', () => { if (confirm('Remove all rules and swaps?')) { state.rules = []; state.swaps = {}; touch(); render(); renderChat(); } });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') pull(); });
  window.addEventListener('online', pull);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
  (async () => {
    state = normalize(await loadState());
    const me = await api('/api/me');
    if (me.ok) { account = { email: me.json.email, verified: !!me.json.verified }; renderAcct(); await pull(); }
    const hasLink = /^#(reset|verify)=/.test(location.hash);
    renderChat(); if (state.profile) render(); else if (!hasLink) openSetup();
    renderAcct();
    await handleLink();
  })();
})();
