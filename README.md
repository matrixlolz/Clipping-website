<div align="center">

# Apex Clipping

**The all-in-one UGC & clipping campaign platform — launch paid campaigns, verify creators, and auto-payout on views.**

</div>

---

<p align="center">
  <a href="#features">Features</a> &nbsp;·&nbsp;
  <a href="#tech-stack">Tech Stack</a> &nbsp;·&nbsp;
  <a href="#getting-started">Getting Started</a> &nbsp;·&nbsp;
  <a href="#project-structure">Structure</a> &nbsp;·&nbsp;
  <a href="#whop-integration">Whop</a> &nbsp;·&nbsp;
  <a href="#scripts">Scripts</a> &nbsp;·&nbsp;
  <a href="#license">License</a>
</p>

---

## Overview

Apex Clipping is a marketplace where brands fund clipping & UGC campaigns and creators get paid per 1,000 views. Brands set the budget, reward rates per platform, and content requirements; creators submit clips, link their socials, and withdraw earnings once they hit the minimum-view threshold. Built on Next.js with a Whop-powered experience layer for per-company storefronts.

- Brands launch campaigns with global or per-platform reward rates (TikTok / Instagram / YouTube / X)
- Creators submit clips, track approvals, and watch earnings update in real time
- Admin panel reviews submissions, manages payouts, verifies social accounts, and onboards brands
- Whop experiences embed the app per-company with scoped access and embed tokens
- Python bio-verification scripts confirm creator ownership of TikTok / Instagram / YouTube accounts via Apify

## Features

### For Brands
- **Launch Wizard** — multi-step glassmorphism flow for settings, content requirements, and funding
- **Campaign Dashboard** — live budget, spend, impressions, and submission pipeline
- **Per-platform rewards** — distinct CPM, min payout, and max earnings per platform
- **Brand applications** — vetted onboarding queue for new brands

### For Creators
- **Campaign discovery** — categorized feed (Gaming, Fitness, Tech, Music, Food, ...) with filters
- **Submission flow** — attach clip URL, platforms, and auto view-tracking
- **Earnings & wallet** — per-campaign breakdown, eligibility checks, one-tap payout requests
- **Social account verification** — connect TikTok / Instagram / YouTube with bio-code proof

### For Admins
- **Admin dashboard** — total spend, pending payouts, active campaigns, brand pipeline
- **Submissions review** — approve / reject with reason, per-campaign and per-user drill-downs
- **Payouts** — campaign-level and user-level payout management
- **Brand & social account moderation** — review applications and verified socials

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) · React 18 · TypeScript |
| Styling | Tailwind CSS · shadcn/ui · Radix UI · Framer Motion · next-themes |
| Data | Supabase (auth, postgres) · MySQL (campaign/social data) · TanStack Query |
| Auth | Supabase Auth · JWT · bcrypt · Whop SDK (`@whop/sdk`) |
| Forms | React Hook Form · Zod · input-otp |
| Charts | Recharts · date-fns · lucide-react |
| Bio verification | Python · Apify (TikTok / Instagram / YouTube scrapers) |
| Deployment | Vercel-ready · GitHub Actions cron for view updates |

## Getting Started

### Prerequisites
- Node 18+ and npm (or bun)
- A Supabase project (for auth + postgres)
- A MySQL database (for campaign & social data)
- A Whop app (`app_...`) — see [WHOP_SETUP.md](./WHOP_SETUP.md)
- Optional: Python 3.12+ with `apify_client` for bio-verification scripts

### Install
```bash
npm install
```

### Configure environment
Copy `.env.example` (or create `.env`) and fill in:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
MYSQL_HOST=...
MYSQL_USER=...
MYSQL_PASSWORD=...
MYSQL_DATABASE=...
NEXT_PUBLIC_WHOP_APP_ID=app_...
WHOP_API_KEY=...
APIFY_API_TOKEN=...   # only for bio-verification scripts
```

> **Warning** — `.env` is currently committed to this repo. Rotate any exposed secrets and keep `.env` local going forward.

### Run
```bash
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve build
npm run lint
npm run typecheck
```

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── admin/                # admin-only routes (payouts, submissions, brands)
│   ├── api/                  # route handlers (campaigns, whop, thumbnails)
│   ├── campaigns/            # public campaign browsing
│   ├── dashboard/            # creator & brand dashboards
│   ├── earnings/             # wallet & payout requests
│   ├── experiences/[id]/     # Whop-embedded per-company experience
│   ├── launch/               # brand campaign creation wizard
│   └── providers.tsx         # client providers (query, theme, toasts)
├── components/
│   ├── app/                  # brand/creator app shell
│   ├── campaigns/            # launch wizard, leaderboard, filters
│   ├── customer/             # Whop-embedded customer shell
│   ├── providers/            # WhopBusinessProvider context
│   ├── notifications/        # in-app notification bell
│   └── ui/                   # shadcn/ui primitives
├── context/                  # AppModeContext (brand vs creator vs customer)
├── hooks/                    # useAuth, useCampaigns, useWallet, useStats, ...
├── integrations/
│   ├── mysql/                # MySQL client + typed API
│   └── supabase/             # Supabase client + generated types
├── lib/                      # auth, validation, whop helpers, taxonomy
├── views/                    # screen-level components
└── middleware.ts             # route protection + Whop access gating
scripts/
└── verify_{tiktok,instagram,youtube}_bio*.py   # Apify-powered bio verification
```

## Whop Integration

Apex Clipping ships as a **Whop embeddable app**. Each Whop company gets a scoped experience at `/experiences/[experienceId]/...` with:
- Whop SSO + access-level detection (admin vs member)
- Company-scoped campaign creation (campaigns are tagged with `whop_company_id`)
- Embed-token capture for in-iframe operation
- Direct install URL: `https://whop.com/apps/<app_id>/install`

See [WHOP_SETUP.md](./WHOP_SETUP.md) for the full setup checklist, including permission scopes and re-approval flow.

## Scripts

Bio-verification microservices confirm a creator actually owns the social account they linked by checking a one-time code in their profile bio.

```bash
cd scripts
pip install -r requirements.txt
python verify_tiktok_bio.py --username <user> --code <code>
python verify_instagram_bio.py --username <user> --code <code>
python verify_youtube_bio.py --username <user> --code <code>
```

`*_server.py` variants run a small HTTP server for integration with the Next.js backend. `APIFY_API_TOKEN` must be set.

A GitHub Actions cron (`.github/workflows/update-views-cron.yml`) periodically refreshes view counts on approved submissions.

## Configuration

| Env var | Purpose |
|---|---|
| `NEXT_PUBLIC_WHOP_APP_ID` | Whop app id (`app_...`) |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase ops |
| `MYSQL_*` | MySQL connection for campaign/social data |
| `WHOP_API_KEY` | Server-side Whop API calls |
| `APIFY_API_TOKEN` | Bio-verification scripts |

## License

Private — all rights reserved. Contact the repo owner for usage or licensing questions.

<div align="center">

Built with Next.js · Tailwind · shadcn/ui · Supabase · Whop · Apify

</div>