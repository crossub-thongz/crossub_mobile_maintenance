# CROSSUB Maintenance App

Mobile-first Next.js PWA for **repair suppliers, contractors, and tradespeople**. Part of the CROSSUB ecosystem:

| App | Port (local) | Role |
|-----|--------------|------|
| [crossub_web](https://github.com/crossub/crossub_web) API | 3001 | Shared Nest API (maintenance, auth, notifications) |
| crossub_mobile_agent | 3002 | Agent quote approval |
| crossub_mobile_tenant | 3003 | Tenant maintenance requests & completion confirmation |
| **crossub_mobile_maintenance** | **3004** | **Contractor job workflow** |

## Workflow

**Receive Job → Accept → Quote → Agent Approval → Repair → Tenant Confirmation → Invoice → Payment**

Connected to the same `crossub_web` maintenance module used by the tenant and agent apps.

## Features (MVP)

- Contractor registration & verification status
- Dashboard with job buckets (pending, quote approval, in progress, payment, etc.)
- Accept / decline jobs with reasons
- Quotation submission (syncs to API for agent approval)
- Completion evidence upload
- Invoice submission & payment tracking
- Communication hub (tenant, agent, CROSSUB)
- Notification history
- Profile & licence management

## Local setup

### Requirements

- Node.js ≥ 20
- pnpm ≥ 9
- [crossub_web](https://github.com/crossub/crossub_web) running locally (API on port 3001)

### Install & run

```bash
cd /Users/justin/Documents/GitHub/crossub_mobile_maintenance
pnpm install
cp apps/maintenance/.env.example apps/maintenance/.env

# Terminal 1 — API (in crossub_web repo)
cd ../crossub_web && pnpm dev:api

# Terminal 2 — maintenance app
pnpm dev
```

Open **http://localhost:3004**

When the API is unavailable, the app falls back to demo data with a connection banner.

## Environment variables

Copy `apps/maintenance/.env.example` to `apps/maintenance/.env`:

```env
# Browser calls same-origin /api (proxied by Next.js)
NEXT_PUBLIC_API_URL=/api

# Server-side proxy target — crossub_web Nest API (no trailing slash)
API_INTERNAL_URL=http://localhost:3001
```

### Render deployment

Use the included `render.yaml` Blueprint or create a **Web Service** manually:

| Setting | Value |
|---------|-------|
| **Build command** | `corepack enable && pnpm install && pnpm build:maintenance` |
| **Start command** | `pnpm --filter @crossub/maintenance start` |
| **Health check path** | `/login` |

**Environment variables on Render:**

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_API_URL` | `/api` |
| `API_INTERNAL_URL` | `https://YOUR-CROSSUB-API.onrender.com` *(no trailing slash)* |

### crossub_web configuration (after deploying maintenance app)

Update the API service environment on Render:

```env
# Add maintenance app URL to CORS if bypassing /api proxy (usually not needed)
CORS_ORIGINS=https://crossub-mobile-maintenance.onrender.com,https://crossub-mobile-agent.onrender.com,https://crossub-mobile-tenant.onrender.com

# Password reset emails (if using auth flows)
WEB_URL=https://crossub-mobile-maintenance.onrender.com
```

Leave `COOKIE_DOMAIN` empty so auth cookies bind to each app's own hostname (same pattern as agent/tenant apps).

## Deploy order on Render

1. **crossub_web** API (+ Postgres + Redis)
2. **crossub_mobile_maintenance** (this repo) — set `API_INTERNAL_URL` to the API URL
3. **crossub_mobile_agent** and **crossub_mobile_tenant** — same `API_INTERNAL_URL`

## Project structure

```
apps/maintenance/
├── app/                    # Next.js App Router pages
│   ├── api/[...path]/      # Proxy to crossub_web (same-origin cookies)
│   ├── dashboard/          # Job overview cards
│   ├── jobs/               # Job list & detail workflow
│   ├── messages/           # Communication hub
│   ├── notifications/      # Push notification history
│   ├── profile/            # Licence & company details
│   └── register/           # Contractor onboarding
├── components/
│   ├── contractor/         # Job cards, timeline, status badges
│   └── layout/             # Mobile shell + bottom nav
└── lib/
    ├── crossub-api/        # Maintenance API client (contractor role)
    └── data/               # API → UI mapping
```

## API endpoints used

- `GET /maintenance/state` — jobs, quotations, notifications
- `GET /maintenance/kpis?role=contractor`
- `POST /maintenance/quotations/create`
- `PATCH /maintenance/requests/:id/completion-evidence`
- `PATCH /maintenance/requests/:id/invoice`
- `POST /maintenance/attachments/upload`
- Auth: `/auth/login`, `/auth/me`, `/auth/refresh`, `/auth/logout`

## What to commit

Source and config only. Never commit `node_modules/`, `.next/`, or `.env`.
