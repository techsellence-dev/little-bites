# Little Bites

Daily weaning menu for babies 6 months+ with Bengali home-style dishes. An installable, offline-capable web app (PWA) for desktop and mobile.

**Live demo:** https://techsellence-dev.github.io/little-bites/
The demo is the static frontend only. Menus, grocery lists and swaps work and are saved on your device. Accounts, sync and the AI features need the Node server (see below).

## Features
- **4-week menu, 4 meals a day**: 102 mild, age-staged dishes (khichuri, dal-bhaat, rui maachher jhol, chhana, fruit purées…) with Bengali-script names. No added salt, sugar or honey, boneless fish, no posto. The menu repeats every 4 weeks and is scrollable across weeks.
- **Age-aware**: pick the baby's age (6, 7, 8, 9–11, 12+ months), or follow the date of birth and let the menu advance on its own. The menu rebuilds whenever the age changes.
- **Grocery list**: built from the menu for one week, two weeks or a month, grouped by aisle, with copy, download and tick-off.
- **Swaps and rules**: swap any meal, or customise in plain language (English, বাংলা, हिन्दी): "no dairy", "ragi twice a week", "only fruit on Sundays".
- **Influencer posts**: paste a caption or upload a screenshot; feeding advice is turned into suggested rules the mother can accept. Unsafe advice (honey, salt/sugar, whole nuts, cow's milk as a drink before 12 months, detox diets…) is shown as a caution and never becomes a rule. Requires the server and an LLM API key.
- **Accounts and sync** (server only): email and password, local-first, last-write-wins sync across devices, email verification, password reset, account deletion.
- **Offline**: data lives in IndexedDB on the device, so the app works without a connection.

## Run locally
Requires Node 22.13+. No `npm install` needed.
```
cp .env.example .env
node server.js          # http://localhost:3000
```
Without an API key the menu, grocery list, accounts and sync still work; only the AI features are unavailable. Without `RESEND_API_KEY`, verification and reset emails are printed to the server log.

## Deploy
- **Static (GitHub Pages)**: every push to `main` publishes `public/` through `.github/workflows/pages.yml`.
- **Full app**: any host that runs Node and terminates HTTPS. A `Dockerfile` is included.
  ```
  docker build -t little-bites .
  docker run -p 3000:3000 -v lb-data:/data little-bites
  ```
  Set `TRUST_PROXY=1`, `APP_URL` (your public https address), `MAIL_FROM` and `RESEND_API_KEY`, and mount a persistent disk at `DATA_DIR` (it holds `littlebites.sqlite`). Run a single instance: sessions, rate limits and SQLite are per server.

See `.env.example` for all settings.

## Project layout
- `public/` frontend: `foods.js` dish catalogue · `engine.js` weekly planner and rule engine · `grocery.js` grocery list · `app.js` UI and sync · `store.js` IndexedDB · `sw.js` service worker
- `server.js` static files, auth, sync and AI endpoints · `db.js` SQLite storage (the only file that touches storage) · `mail.js` email

## Before real users
- Have a paediatrician or dietitian review `public/foods.js` and the safety wording.
- Add a privacy notice: the baby's date of birth and allergies are personal data.
- For several servers or heavy use, move `db.js` to a hosted database and the rate limits to a shared store.
