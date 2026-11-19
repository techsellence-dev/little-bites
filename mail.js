// Outgoing email. Providers (MAIL_PROVIDER, or auto-detected):
//   ses     Amazon SES v2 over HTTPS, signed with SigV4. Uses the EC2 instance role, or
//           AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_SESSION_TOKEN. Set MAIL_FROM and AWS_REGION.
//   resend  (set RESEND_API_KEY and MAIL_FROM) uses Resend's HTTPS API
//   console (default) prints the email to the server log, for local development only
// No extra packages needed.
const crypto = require('node:crypto');

const hmac = (k, d) => crypto.createHmac('sha256', k).update(d).digest();
const sha = (d) => crypto.createHash('sha256').update(d).digest('hex');
let cachedCreds = null;

async function awsCreds() {
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
    return { id: process.env.AWS_ACCESS_KEY_ID, secret: process.env.AWS_SECRET_ACCESS_KEY, token: process.env.AWS_SESSION_TOKEN };
  if (cachedCreds && cachedCreds.exp - Date.now() > 5 * 60e3) return cachedCreds;
  const imds = 'http://169.254.169.254/latest';
  const opt = (extra) => ({ signal: AbortSignal.timeout(3000), ...extra });
  const t = await (await fetch(`${imds}/api/token`, opt({ method: 'PUT', headers: { 'X-aws-ec2-metadata-token-ttl-seconds': '300' } }))).text();
  const h = { 'X-aws-ec2-metadata-token': t };
  const role = (await (await fetch(`${imds}/meta-data/iam/security-credentials/`, opt({ headers: h }))).text()).split('\n')[0].trim();
  const c = await (await fetch(`${imds}/meta-data/iam/security-credentials/${role}`, opt({ headers: h }))).json();
  cachedCreds = { id: c.AccessKeyId, secret: c.SecretAccessKey, token: c.Token, exp: Date.parse(c.Expiration) };
  return cachedCreds;
}

async function sendSes({ to, subject, text }) {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-2';
  const host = process.env.SES_HOST || `email.${region}.amazonaws.com`;
  const path = '/v2/email/outbound-emails';
  const body = JSON.stringify({
    FromEmailAddress: process.env.MAIL_FROM,
    Destination: { ToAddresses: [to] },
    Content: { Simple: { Subject: { Data: subject, Charset: 'UTF-8' }, Body: { Text: { Data: text, Charset: 'UTF-8' } } } },
  });
  const c = await awsCreds();
  const amz = new Date().toISOString().replace(/[:-]|\.\d{3}/g, ''); // 20261119T101500Z
  const day = amz.slice(0, 8);
  const headers = { 'content-type': 'application/json', host, 'x-amz-date': amz };
  if (c.token) headers['x-amz-security-token'] = c.token;
  const names = Object.keys(headers).sort();
  const canonHeaders = names.map((n) => `${n}:${headers[n]}\n`).join('');
  const canonical = `POST\n${path}\n\n${canonHeaders}\n${names.join(';')}\n${sha(body)}`;
  const scope = `${day}/${region}/ses/aws4_request`;
  const toSign = ['AWS4-HMAC-SHA256', amz, scope, sha(canonical)].join('\n');
  const key = hmac(hmac(hmac(hmac('AWS4' + c.secret, day), region), 'ses'), 'aws4_request');
  headers.authorization = `AWS4-HMAC-SHA256 Credential=${c.id}/${scope}, SignedHeaders=${names.join(';')}, Signature=${crypto.createHmac('sha256', key).update(toSign).digest('hex')}`;
  const { host: _h, ...sendHeaders } = headers; // fetch sets Host itself
  const base = process.env.SES_HOST ? `http://${host}` : `https://${host}`;
  const r = await fetch(base + path, { method: 'POST', headers: sendHeaders, body, signal: AbortSignal.timeout(15000) });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(`SES returned ${r.status}${e.message ? ': ' + e.message : ''}`);
  }
}

async function send({ to, subject, text }) {
  const key = process.env.RESEND_API_KEY;
  const provider = process.env.MAIL_PROVIDER || (key ? 'resend' : 'console');
  if (provider === 'ses') {
    if (!process.env.MAIL_FROM) throw new Error('MAIL_FROM is required for SES');
    return sendSes({ to, subject, text });
  }
  if (provider === 'resend') {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: process.env.MAIL_FROM || 'Little Bites <onboarding@resend.dev>', to: [to], subject, text }),
    });
    if (!r.ok) throw new Error(`mail provider returned ${r.status}`);
    return;
  }
  console.log(`[mail:console] to=${to}\nsubject: ${subject}\n${text}\n`);
}

const resetEmail = (link) => ({
  subject: 'Reset your Little Bites password',
  text: `Hello,\n\nUse this link to choose a new password (valid for 1 hour, one use):\n${link}\n\nIf you did not ask for this, you can ignore this email; your password stays the same.\n\nপাসওয়ার্ড বদলাতে উপরের লিঙ্কে যান। আপনি অনুরোধ না করলে এই ইমেল উপেক্ষা করুন।\n\nLittle Bites`,
});
const verifyEmail = (link) => ({
  subject: 'Confirm your email for Little Bites',
  text: `Welcome to Little Bites!\n\nPlease confirm your email address (valid for 24 hours):\n${link}\n\nআপনার ইমেল নিশ্চিত করতে উপরের লিঙ্কে যান।\n\nLittle Bites`,
});

module.exports = { send, resetEmail, verifyEmail };
