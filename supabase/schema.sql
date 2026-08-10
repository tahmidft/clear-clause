-- Run in Supabase SQL editor for ClearClause
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Preferences table
create table preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade unique,
  unpaid_revisions boolean default false,
  payment_terms_days integer default 30,
  ip_ownership boolean default true,
  non_compete boolean default false,
  termination_notice_days integer default 14,
  max_revision_rounds integer default 3,
  requires_deposit boolean default true,
  min_deposit_percent integer default 25,
  liability_cap_required boolean default true,
  accepts_broad_indemnification boolean default false,
  kill_fee_required boolean default true,
  written_scope_required boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Contracts table
create table contracts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  file_name text not null,
  storage_path text,
  file_url text,
  raw_text text,
  created_at timestamp with time zone default now()
);

-- Analyses table
create table analyses (
  id uuid primary key default uuid_generate_v4(),
  contract_id uuid references contracts(id) on delete cascade unique,
  sections jsonb not null,
  overall_score integer,
  recommendation text check (recommendation in ('accept', 'reject')),
  recommendation_reason text,
  preference_conflicts jsonb,
  likely_scam boolean default false,
  scam_risk text default 'low' check (scam_risk in ('low', 'medium', 'high')),
  scam_signals jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

-- Demo keep-alive (anon-readable) — used by .github/workflows/supabase-keepalive.yml
create table if not exists demo_keepalive (
  id int primary key default 1 check (id = 1),
  note text not null default 'clearclause demo keep-alive',
  updated_at timestamptz not null default now()
);

insert into demo_keepalive (id)
values (1)
on conflict (id) do nothing;

-- Row Level Security
alter table preferences enable row level security;
alter table contracts enable row level security;
alter table analyses enable row level security;
alter table demo_keepalive enable row level security;

create policy "Users can manage own preferences" on preferences for all using (auth.uid() = user_id);

create policy "Users can manage own contracts" on contracts for all using (auth.uid() = user_id);

create policy "Users can view own analyses" on analyses for all using (
  contract_id in (select id from contracts where user_id = auth.uid())
);

create policy "Anon can read demo keepalive" on demo_keepalive
  for select to anon, authenticated using (true);
