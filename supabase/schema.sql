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
  created_at timestamp with time zone default now()
);

-- Row Level Security
alter table preferences enable row level security;
alter table contracts enable row level security;
alter table analyses enable row level security;

create policy "Users can manage own preferences" on preferences for all using (auth.uid() = user_id);

create policy "Users can manage own contracts" on contracts for all using (auth.uid() = user_id);

create policy "Users can view own analyses" on analyses for all using (
  contract_id in (select id from contracts where user_id = auth.uid())
);
