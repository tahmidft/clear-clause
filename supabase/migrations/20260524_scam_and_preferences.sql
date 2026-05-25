-- Run in Supabase SQL editor if your project was created before this migration.

alter table preferences
  add column if not exists max_revision_rounds integer default 3,
  add column if not exists requires_deposit boolean default true,
  add column if not exists min_deposit_percent integer default 25,
  add column if not exists liability_cap_required boolean default true,
  add column if not exists accepts_broad_indemnification boolean default false,
  add column if not exists kill_fee_required boolean default true,
  add column if not exists written_scope_required boolean default true;

alter table analyses
  add column if not exists likely_scam boolean default false,
  add column if not exists scam_risk text default 'low',
  add column if not exists scam_signals jsonb default '[]'::jsonb;

alter table analyses drop constraint if exists analyses_scam_risk_check;
alter table analyses add constraint analyses_scam_risk_check
  check (scam_risk in ('low', 'medium', 'high'));
