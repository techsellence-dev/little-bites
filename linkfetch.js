// Read a public post from its link. No packages needed.
//
// Safety: the server opens addresses supplied by users, so everything here assumes the link is hostile.
//  - only http(s) on ports 80/443, no credentials in the link, no bare/internal hostnames
//  - the address is checked when the connection is made (custom DNS lookup), so DNS tricks and
//    redirects to private ranges (localhost, 10.x, 169.254.169.254 cloud metadata, ...) are refused
//  - every redirect hop is checked again; hard limits on redirects, size and time
// Platforms: YouTube (video handed to Gemini), TikTok (oEmbed caption), anything else (page text and
// Open Graph tags). Sites that need a login (Instagram, Facebook, X) usually give nothing back; the caller
// then asks the user to paste the caption or a screenshot.
const http = require('node:http');
const https = require('node:https');
const dns = require('node:dns');
const net = require('node:net');

class LinkError extends Error { constructor(code, msg) { super(msg || code); this.code = code; } }

const blocked = new net.BlockList();
[['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12],
  ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24],
  ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4]].forEach(([a, p]) => blocked.addSubnet(a, p, 'ipv4'));
[['::', 128], ['::1', 128], ['64:ff9b::', 96], ['100::', 64], ['2001:db8::', 32],
  ['fc00::', 7], ['fe80::', 10], ['ff00::', 8]].forEach(([a, p]) => blocked.addSubnet(a, p, 'ipv6'));

const isBlockedIp = (ip) => { const f = net.isIP(ip); return !f || blocked.check(ip, f === 4 ? 'ipv4' : 'ipv6'); };

// Throws LinkError('bad_url' | 'blocked') unless this is a public http(s) address we are willing to open.
function checkUrl(raw) {
  let u;
  try { u = new URL(String(raw)); } catch (_) { throw new LinkError('bad_url'); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new LinkError('bad_url');
  if (u.username || u.password) throw new LinkError('bad_url');
  if (u.port && u.port !== '80' && u.port !== '443') throw new LinkError('blocked');
  const host = u.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (net.isIP(host)) { if (isBlockedIp(host)) throw new LinkError('blocked'); }
  else if (!host.includes('.') || host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.localhost')) throw new LinkError('blocked');
  return u;
}

// Used for every connection: resolves the name and refuses private results, so the address that was
// checked is the address that is connected to.
function safeLookup(hostname, opts, cb) {
  dns.lookup(hostname, { all: true, verbatim: true }, (err, addrs) => {
    if (err) return cb(err);
    if (!addrs.length || addrs.some((a) => isBlockedIp(a.address))) return cb(new LinkError('blocked'));
    if (opts && opts.all) return cb(null, addrs);
    cb(null, addrs[0].address, addrs[0].family);
  });
}

function getOnce(u, { maxBytes, timeoutMs, accept, truncate }) {
  return new Promise((resolve, reject) => {
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.request({
      hostname: u.hostname.replace(/^\[|\]$/g, ''), port: u.port || undefined, path: u.pathname + u.search, method: 'GET', lookup: safeLookup,
      headers: { 'user-agent': 'LittleBitesLinkReader/1.0 (+https://littlebites.techsellence.in)', accept, 'accept-encoding': 'identity', 'accept-language': 'en' },
    }, (res) => {
      const status = res.statusCode || 0;
      if ([301, 302, 303, 307, 308].includes(status) && res.headers.location) { res.resume(); return resolve({ redirect: new URL(res.headers.location, u).href }); }
      const chunks = []; let size = 0, done = false;
      const finish = () => { if (done) return; done = true; resolve({ status, type: String(res.headers['content-type'] || ''), body: Buffer.concat(chunks).toString('utf8') }); };
      res.on('data', (c) => {
        if (done) return;
        size += c.length;
        if (size > maxBytes) { if (truncate) { chunks.push(c); finish(); req.destroy(); } else req.destroy(new LinkError('too_big')); return; }
        chunks.push(c);
      });
      res.on('end', finish);
      res.on('error', reject);
    });
    const timer = setTimeout(() => req.destroy(new LinkError('timeout')), timeoutMs);
    req.on('error', (e) => { clearTimeout(timer); if (truncate && !(e instanceof LinkError)) return; reject(e instanceof LinkError ? e : new LinkError('fetch_failed', e.message)); });
    req.on('close', () => clearTimeout(timer));
    req.end();
  });
}

async function fetchText(raw, { maxBytes = 1.5e6, timeoutMs = 10000, truncate = false, accept = 'text/html,application/json;q=0.9,*/*;q=0.5' } = {}) {
  let u = checkUrl(raw);
  const deadline = Date.now() + timeoutMs;
  for (let hop = 0; hop < 4; hop++) {
    const left = deadline - Date.now();
    if (left <= 0) throw new LinkError('timeout');
    const r = await getOnce(u, { maxBytes, timeoutMs: left, accept, truncate });
    if (!r.redirect) return { ...r, url: u.href };
    u = checkUrl(r.redirect); // every hop is checked again
  }
  throw new LinkError('fetch_failed', 'too many redirects');
}

// ---------- extraction ----------
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (s) => String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') { const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : ''; }
  return ENT[e.toLowerCase()] !== undefined ? ENT[e.toLowerCase()] : m;
});
const squash = (s) => decode(s).replace(/\s+/g, ' ').trim();

function meta(html, key) {
  const k = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const a = new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*?content=(?:"([^"]*)"|'([^']*)')`, 'i').exec(html);
  const b = new RegExp(`<meta[^>]+content=(?:"([^"]*)"|'([^']*)')[^>]*?(?:property|name)=["']${k}["']`, 'i').exec(html);
  const m = a || b;
  return m ? squash(m[1] !== undefined ? m[1] : m[2]) : '';
}

function extractPage(html, maxChars = 6000) {
  const title = meta(html, 'og:title') || meta(html, 'twitter:title') || squash((/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html) || [])[1] || '');
  const description = meta(html, 'og:description') || meta(html, 'twitter:description') || meta(html, 'description');
  const body = squash(String(html)
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|head|nav|footer|header|form|iframe)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' '));
  const parts = [description, body].filter(Boolean);
  const text = (parts[0] && parts[1] && parts[1].includes(parts[0].slice(0, 40)) ? parts[1] : parts.join('\n\n')).slice(0, maxChars);
  return { title: title.slice(0, 200), description: description.slice(0, 1500), text };
}

const hostOf = (u) => u.hostname.replace(/^www\./, '').toLowerCase();
const isYoutube = (h) => ['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be'].includes(h);
const isTiktok = (h) => h === 'tiktok.com' || h.endsWith('.tiktok.com');

function youtubeWatchUrl(u) {
  const h = hostOf(u);
  let id = '';
  if (h === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
  else if (u.pathname === '/watch') id = u.searchParams.get('v') || '';
  else { const m = /^\/(shorts|embed|live)\/([\w-]{11})/.exec(u.pathname); if (m) id = m[2]; }
  return /^[\w-]{11}$/.test(id) ? `https://www.youtube.com/watch?v=${id}` : '';
}

const MAX_VIDEO_SECONDS = 20 * 60;

// Returns { host, url, title, author, text, videoUrl }. Throws LinkError.
async function readLink(raw) {
  const u = checkUrl(raw);
  const host = hostOf(u);
  const out = { host, url: u.href, title: '', author: '', text: '', videoUrl: '' };

  if (isYoutube(host)) {
    const watch = youtubeWatchUrl(u);
    if (!watch) throw new LinkError('bad_url');
    out.url = watch;
    try {
      const o = JSON.parse((await fetchText(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watch)}`, { maxBytes: 5e4 })).body);
      out.title = String(o.title || '').slice(0, 200); out.author = String(o.author_name || '').slice(0, 80);
    } catch (_) { /* private or removed videos have no oEmbed */ }
    let seconds = 0;
    try {
      const page = await fetchText(watch, { maxBytes: 1.5e6, truncate: true });
      const len = /"lengthSeconds":"(\d+)"/.exec(page.body); seconds = len ? +len[1] : 0;
      const p = extractPage(page.body, 2000);
      out.text = p.description;
      if (!out.title) out.title = p.title;
    } catch (_) { /* fall through with what we have */ }
    if (!out.title && !out.text) throw new LinkError('unreadable');
    if (seconds && seconds <= MAX_VIDEO_SECONDS) out.videoUrl = watch; // long videos: use title and description only
    return out;
  }

  if (isTiktok(host)) {
    try {
      const o = JSON.parse((await fetchText(`https://www.tiktok.com/oembed?url=${encodeURIComponent(u.href)}`, { maxBytes: 5e4 })).body);
      out.text = String(o.title || '').slice(0, 3000); out.author = String(o.author_name || '').slice(0, 80);
    } catch (_) { /* fall back to the page */ }
    if (out.text.length >= 20) return out;
  }

  const page = await fetchText(u.href);
  if (page.status >= 400) throw new LinkError('fetch_failed', `status ${page.status}`);
  if (!/html|text\/plain|xml/i.test(page.type)) throw new LinkError('unreadable');
  const p = extractPage(page.body);
  out.title = p.title; out.text = p.text;
  // Login walls: the page loads but holds no post. A short generic description is not worth sending on.
  if (out.text.length < 40) throw new LinkError('unreadable');
  return out;
}

module.exports = { readLink, LinkError, checkUrl, isBlockedIp, extractPage, safeLookup, fetchText, youtubeWatchUrl };
