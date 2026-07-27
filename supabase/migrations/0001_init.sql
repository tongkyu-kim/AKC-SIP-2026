-- ASEAN-Korea Workshop Dashboard schema
-- Run this in the Supabase SQL Editor (or via `supabase db push`).
--
-- All objects are prefixed with `wkshp_` so this can safely share a Supabase
-- project with other apps (e.g. an existing TIU dashboard) without colliding
-- with their table/function names.

create extension if not exists "pgcrypto";

-- ---------- enums ----------

create type wkshp_speaker_status as enum (
  'backup',
  'shortlisted',
  'contacted',
  'ongoing',
  'confirmed'
);

-- ---------- updated_at trigger helper ----------

create or replace function wkshp_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------- days ----------

create table wkshp_days (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  label text not null,          -- e.g. "Day 2 (October 8, Thursday)"
  subtitle text,                 -- e.g. "Opening Ceremony, High-Level Session & Keynote"
  day_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger wkshp_days_set_updated_at
  before update on wkshp_days
  for each row execute function wkshp_set_updated_at();

-- ---------- speakers ----------

create table wkshp_speakers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title_org text,                -- role / organization, e.g. "Executive Director, ASEAN Foundation"
  bio text,
  photo_url text,
  email text,
  phone text,
  status wkshp_speaker_status not null default 'backup',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger wkshp_speakers_set_updated_at
  before update on wkshp_speakers
  for each row execute function wkshp_set_updated_at();

-- ---------- sessions (top-level schedule blocks within a day) ----------

create table wkshp_sessions (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references wkshp_days(id) on delete cascade,
  title text not null,
  description text,              -- free text body for sessions without itemized subsessions
  start_time text,                -- "14:00" (free text so odd formats like "All Day" still work via display_time)
  end_time text,                  -- "16:00"
  display_time text,              -- overrides the time label shown, e.g. "All Day"
  session_type text not null default 'session', -- 'session' | 'break' | 'meal' | 'ceremony' | 'workshop'
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index wkshp_sessions_day_id_idx on wkshp_sessions(day_id);

create trigger wkshp_sessions_set_updated_at
  before update on wkshp_sessions
  for each row execute function wkshp_set_updated_at();

-- ---------- subsessions (itemized agenda items within a session) ----------

create table wkshp_subsessions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references wkshp_sessions(id) on delete cascade,
  title text not null,
  time_range text,                -- "16:30-16:35"
  description text,
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index wkshp_subsessions_session_id_idx on wkshp_subsessions(session_id);

create trigger wkshp_subsessions_set_updated_at
  before update on wkshp_subsessions
  for each row execute function wkshp_set_updated_at();

-- ---------- subsession <-> speaker links ----------

create table wkshp_subsession_speakers (
  id uuid primary key default gen_random_uuid(),
  subsession_id uuid not null references wkshp_subsessions(id) on delete cascade,
  speaker_id uuid not null references wkshp_speakers(id) on delete cascade,
  role text not null default 'Speaker', -- 'Presenter' | 'Moderator' | 'Panelist' | 'Speaker' | ...
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create index wkshp_subsession_speakers_subsession_id_idx on wkshp_subsession_speakers(subsession_id);
create index wkshp_subsession_speakers_speaker_id_idx on wkshp_subsession_speakers(speaker_id);

-- ---------- row level security ----------
-- This dashboard is designed to be shared with workshop organizing members via
-- a link + the Supabase anon key, without individual member accounts. That
-- means the anon key is granted open read/write access below. If you later
-- need per-user auth or an audit trail, tighten these policies and add
-- Supabase Auth.

alter table wkshp_days enable row level security;
alter table wkshp_speakers enable row level security;
alter table wkshp_sessions enable row level security;
alter table wkshp_subsessions enable row level security;
alter table wkshp_subsession_speakers enable row level security;

create policy "public read wkshp_days" on wkshp_days for select using (true);
create policy "public write wkshp_days" on wkshp_days for all using (true) with check (true);

create policy "public read wkshp_speakers" on wkshp_speakers for select using (true);
create policy "public write wkshp_speakers" on wkshp_speakers for all using (true) with check (true);

create policy "public read wkshp_sessions" on wkshp_sessions for select using (true);
create policy "public write wkshp_sessions" on wkshp_sessions for all using (true) with check (true);

create policy "public read wkshp_subsessions" on wkshp_subsessions for select using (true);
create policy "public write wkshp_subsessions" on wkshp_subsessions for all using (true) with check (true);

create policy "public read wkshp_subsession_speakers" on wkshp_subsession_speakers for select using (true);
create policy "public write wkshp_subsession_speakers" on wkshp_subsession_speakers for all using (true) with check (true);

-- ---------- realtime ----------

alter publication supabase_realtime add table wkshp_days;
alter publication supabase_realtime add table wkshp_speakers;
alter publication supabase_realtime add table wkshp_sessions;
alter publication supabase_realtime add table wkshp_subsessions;
alter publication supabase_realtime add table wkshp_subsession_speakers;
