# Supabase keep-alive (live demo)

Public-readable row for scheduled keep-alive pings (GitHub Actions or UptimeRobot).
Prevents Free-tier auto-pause (~7 days without DB activity) so the live demo stays sign-in ready.

## One-time SQL

Already applied on the resumed production project. For a new project:

```bash
# via SQL Editor, or:
# psql "$DATABASE_URL" -f supabase/migrations/20260810_demo_keepalive.sql
```

Also included in `supabase/schema.sql` for greenfield setup.

## Monitor URL

`GET {SUPABASE_URL}/rest/v1/demo_keepalive?select=id&limit=1`

Headers:

- `apikey: <anon key>`
- `Authorization: Bearer <anon key>`

Expect HTTP **200** and body like `[{"id":1}]`.

## GitHub Actions (integrated)

Workflow: `.github/workflows/supabase-keepalive.yml` (every 3 days + manual).

Repo secrets required:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## UptimeRobot (optional)

Same URL and headers, interval every few hours or daily. Not required if the GitHub workflow is enabled with secrets.
