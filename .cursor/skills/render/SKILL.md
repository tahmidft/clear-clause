---
name: clearclause-render
description: >-
  Deploy and operate the ClearClause FastAPI backend on Render: env vars from
  backend/.env.example, render.yaml, RENDER_API_KEY vs deploy hook,
  scripts/render-sync-deploy.sh, free-tier cold starts, cron keep-alive on
  /health, CORS_ORIGINS with Vercel URL(s), and troubleshooting health timeouts.
---

# ClearClause — Render (backend API)

## Scope

The **FastAPI backend** runs on Render as web service **`clearclause-api`**. The frontend is on **Vercel** (see `.cursor/skills/vercel/SKILL.md`). Supabase provides Auth, Postgres, and Storage (see `.cursor/skills/supabase/SKILL.md`).

| Item | Value |
|------|--------|
| Service name | `clearclause-api` |
| Production URL | `https://clearclause-api.onrender.com` |
| Health | `GET /health` → `{"status":"ok"}` (no DB; safe for keep-alive) |
| Blueprint | `render.yaml` at repo root |
| Root / build / start | Repo root; `cd backend && pip install -r requirements.txt`; `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT` |

## Required environment variables

Set in **Render → clearclause-api → Environment** (mirror `backend/.env.example`):

| Variable | Required | Notes |
|----------|----------|--------|
| `GEMINI_API_KEY` | Yes | Google AI Studio |
| `SUPABASE_URL` | Yes | Same project as frontend |
| `SUPABASE_ANON_KEY` | Yes | Must match `VITE_SUPABASE_ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Storage only; never in Vercel |
| `DATABASE_URL` | Yes | Supabase pooler URI; `?sslmode=require`; no `[brackets]` around password |
| `CORS_ORIGINS` | Yes (prod) | Comma-separated Vercel origin(s) + local dev, e.g. `https://clearclause.vercel.app,http://localhost:5173,http://127.0.0.1:5173` |
| `APP_ENV` | Recommended | `production` |
| `GEMINI_MODEL` | Optional | Default `gemini-2.5-flash-lite` |
| Rate limits / retention | Optional | See `.env.example` |

Never commit real keys. Optional **local-only** vars for automation (in `backend/.env`, not git):

| Variable | Purpose |
|----------|---------|
| `RENDER_API_KEY` | Render Account Settings → API Keys (`rnd_…`) — sync env + trigger deploy via API |
| `RENDER_DEPLOY_HOOK_URL` | Service → Settings → Deploy Hook — POST-only deploy trigger |
| `RENDER_SERVICE_NAME` | Override default `clearclause-api` |
| `VERCEL_PRODUCTION_ORIGIN` | Used by sync script for `CORS_ORIGINS` if unset |

## `render.yaml`

Example blueprint at repo root. After creating the service from the blueprint, set secret env vars in the dashboard (`sync: false` keys). Update the `CORS_ORIGINS` comment to match your live Vercel URL(s).

`healthCheckPath: /health` tells Render to probe `/health` during deploys.

## Deploy methods

### Dashboard (manual)

1. Connect GitHub repo; set build/start commands (or use blueprint).
2. Add all required env vars.
3. **Manual Deploy → Deploy latest commit** if the service is suspended or stuck.

### Deploy hook (CI / quick trigger)

Render → **Settings → Deploy Hook** → copy URL. POST to trigger a deploy (does not update env vars):

```bash
curl -fsS -X POST "$RENDER_DEPLOY_HOOK_URL"
```

GitHub Actions (`.github/workflows/deploy-production.yml`) uses secret `RENDER_DEPLOY_HOOK_URL` when set.

### API key + env sync (`scripts/render-sync-deploy.sh`)

From repo root, with `backend/.env` filled and one of:

```bash
export RENDER_API_KEY=rnd_…   # preferred: updates env + deploys
# or
export RENDER_DEPLOY_HOOK_URL=https://api.render.com/deploy/srv-…
bash scripts/render-sync-deploy.sh
```

The script:

1. Sources `backend/.env` (never commit).
2. Builds `CORS_ORIGINS` from `CORS_ORIGINS` or `VERCEL_PRODUCTION_ORIGIN` (default `https://clearclause.vercel.app`) plus localhost aliases.
3. PUTs env vars to Render API (when using `RENDER_API_KEY`).
4. Triggers deploy and polls `/health` (up to ~4 minutes).

### Full production script

```bash
bash scripts/deploy-production.sh
```

Deploys Vercel frontend (`vercel --prod`), then runs `render-sync-deploy.sh` if `RENDER_API_KEY` or `RENDER_DEPLOY_HOOK_URL` is set.

## Keep-alive (cron-job.org)

Render **free tier** spins down after ~15 minutes of no traffic. Cold starts can take 30–90 seconds; a **failed or suspended** service may never respond.

Create a free job at [cron-job.org](https://cron-job.org):

| Field | Value |
|-------|--------|
| URL | `https://clearclause-api.onrender.com/health` |
| Method | GET |
| Interval | Every **10 minutes** |
| Timeout | ≥ 60 seconds |

This reduces cold starts; it does **not** fix a crashed deploy or missing env vars.

## Free-tier behavior

- **Cold start**: First request after idle may hang 30–90s, then `{"status":"ok"}`.
- **Spin-down**: No traffic ~15 min → instance stops.
- **Monthly limits**: Exceeded hours → service suspended until next cycle (dashboard shows status).
- **Health endpoint**: `backend/main.py` `/health` does not touch Postgres (engine is lazy via `@lru_cache` in `db/database.py`).

## Troubleshooting

### `curl` times out with **0 bytes received** (15–90s+)

Usually **not** a normal cold start. Check Render dashboard:

1. **Service status** — Running vs Suspended vs Deploy failed.
2. **Logs** — Build errors, `ModuleNotFoundError`, missing `DATABASE_URL`, uvicorn crash.
3. **Manual Deploy** — Redeploy latest commit after fixing env.
4. **Env** — All required keys present; `DATABASE_URL` uses pooler + `sslmode=require`.

If logs show repeated restarts, fix the error before relying on cron keep-alive.

### Health returns 503 / deploy never goes live

- Confirm `healthCheckPath: /health` matches `main.py`.
- Start command must bind `$PORT`: `uvicorn main:app --host 0.0.0.0 --port $PORT`.

### CORS errors from Vercel

- `CORS_ORIGINS` must list **exact** browser origins (scheme + host, no path).
- Include `https://clearclause.vercel.app` and any preview URLs you test.
- After changing `CORS_ORIGINS`, redeploy Render (sync script or manual).

### Auth works locally but API 401 in production

- `SUPABASE_ANON_KEY` on Render must match `VITE_SUPABASE_ANON_KEY` on Vercel.

### Automation unavailable locally

If neither `RENDER_API_KEY` nor `RENDER_DEPLOY_HOOK_URL` is in env or `backend/.env`:

1. Use Render dashboard → **Manual Deploy**.
2. Add `RENDER_DEPLOY_HOOK_URL` to GitHub repo secrets for CI.
3. Optionally add `RENDER_API_KEY` locally in `backend/.env` (gitignored) for `render-sync-deploy.sh`.

## Pre-deploy smoke test

```bash
curl -fsS --max-time 120 https://clearclause-api.onrender.com/health
```

Expect `{"status":"ok"}`. Then test sign-in and upload from the Vercel app.

## Related

- Frontend + domains: `.cursor/skills/vercel/SKILL.md`
- Supabase Auth URLs after domain change: `.cursor/skills/supabase/SKILL.md`
- Env tables: repo `README.md`
