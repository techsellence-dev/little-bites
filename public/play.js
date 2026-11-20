// Milestones & play tab. Uses the shared baby profile and account sync from app.js; owns only its own pane.
// State it adds (all synced with the rest): done {id:true}, hide {id:true}, play [items], playPosts [posts].
const Play = (() => {
  let c, ui = { band: null }, pending = null;
  const $ = (id) => document.getElementById(id);
  const S = () => c.state();
  const clean = (v, n) => String(v == null ? '' : v).replace(/[<>]/g, '').trim().slice(0, n);
  const num = (v, d) => (Number.isFinite(+v) ? Math.max(0, Math.min(36, Math.round(+v))) : d);

  function babyAge() { return c.age(); }
  function bandId() { return ui.band || Milestones.bandFor(babyAge()).id; }
  const mine = (b, kind) => (S().play || []).filter((x) => x.kind === kind && x.from < b.to && x.to > b.from);

  function row(it, extra, kind) {
    const s = S(), hid = !!(s.hide || {})[it.id];
    const tick = kind === 'm' ? `<input type="checkbox" data-pdone="${it.id}" ${(s.done || {})[it.id] ? 'checked' : ''} aria-label="Seen this">` : '';
    return `<li class="pl${hid ? ' hid' : ''}">${tick}<span><b>${c.esc(it.t || it.title)}</b>${it.how ? `<br><span class="tip">${c.esc(it.how)}</span>` : ''}${it.note ? `<br><span class="tip">${c.esc(it.note)}</span>` : ''}${it.caution ? `<br><span class="cw">${c.esc(it.caution)}</span>` : ''}${extra || ''}</span>` +
      `<button class="link" data-phide="${it.id}">${hid ? 'Show' : 'Hide'}</button></li>`;
  }
  function mineRow(x) {
    const post = (S().playPosts || []).find((p) => p.id === x.post);
    const from = post ? ` <span class="chip">${c.esc(post.source || 'Saved post')}</span>${post.link ? ` <a class="tip" href="${c.esc(post.link)}" target="_blank" rel="noopener noreferrer">link</a>` : ''}` : ' <span class="chip">Mine</span>';
    return row(x, from + ` <button class="link" data-pdel="${x.id}">Remove</button>`, 'x');
  }

  function render() {
    const s = S(); if (!s.profile) return;
    const age = babyAge(), cur = Milestones.bandFor(age), b = Milestones.find(bandId());
    const showHidden = !!ui.showHidden, vis = (it) => showHidden || !(s.hide || {})[it.id];
    const name = s.profile.name || 'your baby';
    $('playBody').innerHTML =
      `<div class="card"><div class="stage"><b>${c.esc(name)} is ${age} months</b><span>Typical ${c.esc(cur.label)} stage: ${c.esc(cur.theme)}. Every baby develops at their own pace.</span></div>` +
      `<div class="days bands">${Milestones.BANDS.map((x) => `<button data-pband="${x.id}" class="${x.id === b.id ? 'on' : ''}">${x.label}${x.id === cur.id ? '<small>now</small>' : ''}</button>`).join('')}</div></div>` +
      `<div class="card"><h2>What to expect: ${c.esc(b.label)}</h2><div class="tip">Tick what you have seen. Many babies do some earlier or later.</div>` +
      Object.keys(Milestones.DOMAINS).map((d) => {
        const l = b.milestones.filter((m) => m.d === d && vis(m)); if (!l.length) return '';
        return `<h3>${Milestones.DOMAINS[d]}</h3><ul class="pls">${l.map((m) => row(m, '', 'm')).join('')}</ul>`;
      }).join('') + `</div>` +
      `<div class="card"><h2>Activities</h2><ul class="pls">${[...b.activities.filter(vis).map((a) => row(a, ` <span class="chip">${Milestones.DOMAINS[a.d]}</span>`, 'a')), ...mine(b, 'activity').filter(vis).map(mineRow)].join('') || '<li class="tip">Nothing here yet.</li>'}</ul></div>` +
      `<div class="card"><h2>Toys &amp; gift ideas</h2><ul class="pls">${[...b.toys.filter(vis).map((t) => row(t, '', 't')), ...mine(b, 'toy').filter(vis).map(mineRow)].join('') || '<li class="tip">Nothing here yet.</li>'}</ul>` +
      `<details><summary class="tip">Toy safety checklist</summary><ul class="safe">${Milestones.SAFETY.map((x) => `<li>${c.esc(x)}</li>`).join('')}</ul></details></div>` +
      `<div class="card warnbox"><h2>Talk to your paediatrician if</h2><ul class="safe">${b.doctor.map((x) => `<li>${c.esc(x)}</li>`).join('')}</ul><div class="tip">Also speak up if you are worried about anything, or if baby loses a skill they had. Milestones are a guide, not a diagnosis.</div></div>` +
      `<div class="card"><h2>Add your own</h2><div class="addrow"><select id="pKind"><option value="activity">Activity</option><option value="toy">Toy / gift</option></select><input type="text" id="pTitle" maxlength="120" placeholder="e.g. Water play in the bucket"></div><button class="secondary" id="pAdd">Add for ${c.esc(b.label)}</button>` +
      `<button class="link" id="pToggleHidden">${showHidden ? 'Hide the ones I hid' : 'Show items I hid'}</button></div>`;
    const posts = s.playPosts || [];
    $('playPostsCard').style.display = posts.length ? '' : 'none';
    $('playPosts').innerHTML = posts.map((p) => `<li><span><b>${c.esc(p.source || 'Saved post')}</b> <span class="tip">${c.esc(p.date)}</span><br><span class="tip">${c.esc(p.summary)}</span></span><button class="link" data-pdelpost="${p.id}">Remove</button></li>`).join('');
  }

  async function read() {
    const text = $('pText').value.trim(), file = $('pImg').files[0], link = $('pLink').value.trim();
    const out = $('pResult');
    if (!text && !file && !link) { out.innerHTML = '<div class="reply warn">Paste a link, paste the caption, or choose a screenshot first.</div>'; return; }
    const btn = $('pRead'); btn.disabled = true; btn.textContent = 'Reading…';
    let image = null;
    try { if (file) image = await c.shrink(file); } catch (_) { btn.disabled = false; btn.textContent = 'Read post'; out.innerHTML = '<div class="reply warn">Could not read that image. Try a PNG or JPG.</div>'; return; }
    const r = await c.api('/api/guidance', { method: 'POST', body: JSON.stringify({ topic: 'play', text, image, url: link, context: { ageMonths: babyAge() } }) });
    btn.disabled = false; btn.textContent = 'Read post';
    if (!r.ok) { out.innerHTML = `<div class="reply warn">${c.esc(c.errText(r))}</div>`; return; }
    const g = r.json, src = g.source && /^https?:\/\//.test(g.source.url || '') ? g.source : null;
    const items = (Array.isArray(g.items) ? g.items : []).slice(0, 10).map((x) => {
      const from = num(x.fromMonths, 0), to = Math.max(from + 1, num(x.toMonths, from + 6));
      return { kind: x.kind === 'toy' ? 'toy' : 'activity', title: clean(x.title, 120), how: clean(x.how, 240), caution: clean(x.caution, 240), from, to };
    }).filter((x) => x.title);
    pending = { source: clean($('pSource').value, 60) || (src ? (src.author || src.host) : ''), link: src ? src.url.slice(0, 300) : '', g, items };
    if (g.not_applicable && !items.length) { out.innerHTML = `<div class="reply warn">${c.esc(String(g.not_applicable))}</div>`; pending = null; return; }
    const cautions = (Array.isArray(g.cautions) ? g.cautions : []).map(String);
    out.innerHTML = `<div class="reply"><b>${c.esc(String(g.language || ''))}</b><br>${c.esc(String(g.summary_en || ''))}</div>` +
      (cautions.length ? `<div class="reply warn"><b>Be careful:</b><br>${cautions.map(c.esc).join('<br>')}</div>` : '') +
      `<div style="margin-top:8px">${items.map((x, i) => `<label class="sug"><input type="checkbox" data-pitem="${i}" ${x.caution ? '' : 'checked'}><span><b>${c.esc(x.title)}</b> <span class="chip">${x.kind === 'toy' ? 'Toy' : 'Activity'} · ${x.from}-${x.to} mo</span>${x.how ? `<br><span class="tip">${c.esc(x.how)}</span>` : ''}${x.caution ? `<br><span class="cw">${c.esc(x.caution)}</span>` : ''}</span></label>`).join('')}</div>` +
      `<button class="primary" id="pApply">Add selected</button><button class="link" id="pDiscard" style="margin-top:6px">Discard</button>`;
  }
  function apply() {
    const s = S(), id = c.uid();
    const picked = [...document.querySelectorAll('#pResult [data-pitem]:checked')].map((e) => pending.items[+e.dataset.pitem]);
    s.play = s.play || []; s.playPosts = s.playPosts || [];
    picked.forEach((x) => s.play.push({ ...x, id: c.uid(), post: id }));
    s.playPosts.unshift({ id, source: pending.source || 'Saved post', link: pending.link, summary: clean(pending.g.summary_en, 400), date: new Date().toISOString().slice(0, 10) });
    $('pResult').innerHTML = `<div class="reply">Saved. ${picked.length} idea(s) added.</div>`;
    ['pText', 'pImg', 'pSource', 'pLink'].forEach((k) => { $(k).value = ''; });
    pending = null; c.touch(); render();
  }

  function click(e) {
    const b = e.target.closest('button,input'); if (!b) return false;
    const s = S();
    if (b.dataset.pband) { ui.band = b.dataset.pband; render(); }
    else if (b.dataset.pdone) { s.done = s.done || {}; if (b.checked) s.done[b.dataset.pdone] = true; else delete s.done[b.dataset.pdone]; c.touch(); }
    else if (b.dataset.phide) { s.hide = s.hide || {}; if (s.hide[b.dataset.phide]) delete s.hide[b.dataset.phide]; else s.hide[b.dataset.phide] = true; c.touch(); render(); }
    else if (b.dataset.pdel) { s.play = (s.play || []).filter((x) => x.id !== b.dataset.pdel); c.touch(); render(); }
    else if (b.dataset.pdelpost) { s.play = (s.play || []).filter((x) => x.post !== b.dataset.pdelpost); s.playPosts = (s.playPosts || []).filter((x) => x.id !== b.dataset.pdelpost); c.touch(); render(); }
    else if (b.id === 'pToggleHidden') { ui.showHidden = !ui.showHidden; render(); }
    else if (b.id === 'pAdd') {
      const t = clean($('pTitle').value, 120); if (!t) return true;
      const bd = Milestones.find(bandId());
      s.play = s.play || []; s.play.push({ id: c.uid(), kind: $('pKind').value === 'toy' ? 'toy' : 'activity', title: t, how: '', caution: '', from: bd.from, to: bd.to });
      c.touch(); render();
    }
    else if (b.id === 'pRead') read();
    else if (b.id === 'pApply') apply();
    else if (b.id === 'pDiscard') { pending = null; $('pResult').innerHTML = ''; }
    else return false;
    return true;
  }

  const init = (ctx) => { c = ctx; document.addEventListener('click', click); };
  return { init, render };
})();
