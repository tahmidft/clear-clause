---
name: clearclause-vercel
description: >-
  Deploy ClearClause frontend to Vercel from frontend/: Vite build, dist output,
  vercel.json SPA rewrites, VITE_SUPABASE_* and VITE_API_URL env vars, and CORS
  with the Render FastAPI backend. Use when setting up Vercel, preview deploys,
  production env, or CORS/API URL issues from the hosted SPA.
---

# ClearClause — Vercel (frontend)

## Scope

This skill covers **frontend deployment on Vercel**. The API runs on **Render** (`render.yaml` at repo root), not Vercel. A full demo needs both: Vercel SPA + Render API + Supabase (see `.cursor/skills/supabase/SKILL.md`).

## Monorepo layout

| Item | Value |
|------|--------|
| App directory | `frontend/` |
| Framework | Vite + React (`frontend/package.json`) |
| Build command | `npm run build` |
| Output directory | `dist` |
| SPA routing | `frontend/vercel.json` — all paths rewrite to `/index.html` |

When importing the repo in Vercel, set **Root Directory** to `frontend` (or deploy only that folder).

## Required environment variables

Set in Vercel **Project → Settings → Environment Variables** (Production and Preview as needed):

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Anon/publishable key (browser-safe) |
| `VITE_API_URL` | Render API base URL, **no trailing slash** (e.g. `https://clearclause-api.onrender.com`) |

Vite embeds `VITE_*` at **build time**. Changing env vars requires a **redeploy**.

Never add `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, or `DATABASE_URL` to Vercel — those belong on Render only.

## How the SPA talks to the API

- **Local dev**: `frontend/vite.config.ts` proxies `/api/*` → `VITE_API_URL` (same-origin, avoids CORS). Controlled by `VITE_DEV_API_PROXY` (default on in dev).
- **Vercel production/preview**: no Vite proxy — `frontend/src/lib/api.ts` calls `VITE_API_URL` directly. Backend **must** allow the browser origin via CORS.

### CORS on Render (required for Vercel)

In Render service env, set `CORS_ORIGINS` to explicit origins (comma-separated), e.g.:

- Production: `https://clearclause.vercel.app` (and `https://frontend-teal-ten-82.vercel.app` if both aliases are active)
- Preview: add `https://your-app-*.vercel.app` pattern is **not** supported by FastAPI list — add each preview origin you test, or use a stable preview URL

`backend/main.py` uses `CORSMiddleware` with `backend/cors_helpers.py` mirroring `localhost` ↔ `127.0.0.1` for local dev only.

Use `*` only for quick local/open testing, not ideal for production.

## `vercel.json`

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Ensures React Router routes (`/dashboard`, `/signup`, etc.) work on refresh and deep links.

## Deploy via dashboard

1. Import Git repo; **Root Directory** = `frontend`.
2. Framework preset: Vite (or override build/output as above).
3. Add the three `VITE_*` variables for **Production**; duplicate for **Preview** if previews should hit a real API.
4. Deploy; note the production URL for Supabase Site URL and Render `CORS_ORIGINS`.

## Custom domains

### Current production URLs

| URL | Role |
|-----|------|
| `https://clearclause.vercel.app` | Preferred production domain (Vercel subdomain) |
| `https://frontend-teal-ten-82.vercel.app` | Vercel-assigned alias to the same production deployment |
| `https://clearclause-*.vercel.app` | Per-deployment URLs (preview or production) |

Project: **`clearclause`** in team **`tahmidfts-projects`**. Link target: `frontend/.vercel/project.json` → `projectName: clearclause`, `projectId: prj_87cjjNcdGRMtCjPtjpsXFmouNDCl`.

Do **not** confuse with the separate **`frontend`** Vercel project (no production URL) — always deploy/link **`clearclause`**.

### Vercel subdomain (`*.vercel.app`)

No DNS setup required. Assign the subdomain to **Production**:

**Dashboard:** Project **clearclause** → **Settings → Domains** → Add `clearclause.vercel.app` → assign to **Production**.

**CLI (alias to latest production deployment):**

```bash
cd frontend
npx vercel ls clearclause --prod          # note latest *.vercel.app deployment URL
npx vercel alias set <deployment-url> clearclause.vercel.app
```

If `vercel domains add clearclause.vercel.app` fails with **`alias_conflict`**, the name is already on another deployment — use `vercel alias set` as above, or remove the domain from the other project in the dashboard first. `vercel domains inspect` may fail if the domain is team-global but not under your current scope.

### Custom apex / www (e.g. `clearclause.com`)

**Dashboard:** **Settings → Domains** → Add domain → follow Vercel’s DNS instructions.

Typical DNS at your registrar:

| Record | Name | Value |
|--------|------|--------|
| **A** | `@` | `76.76.21.21` (Vercel apex) |
| **CNAME** | `www` | `cname.vercel-dns.com` |

Verification: Vercel shows **Valid Configuration** when DNS propagates (minutes to 48h). Assign the domain to **Production**, then **redeploy** so `VITE_*` embed at build time.

### After any domain change — update paired services

1. **Supabase** → Authentication → URL configuration:
   - **Site URL**: `https://clearclause.vercel.app` (or your apex)
   - **Redirect URLs**: `https://clearclause.vercel.app/**`, preview URLs, `http://localhost:5173/**`, `http://127.0.0.1:5173/**`
2. **Render** → `CORS_ORIGINS`: include every browser origin (comma-separated, no trailing slash), e.g. `https://clearclause.vercel.app,https://frontend-teal-ten-82.vercel.app,http://localhost:5173,http://127.0.0.1:5173`
3. Run `bash scripts/render-sync-deploy.sh` (with `RENDER_API_KEY`) or update Render env manually and redeploy.
4. Redeploy Vercel production if you changed `VITE_*` (usually unchanged for domain-only moves).

## Deploy via CLI

From repo root:

```bash
cd frontend
npm install
cp .env.example .env   # local only; fill for dev — not committed

# Link once to project `clearclause` (creates frontend/.vercel — do not commit)
npx vercel link --project clearclause

# Preview deploy
npx vercel

# Production
npx vercel --prod
```

Set env vars in the Vercel dashboard or `vercel env add` — CLI deploys still need `VITE_*` present at build time.

```bash
npx vercel domains ls
npx vercel alias ls
```

## Preview vs production

| Concern | Production | Preview |
|---------|------------|---------|
| Vercel env scope | Production | Preview |
| `VITE_API_URL` | Production Render URL | Same API or a staging API — must match where you want data |
| `CORS_ORIGINS` on Render | Must include production Vercel URL | Add each preview origin you use |
| Supabase Auth URLs | Add production domain | Add preview domain(s) if testing auth flows |

Preview deployments get unique URLs; update Supabase **Redirect URLs** when testing email confirmation on previews.

## Render backend checklist (paired deploy)

From `render.yaml` / README — API service needs:

- `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`
- `CORS_ORIGINS` including your Vercel URL(s)
- Build: `cd backend && pip install -r requirements.txt`
- Start: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`

Optional: cron `GET https://<render-host>/health` every ~10 min to reduce Render free-tier cold starts.

## Troubleshooting

### "We could not reach the server" / network errors

- [ ] `VITE_API_URL` set on Vercel and redeployed after change.
- [ ] Render service running; `GET {VITE_API_URL}/health` returns `{"status":"ok"}`.
- [ ] Cold start — retry after ~30s on free tier.

### CORS errors in browser console

- [ ] `CORS_ORIGINS` on Render includes exact scheme + host of the Vercel page (no trailing path).
- [ ] Not relying on Vite proxy in production (proxy is dev-only).

### Auth works locally but not on Vercel

- [ ] Supabase **Site URL** / redirect URLs include `https://clearclause.vercel.app/**` (and preview URLs if used).
- [ ] Same `VITE_SUPABASE_*` project as backend Supabase env on Render.

### Site shows "Authentication Required" (Vercel SSO)

- [ ] Disable deployment protection: `vercel project protection disable clearclause --sso` (or Vercel dashboard → Project → Deployment Protection).

### 401 on API after deploy

- [ ] `SUPABASE_ANON_KEY` on Render matches `VITE_SUPABASE_ANON_KEY`.
- [ ] User signed in on production domain (session tied to origin).

## Pre-deploy smoke test (hosted)

- [ ] `curl https://<render-api>/health`
- [ ] Sign up / sign in on Vercel URL
- [ ] Upload PDF/DOCX & run analysis
- [ ] Delete contract (DB + storage)

## Security

- Do not commit `frontend/.vercel/` or real `.env` files.
- Do not put secrets in `VITE_*` — they are visible in the client bundle.

## Related

- Supabase schema, Auth, Storage: `.cursor/skills/supabase/SKILL.md`
- Render API, keep-alive, health: `.cursor/skills/render/SKILL.md`
- Full env table: repo `README.md`
