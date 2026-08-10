-- Public-readable row for scheduled keep-alive pings (GitHub Actions / UptimeRobot).
-- Anon SELECT only — no PII. Free-tier projects pause after ~7 days without DB activity.

create table if not exists public.demo_keepalive (
  id int primary key default 1 check (id = 1),
  note text not null default 'clearclause demo keep-alive',
  updated_at timestamptz not null default now()
);

insert into public.demo_keepalive (id)
values (1)
on conflict (id) do nothing;

alter table public.demo_keepalive enable row level security;

drop policy if exists "Anon can read demo keepalive" on public.demo_keepalive;
create policy "Anon can read demo keepalive"
  on public.demo_keepalive
  for select
  to anon, authenticated
  using (true);
