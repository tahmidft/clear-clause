---
name: clearclause-production-deploy
description: >-
  End-to-end ClearClause production deploy: Vercel frontend, Render API,
  Supabase auth URLs, GitHub secrets/CI, keep-alive, and smoke checks. Use when
  restoring production or pairing hosted frontend + API + Supabase.
---

# ClearClause — Production deploy (orchestration)

Thin orchestration skill. Details live in component skills (do not duplicate them here).

| Component | Skill |
|-----------|--------|
| Frontend (Vercel) | `.cursor/skills/vercel/SKILL.md` |
| Backend API (Render) | `.cursor/skills/render/SKILL.md` |
| Supabase Auth/DB/Storage | `.cursor/skills/supabase/SKILL.md` |

## Production URLs

| Service | URL |
|---------|-----|
| Frontend | `https://clearclause.vercel.app` |
| API health | `https://clearclause-api.onrender.com/health` |
| Vercel alias | `https://frontend-teal-ten-82.vercel.app` |

## Credentials (automation)

| Secret / var | Where | Enables |
|--------------|--------|---------|
| `RENDER_API_KEY` | `backend/.env` (gitignored) or GitHub secret | `scripts/render-sync-deploy.sh` — sync env + deploy |
| `RENDER_DEPLOY_HOOK_URL` | `backend/.env` or GitHub secret `RENDER_DEPLOY_HOOK_URL` | POST deploy; CI job in `deploy-production.yml` |
| `VERCEL_TOKEN` + `VERCEL_ORG_ID` + `VERCEL_PROJECT_ID` | GitHub secrets | CI Vercel prod deploy |
| `SUPABASE_ACCESS_TOKEN` | env (Account → Access Tokens) | `scripts/supabase-auth-urls.sh` |

Never commit real tokens. `backend/.env` already holds app secrets (`GEMINI_*`, `SUPABASE_*`, `DATABASE_URL`); add optional `RENDER_*` lines from `backend/.env.example`.

## Automated restore order

1. **Render API** (blocked without `RENDER_API_KEY` or hook):
   ```bash
   bash scripts/render-sync-deploy.sh
   ```
2. **Supabase auth URLs** (blocked without `SUPABASE_ACCESS_TOKEN`):
   ```bash
   bash scripts/supabase-auth-urls.sh
   ```
3. **Vercel** (CLI logged in): `cd frontend && npx vercel --prod --yes` or `bash scripts/deploy-production.sh`
4. **Keep-alive**:
   - Render: GitHub Actions `.github/workflows/render-keepalive.yml` (every 10 min) or cron-job.org — see Render skill
   - Supabase: `.github/workflows/supabase-keepalive.yml` (every 3 days) — requires Actions secrets `SUPABASE_URL` + `SUPABASE_ANON_KEY`; see Supabase skill
5. **Verify**:
   ```bash
   curl -fsS --max-time 120 https://clearclause-api.onrender.com/health
   curl -fsS -o /dev/null https://clearclause.vercel.app/
   ```

## GitHub Actions

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `deploy-production.yml` | push `main` (backend/frontend paths), `workflow_dispatch` | Render hook deploy + optional Vercel |
| `render-keepalive.yml` | cron `*/10 * * * *`, `workflow_dispatch` | Warm Render `/health` |
| `supabase-keepalive.yml` | cron every 3 days, `workflow_dispatch` | Prevent Free-tier Supabase pause (`demo_keepalive`) |
| `ci.yml` | push / PR | Lint, test, build |

Set `RENDER_DEPLOY_HOOK_URL` in repo secrets so pushes to `main` can redeploy the API without a local API key.

## One-liner if Render is still down

After adding **one** of `RENDER_API_KEY` or `RENDER_DEPLOY_HOOK_URL` to `backend/.env`:

```bash
bash scripts/render-sync-deploy.sh
```

## Related

- Render deploy, CORS, troubleshooting: `.cursor/skills/render/SKILL.md`
- Vercel env, domains: `.cursor/skills/vercel/SKILL.md`
- Auth URL checklist: `.cursor/skills/supabase/SKILL.md`
