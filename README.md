# Aban is 2! 🎈 — birthday invitation site

A tiny, static, mobile-first invitation page (EN / NL / FA, with RTL for Persian).
All content lives in **Supabase**; the page is plain HTML/CSS/JS — no build step,
no framework, no server code.

Visitors can read the party details, get directions, and **claim/release gifts**
on a shared wishlist (honor system, no login). Reservations sync live across
everyone via Supabase Realtime.

```
index.html          markup + all styles
app.js              data loading, i18n, reserve/release, realtime (ES module)
config.js           Supabase URL + anon key (generated from .env — git-ignored)
generate-config.sh  writes config.js from .env
.env / .env.example Supabase credentials
supabase/schema.sql tables, security, and seed data
assets/             animal-frame.png, aban-photo.png
```

## 1. Set up Supabase

1. Create a free project at <https://supabase.com>.
2. Open **SQL Editor → New query**, paste all of `supabase/schema.sql`, **Run**.
   This creates the tables, locks down security (public can only flip a gift's
   `reserved` flag), enables realtime, and seeds the content.
3. Open **Project Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`

> The anon key is meant to live in the browser. Safety comes from Row Level
> Security + column grants in `schema.sql`, not from hiding the key.

## 2. Configure the site

```bash
cp .env.example .env     # already done
# edit .env, paste your two values
./generate-config.sh     # writes config.js
```

## 3. Run locally

Because `app.js` is an ES module it must be served over HTTP (not `file://`):

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Editing content later

Use the Supabase **Table Editor** — no code changes needed:

- `event_info` — address + the date line per language.
- `party_info` — the activity rows (`position` controls order).
- `wishlist` — gifts; `reserved` is what visitors toggle, `position` orders them.

## Security model

- Everyone can `SELECT` all three tables.
- The **only** write allowed for the public is `UPDATE (reserved)` on `wishlist`.
  This is enforced two ways: an RLS update policy *and* a column-level grant, so
  names/emoji/positions can't be altered from the browser.

## Hosting → `aban.number34.nl`

See the options below. **Cloudflare Pages** is recommended (free, no machine to
keep running). Cloudflare Tunnel from this machine also works if you'd rather
self-host.

### Option A — Cloudflare Pages (recommended)
1. Push this folder to a Git repo (GitHub/GitLab) **or** use Wrangler to upload
   directly. Make sure `config.js` exists (run `./generate-config.sh` first; if
   deploying from CI, set the env vars there and run the script in the build).
2. Cloudflare dashboard → **Workers & Pages → Create → Pages**.
   - Build command: *(none)* — Output directory: `/` (root).
3. **Custom domains → Set up a custom domain → `aban.number34.nl`.**
   Since `number34.nl` is on Cloudflare, the DNS record is added automatically.

Direct upload alternative:
```bash
npm i -g wrangler
wrangler pages deploy . --project-name aban-birthday
```

### Option B — Cloudflare Tunnel from this machine
Serves the static files from here; the box must stay on.
```bash
python3 -m http.server 8080            # serve the site
cloudflared tunnel login
cloudflared tunnel create aban
cloudflared tunnel route dns aban aban.number34.nl
cloudflared tunnel run --url http://localhost:8080 aban
```

### Other free static hosts
Netlify, Vercel, or GitHub Pages all work the same way (drop the folder, add the
`aban.number34.nl` custom domain via a CNAME in Cloudflare DNS). Cloudflare Pages
is simplest here only because the domain already lives on Cloudflare.
