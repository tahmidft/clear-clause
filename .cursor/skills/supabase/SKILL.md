---
name: clearclause-supabase
description: >-
  ClearClause Supabase setup: schema.sql, Auth (email/password), Storage bucket
  contracts, env vars, JWT validation on the FastAPI backend, and Postgres via
  DATABASE_URL. Use when debugging signup/login, RLS/schema errors, Storage
  uploads, or Supabase configuration for this repo.
---

# ClearClause — Supabase

## Architecture (this repo)

| Layer | Role |
|-------|------|
| **Frontend** (`frontend/src/lib/supabase.ts`) | `@supabase/supabase-js` — Auth sessions only (sign up/in/out, `getSession`) |
| **Backend API** | Contract CRUD, analysis, preferences via **SQLAlchemy + `DATABASE_URL`** (not PostgREST from the browser) |
| **Backend auth** (`backend/deps.py`) | Validates each request: `GET {SUPABASE_URL}/auth/v1/user` with caller's Bearer JWT + `apikey: SUPABASE_ANON_KEY` |
| **Backend storage** (`backend/services/storage.py`) | Upload/delete in bucket `contracts` via **service role** client |

Frontend API calls (`frontend/src/lib/api.ts`) attach `Authorization: Bearer <access_token>` from `supabase.auth.getSession()`. The backend never trusts the client for `user_id`; it derives it from Supabase Auth.

**RLS** in `supabase/schema.sql` protects direct anon access to tables. The app's normal path uses the backend DB role from `DATABASE_URL`, which typically **bypasses RLS**. RLS still matters if someone uses the anon key against PostgREST directly.

## One-time project setup

1. Create a Supabase project (Auth enabled).
2. **SQL Editor**: run `supabase/schema.sql` (creates `preferences`, `contracts`, `analyses` + RLS policies).
3. **Storage**: create a **public** bucket named `contracts`. Backend uploads to `{user_id}/{uuid}_{filename}` and stores `storage_path` + public `file_url`. Deletion parses `/public/contracts/` from URLs when needed.
4. Copy keys from **Project Settings → API** (never commit real values):
   - Project URL
   - Anon / publishable key (browser-safe)
   - Service role / secret key (server only)

## Environment variables

### Frontend (`frontend/.env` — see `frontend/.env.example`)

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | Anon/publishable key only — **not** service role |
| `VITE_API_URL` | FastAPI base URL (no trailing slash); used in production and when dev proxy is off |

### Backend (`backend/.env` — see `backend/.env.example`)

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Same project URL as frontend |
| `SUPABASE_ANON_KEY` | Same value as `VITE_SUPABASE_ANON_KEY` — JWT validation |
| `SUPABASE_SERVICE_ROLE_KEY` | Storage upload/delete only |
| `DATABASE_URL` | Postgres URI (pooler or direct; add `?sslmode=require` if needed) |

Frontend and backend **must** point at the **same** Supabase project or auth and data will disagree.

## Schema reference (`supabase/schema.sql`)

- **`preferences`**: per-user analysis defaults (`user_id` → `auth.users`, unique).
- **`contracts`**: uploaded files metadata (`storage_path`, `file_url`, optional `raw_text`).
- **`analyses`**: one per contract (`sections` jsonb, `overall_score`, `recommendation` accept|reject).

Missing tables → API may return hints from `backend/db_errors.py` to run `schema.sql`.

## Auth flow (code paths)

1. `AuthProvider` (`frontend/src/context/AuthContext.tsx`): `signInWithPassword` / `signUp` / `onAuthStateChange`.
2. Protected routes use `useAuth()`; API layer reads session in `authHeaders()` (`frontend/src/lib/api.ts`).
3. Backend `get_current_user_id()` in `backend/deps.py` calls Auth REST API; 401 → frontend may `signOut()` on API errors.

Signup errors are surfaced in the UI toast (Supabase `error.message`).

## Local dev fixes

### Signup / sign-in failures

- [ ] **Authentication → Providers → Email**: enable signup; decide **Confirm email** — if required, user must confirm before sign-in works.
- [ ] **Authentication → URL configuration → Site URL**: match dev origin (`http://localhost:5173` or `http://127.0.0.1:5173`).
- [ ] **`VITE_SUPABASE_ANON_KEY`**: anon/publishable key from API settings — not service role; wrong key → "Invalid API key" style errors.
- [ ] **Duplicate email**: sign in instead of signing up again.
- [ ] Restart Vite after changing `frontend/.env`.

### API returns 401 / 503 on authenticated routes

- [ ] Backend has `SUPABASE_URL` + `SUPABASE_ANON_KEY` set and matches frontend project.
- [ ] Request includes `Authorization: Bearer <access_token>` (session not expired).
- [ ] Clock skew / expired session — sign out and in again.

### Database / schema errors

- [ ] Run `supabase/schema.sql` in SQL Editor.
- [ ] `DATABASE_URL` correct (password, pooler host, SSL).
- [ ] **Local dev / IPv4-only networks**: direct `db.<ref>.supabase.co` is often **IPv6-only**. If you see "Network is unreachable" or "Cannot connect to the database", use the **pooler** URI from Dashboard → **Connect** (host `aws-0-<region>.pooler.supabase.com`, user `postgres.<ref>`, port `6543` transaction or `5432` session). Run `bash scripts/verify-database.sh` from repo root.
- [ ] **Password in URI**: do not copy `[YOUR-PASSWORD]` brackets from the dashboard; URL-encode `#` as `%23`. The backend normalizes `postgres:[...]@` automatically.
- [ ] Connection errors → check `backend/db_errors.py` messages and Supabase **Database** settings (IP allowlist if used).

### Storage upload / delete failures

- [ ] Bucket `contracts` exists (public if using public URLs as documented in README).
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set on backend only.
- [ ] File paths: backend uses service role; browser does not upload to Storage directly.

## Email confirmation (signup “no email” reports)

Supabase may create the account and return HTTP 200 with `confirmation_sent_at` set, but **no session** until the user confirms. That is expected when **Confirm email** is enabled.

### Symptoms

- Signup “succeeds” but user cannot sign in yet.
- Login returns `Email not confirmed` from Supabase.
- User never receives mail (inbox or spam).

### Supabase dashboard checklist

1. **Authentication → Providers → Email**
   - **Enable email signup**: ON
   - **Confirm email**: ON for production; OFF only for local/demo if you accept the security tradeoff (see below)
2. **Authentication → URL configuration**
   - **Site URL**: production Vercel URL, e.g. `https://clearclause.vercel.app` (see `.cursor/skills/vercel/SKILL.md` for aliases)
   - **Redirect URLs** (add each line):
     - `https://clearclause.vercel.app/**`
     - `http://localhost:5173/**`
     - `http://127.0.0.1:5173/**`
     - Any Vercel preview URLs you test with (`https://*.vercel.app/**` if Supabase allows wildcards)
   - Confirmation links use `emailRedirectTo` from the app (`/login` on the current origin). The `/**` wildcard covers all app paths including `/update-password` (password reset) and `/login` (email confirmation). Redirect URLs must allow both paths.
3. **Authentication → Email templates → Confirm signup**
   - Review subject/body; ensure the link uses `{{ .ConfirmationURL }}`.
4. **Project Settings → Authentication → SMTP Settings** (recommended for production)
   - Default Supabase mail is **rate-limited** (~4 emails/hour on free tier) and often lands in spam.
   - Configure custom SMTP (Resend, SendGrid, etc.) for reliable delivery.
5. **Authentication → Logs**
   - Check for signup/confirmation events and mail errors after a test signup.

### Demo without email confirmation

For demos only: **Authentication → Providers → Email → turn OFF “Confirm email”**. New signups get a session immediately and go straight to onboarding. Re-enable for production.

### App behavior (frontend)

- After signup with confirmation required, the UI shows a **Check your email** screen (not a silent redirect).
- Login maps `Email not confirmed` to a clear message and offers **Resend confirmation email**.
- `signUp` passes `emailRedirectTo: ${origin}/login` so confirmed users land on sign-in.
- **Forgot password** (`/forgot-password`): calls `resetPasswordForEmail` with `emailRedirectTo: ${origin}/update-password`.
- **Update password** (`/update-password`): waits for Supabase `PASSWORD_RECOVERY` auth event; on success signs the recovery session out and redirects to `/login`. Shows an "expired link" screen if no session arrives within 3 seconds.

## Production / deployed frontend

Set Supabase **Site URL** and **Redirect URLs** to your Vercel origin(s) (production + preview URLs if using email links).

**Automate** (requires [Account → Access Tokens](https://supabase.com/dashboard/account/tokens) as `SUPABASE_ACCESS_TOKEN`, or `supabase login`):

```bash
export SUPABASE_ACCESS_TOKEN=sbp_…   # optional if already logged in via CLI
bash scripts/supabase-auth-urls.sh
```

Defaults: Site URL `https://clearclause.vercel.app`; redirects include that origin, `https://frontend-teal-ten-82.vercel.app/**`, and local Vite hosts. Override with `SUPABASE_SITE_URL` or `SUPABASE_REDIRECT_URLS` (newline-separated patterns).

## Keep-alive (free tier pause)

Free Plan projects **auto-pause after ~7 days of low database activity**. That makes the live demo fail sign-in with `Failed to fetch` until someone hits **Resume** in the dashboard.

ClearClause prevents this with GitHub Actions (preferred over UptimeRobot for this repo — same pattern as Render):

| Piece | Detail |
|-------|--------|
| Workflow | `.github/workflows/supabase-keepalive.yml` (cron every 3 days + `workflow_dispatch`) |
| Ping | `GET {SUPABASE_URL}/rest/v1/demo_keepalive?select=id&limit=1` with anon key |
| Table | `demo_keepalive` — migration `supabase/migrations/20260810_demo_keepalive.sql` (also in `schema.sql`) |
| Secrets | Repo Actions secrets `SUPABASE_URL` and `SUPABASE_ANON_KEY` |

Also keep **`render-keepalive.yml`** enabled so the API does not cold-start for 30–90s after login.

Optional: UptimeRobot (or cron-job.org) can hit the same REST URL with the same headers; GitHub Actions is already integrated and free for public repos.

## Security rules for agents

- Never paste or commit real keys, JWTs, or `DATABASE_URL` with passwords.
- Never put `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEY` in frontend env.
- Rotate all keys in Supabase + Render + Vercel if exposed.

## Quick verification

```bash
# Backend health (local)
curl -s http://localhost:8000/health

# After signup, session should exist in browser; API call needs Bearer token
# Schema: Supabase SQL Editor → confirm tables preferences, contracts, analyses exist
```

## Related

- Production orchestration: `.cursor/skills/production-deploy/SKILL.md`
- Frontend deploy and `VITE_*` on Vercel: `.cursor/skills/vercel/SKILL.md`
- Backend host: Render — `.cursor/skills/render/SKILL.md`
