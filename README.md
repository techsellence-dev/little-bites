# Little Bites

Daily weaning menu for babies 6 months+ with Bengali home-style dishes. Installable web app (PWA) for desktop and mobile, with accounts and cross-device sync.

## Run locally
```
cp .env.example .env     # add ANTHROPIC_API_KEY
node server.js           # http://localhost:3000   (Node 22.13+, no npm install needed)
```
Without an API key the menu, accounts and sync still work. Customising falls back to a simple English-only parser, and reading influencer posts is unavailable. Without `RESEND_API_KEY`, password-reset and verification emails are printed to the server log instead of sent (development only).

## Features
- **Bengali menu**: 69 mild, age-staged dishes (khichuri, dal-bhaat, rui maachher jhol, chhana, fruit purées…) with Bengali-script names. No added salt/sugar/honey, boneless fish, no posto.
- **Customise in plain language** (English, বাংলা, हिन्दी): "no dairy", "ragi twice a week", "only fruit on Sundays", "সপ্তাহে তিনদিন মাছ".
- **Influencer posts**: paste a caption or upload a screenshot in any language. Claude extracts the feeding advice into suggested rules; the mother chooses which to apply. Unsafe advice (honey, salt/sugar, whole nuts, cow's milk as a drink before 12 months, detox diets…) is shown as a caution and never turned into a rule. Rules from a post can carry an age window ("from 8 months") and are removed together with the post.
- **Accounts & sync**: email + password, local-first, last-write-wins sync across devices.
- **Database**: SQLite (`db.js`, built into Node, no packages) with users, sessions and single-use tokens. Accounts from the earlier `db.json` file are imported automatically on first start. `db.js` is the only file that touches storage, so moving to Postgres means re-implementing it.
- **Offline PWA storage**: the on-device copy lives in IndexedDB (`public/store.js`, localStorage fallback), so the menu works with no connection and changes sync when it returns.
- **Password service**: email verification, "Forgot password?" reset by emailed link, and change password. Links last 1 hour (reset) or 24 hours (verify), work once, and only a hash of each token is stored. Responses never reveal whether an email has an account. A reset or password change signs the other devices out. Links use a URL fragment (`/#reset=…`) so the token never reaches server logs or referrer headers.

## Deploy with HTTPS
Any host that terminates HTTPS works. Set `TRUST_PROXY=1` (so cookies are `Secure`), `APP_URL` to your public https address, `RESEND_API_KEY` and `MAIL_FROM` (verify your sending domain with Resend), `ANTHROPIC_API_KEY`, and mount a persistent disk at `DATA_DIR` (it holds `littlebites.sqlite`; back it up). A `Dockerfile` is included:
```
docker build -t little-bites .
docker run -p 3000:3000 -v lb-data:/data -e ANTHROPIC_API_KEY=... little-bites
```
Put it behind Caddy/nginx or a platform like Render, Fly.io or Railway for HTTPS. Phones can then "Add to Home Screen" / install.

## Before real users
- Have a paediatrician or dietitian review `public/foods.js` and the safety wording.
- Passwords are hashed with scrypt, sessions are HttpOnly cookies, and login, reset and LLM endpoints are rate limited (in memory, per server instance). SQLite on one server suits a pilot; for several servers or heavy use, move `db.js` to Postgres and the rate limits to a shared store.
- Email verification is not required to use the app; it is shown as a status. Make it a requirement if you prefer.
- The mail provider is Resend; to use another (SES, Postmark, SMTP), change `mail.js` only.
- The baby's date of birth and allergies are personal data: add a privacy notice. Users can delete their account in-app.
- Influencer posts are sent to Claude for reading; only the summary and rules are saved, not the original text or image.

## Layout
- `public/foods.js` dish catalogue · `public/engine.js` weekly planner and rule engine · `public/app.js` UI and sync
- `server.js` static files, auth, password service, sync, `/api/parse`, `/api/guidance` · `db.js` SQLite storage · `mail.js` email · `public/store.js` IndexedDB
# little-bites
