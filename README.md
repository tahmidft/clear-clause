# ClearClause

ClearClause is an AI-powered freelance contract analyzer. Upload a PDF or DOCX, and the app extracts the text, runs analysis with Google Gemini 1.5 Flash on the backend, and stores results in Supabase PostgreSQL. Authentication is handled by Supabase Auth; the FastAPI backend validates every request using the Supabase Auth REST API.

## Repository layout

| Path | Description |
|------|-------------|
| `frontend/` | React + TypeScript + Vite, Tailwind CSS, shadcn/ui, Lucide icons |
| `backend/` | FastAPI API, Gemini integration, PDF/DOCX parsing, Supabase Storage |
| `supabase/schema.sql` | Tables, RLS policies, and indexes to run in the Supabase SQL editor |
| `render.yaml` | Example Render blueprint for the API |
| `frontend/vercel.json` | SPA rewrite rules for Vercel |

## Prerequisites

- Node.js 20+ (for the frontend)
- Python 3.11+ (for the backend)
- A [Supabase](https://supabase.com/) project with Auth enabled
- A [Google AI Studio](https://aistudio.google.com/) API key for Gemini

## Supabase setup

1. Create a project and note the **Project URL**, **anon public** key, and **service role** key (server only).
2. In **SQL Editor**, run `supabase/schema.sql` from this repo.
3. Under **Storage**, create a **public** bucket named `contracts` (or keep it private and adjust how `file_url` is stored; the backend expects a public URL path segment `/public/contracts/` for deletion).
4. Under **Project Settings → Database**, copy the **connection string** (URI) for `DATABASE_URL` (use the direct connection or pooler as you prefer; add `?sslmode=require` if required).

## Auth setup

Email/password works out of the box with Supabase Auth.

### If signup fails or “no confirmation email”

The signup screen shows Supabase errors in a toast. When **Confirm email** is enabled, signup succeeds without a session: you’ll see **Check your email** and must confirm before sign-in.

Common fixes:

1. **Authentication → Providers → Email**: enable signup; **Confirm email** ON for production, OFF only for local/demo if you want instant sign-in without mail.
2. **Authentication → URL configuration**: **Site URL** and **Redirect URLs** must include your app origin (local: `http://127.0.0.1:5173/**`; production: your Vercel URL + `/**`).
3. **SMTP**: default Supabase mail is rate-limited and often goes to spam—configure custom SMTP for production (see `.cursor/skills/supabase/SKILL.md`).
4. **`VITE_SUPABASE_ANON_KEY`**: use the **anon (public)** key from **Project Settings → API**; never the service role key.
5. **Duplicate email**: sign in instead of signing up again.

**Demo without email:** turn off **Confirm email** in the Supabase dashboard; users can sign up and use the app immediately.

## Environment variables

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `VITE_API_URL` | Base URL of the FastAPI backend (no trailing slash), e.g. `http://localhost:8000` |

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Generative AI key |
| `SUPABASE_URL` | Same as frontend |
| `SUPABASE_ANON_KEY` | Anon key; used to call `GET /auth/v1/user` for JWT validation |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key; used for Storage uploads and deletes only |
| `DATABASE_URL` | Postgres connection string (Supabase) |
| `CORS_ORIGINS` | Comma-separated list of allowed browser origins (e.g. your Vercel URL), or `*` for open testing (cookies not used with `*`) |
| `APP_ENV` | `development` or `production` (enables stricter headers in production) |
| `RATE_LIMIT_UPLOADS_PER_MINUTE` | Per-user upload rate limit |
| `RATE_LIMIT_ANALYSIS_PER_MINUTE` | Per-user analysis rate limit |
| `CONTRACT_TEXT_PERSISTENCE_ENABLED` | Whether parsed contract text is stored in DB |
| `CONTRACT_TEXT_RETENTION_DAYS` | Days before stored raw text is automatically nulled |

Never commit real keys. Copy from `.env.example` files in each package.

## Run locally

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # fill in values
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Health check: `GET http://localhost:8000/health`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env        # fill in values; point VITE_API_URL at the backend
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

## Deployment

### Frontend (Vercel)

1. Import the `frontend` directory as a Vite project (or set **Root Directory** to `frontend` in Vercel).
2. Set build command `npm run build` and output directory `dist`.
3. Add environment variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` (your Render API URL).
4. `frontend/vercel.json` rewrites all routes to `index.html` for client-side routing.

### Backend (Render)

1. Create a **Web Service** from this repository.
2. Use **Root Directory** `backend`, or keep root as repo root and set:
   - **Build command:** `cd backend && pip install -r requirements.txt`
   - **Start command:** `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Add the same env vars as in `backend/.env.example`, plus `CORS_ORIGINS` set to your Vercel origin (e.g. `https://your-app.vercel.app`).
4. Optionally use `render.yaml` as a blueprint (paths assume repo root).

### Keep-alive (cron-job.org)

After deploy, create a free cron job:

- **URL:** `https://<your-render-service>.onrender.com/health`
- **Interval:** every 10 minutes
- **Method:** GET

This reduces cold starts on Render’s free tier.

## Pre-deploy regression checklist

- Sign up with email/password and complete onboarding.
- Sign in with email/password and confirm redirect lands on dashboard.
- Upload PDF and DOCX files under 10 MB and confirm analysis renders.
- Confirm existing contracts remain visible after sign out/in.
- Verify delete removes both DB row and storage object.
- Verify API health endpoint returns `{"status":"ok"}` after deploy.
- Ensure production `CORS_ORIGINS` is explicit (not `*`).

## Security notes

- All Gemini calls run **only** on the backend.
- Row Level Security in Supabase protects tables when accessed with the anon key; the app’s contract CRUD goes through the API using the user JWT and Postgres via `DATABASE_URL` (typically bypasses RLS as the database role).
- JWTs are validated by calling Supabase Auth’s `GET /auth/v1/user` with the caller’s bearer token.
- Rotate keys immediately if exposed. Update `backend/.env`, host provider env vars, and Supabase provider secrets at the same time to avoid outage.

## Scripts

- `frontend`: `npm run dev`, `npm run build`, `npm run lint`, `npm run test`

## License

Use and modify for your own projects. AI output is informational only and is **not** legal advice.
