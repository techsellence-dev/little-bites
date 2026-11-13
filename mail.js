// Outgoing email. Providers:
//   resend  (set RESEND_API_KEY and MAIL_FROM) uses Resend's HTTPS API, no extra packages
//   console (default) prints the email to the server log, for local development only
// To use another provider (SES, Postmark, SendGrid, SMTP), implement send() here.
async function send({ to, subject, text }) {
  const key = process.env.RESEND_API_KEY;
  const provider = process.env.MAIL_PROVIDER || (key ? 'resend' : 'console');
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
