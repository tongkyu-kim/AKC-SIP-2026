-- Budget allocation matrix: for every speaker/VIP/participant, who covers
-- each of 6 expense categories (flight/train/hotel/luncheon/dinner/
-- honorarium), whether it's actually covered, and an optional memo for
-- exceptions (e.g. "2 nights instead of 3"). One row per (speaker,
-- category) -- missing rows just mean "not yet set", the UI treats that
-- the same as an explicit '--' with no org.
--
-- Run once in the Supabase SQL Editor.

create type wkshp_budget_category as enum ('flight', 'train', 'hotel', 'luncheon', 'dinner', 'honorarium');
create type wkshp_budget_status as enum ('O', '--');

create table wkshp_budget_allocations (
  id uuid primary key default gen_random_uuid(),
  speaker_id uuid not null references wkshp_speakers(id) on delete cascade,
  category wkshp_budget_category not null,
  org text,                                          -- AKC / KMAC / KOFICE / WEtheTEAM, or null if unassigned
  status wkshp_budget_status not null default '--',
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (speaker_id, category)
);

create index wkshp_budget_allocations_speaker_id_idx on wkshp_budget_allocations(speaker_id);

create trigger wkshp_budget_allocations_set_updated_at
  before update on wkshp_budget_allocations
  for each row execute function wkshp_set_updated_at();

alter table wkshp_budget_allocations enable row level security;

create policy "public read wkshp_budget_allocations" on wkshp_budget_allocations for select using (true);
create policy "public write wkshp_budget_allocations" on wkshp_budget_allocations for all using (true) with check (true);

alter publication supabase_realtime add table wkshp_budget_allocations;
