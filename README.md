# Little Bites

Daily weaning menu for babies 6 months+ with Bengali home-style dishes. An installable, offline-capable web app (PWA) for desktop and mobile.

**Live demo:** https://techsellence-dev.github.io/little-bites/
The demo is the static frontend only. Menus, grocery lists and swaps work and are saved on your device. Accounts, sync and the AI features need the Node server (see below).

## Features
- **4-week menu, 4 meals a day**: 102 mild, age-staged dishes (khichuri, dal-bhaat, rui maachher jhol, chhana, fruit purées…) with Bengali-script names. No added salt, sugar or honey, boneless fish, no posto. The menu repeats every 4 weeks and is scrollable across weeks.
- **Age-aware**: pick the baby's age (6, 7, 8, 9–11, 12+ months), or follow the date of birth and let the menu advance on its own. The menu rebuilds whenever the age changes.
- **Grocery list**: built from the menu for one week, two weeks or a month, grouped by aisle, with copy, download and tick-off.
- **Swaps and chat**: swap any meal, or tell the **Chat** assistant how to change the menu in plain language (English, বাংলা, हिन्दी): "no dairy", "ragi twice a week", "only fruit on Sundays". Rules are saved automatically with an Undo button, and listed (removable) under *Saved rules* in the chat.
- **Milestones & play** (the *Play* switch in the header): for the baby's age band (0-24 months) it shows typical milestones to tick off, activities, toy and gift ideas, a toy-safety checklist and when to talk to a paediatrician. Items can be hidden, you can add your own, and links, captions or screenshots of play posts are turned into suggested activities/toys (with safety cautions) that you choose to add. Data lives in `public/milestones.js`; UI in `public/play.js`; same account, baby profile and sync as the food side.
- **Posts in the chat**: the same chat reads shared posts. Paste a public link (YouTube videos are watched by Gemini; TikTok, blogs and other pages are read as text; `linkfetch.js` refuses private/internal addresses, limits redirects, size and time), paste a caption, or upload a screenshot. Instagram, Facebook and X usually need a login, so use the caption or screenshot there; feeding advice is turned into rules (saved, with Undo). Unsafe advice (honey, salt/sugar, whole nuts, cow's milk as a drink before 12 months, detox diets…) is shown as a caution and never saved as a rule; borderline items show an "Add anyway" button. One endpoint, `/api/chat`, handles both instructions and posts. Requires the server and a Gemini API key.
- **Accounts and sync** (server only): email and password, local-first, last-write-wins sync across devices, email verification, password reset, account deletion.
- **Offline**: data lives in IndexedDB on the device, so the app works without a connection.

## Run locally
Requires Node 22.13+. No `npm install` needed.
```
cp .env.example .env
node server.js          # http://localhost:3000
```
Without `GEMINI_API_KEY` the menu, grocery list, accounts and sync still work; only the AI features are unavailable. Without a mail provider, verification and reset emails are printed to the server log.

## Deployment
Two targets, both automatic on every push to `main`:

- **Full app (AWS EC2):** `.github/workflows/deploy.yml` deploys to https://littlebites.techsellence.in.

### How the AWS deploy works
1. GitHub Actions signs in to AWS with OIDC (no stored keys). The IAM role `little-bites-deploy` can only be assumed from this repo's `main` branch.
2. The role may only run the SSM document `littlebites-deploy` on one instance. That document runs `deploy/deploy.sh`: `git pull --ff-only` in `/opt/little-bites`, restart the service, check that the app responds.
3. The workflow then checks the public URL. A failed step fails the run. There is no automatic rollback: revert the commit and push.

The role ARN is stored in the repository variable `AWS_DEPLOY_ROLE_ARN`. If the repository is renamed or recreated, update the role's trust policy.

### Server layout (us-east-2)
- One EC2 instance, shared with another app. Amazon Linux 2023, 1 GB swap added.
- nginx terminates HTTPS (Let's Encrypt via certbot, auto-renewed) and proxies to the app on `127.0.0.1:3000`. DNS is a Route 53 A record.
- Node 22 in `/opt/node22`, app in `/opt/little-bites`, run by systemd (`deploy/littlebites.service`) as the unprivileged user `littlebites` with a 220 MB memory cap and first priority to be killed under memory pressure.
- Settings in `/etc/littlebites.env` (see `deploy/littlebites.env.example`); never commit secrets.
- Email (verification, password reset) goes through Amazon SES from `noreply@techsellence.in`. The domain is verified with DKIM records in Route 53, and the app signs requests with the instance role (`mail.js`, no keys stored). The SES account starts in sandbox: until AWS grants production access it can only deliver to addresses verified in SES.
- SQLite database in `/var/lib/littlebites`. A systemd timer (`deploy/littlebites-backup.timer`) copies it nightly to a private S3 bucket with 30-day expiry.
- No SSH: administer the host with AWS Systems Manager (SSM) Run Command.

To deploy by hand: run the `Deploy to EC2` workflow from the Actions tab.

### Other hosts
Any host with Node and HTTPS works. A `Dockerfile` is included. Set `TRUST_PROXY=1`, `APP_URL`, `MAIL_FROM`, `MAIL_PROVIDER` (`ses`, `resend` or console), `RESEND_API_KEY` if using Resend, `GEMINI_API_KEY` (optional `GEMINI_MODEL`), and mount a persistent disk at `DATA_DIR`. Run a single instance: sessions, rate limits and SQLite are per server. See `.env.example`.

## Project layout
- `public/` frontend: `foods.js` dish catalogue · `engine.js` weekly planner and rule engine · `grocery.js` grocery list · `app.js` UI and sync · `store.js` IndexedDB · `sw.js` service worker
- `deploy/` systemd units, nginx config, deploy and backup scripts · `.github/workflows/` EC2 deploy
- `server.js` static files, auth, sync and AI endpoints · `db.js` SQLite storage (the only file that touches storage) · `mail.js` email

## Before real users
- Have a paediatrician or dietitian review `public/foods.js` and the safety wording.
- Add a privacy notice: the baby's date of birth and allergies are personal data.
- For several servers or heavy use, move `db.js` to a hosted database and the rate limits to a shared store.
