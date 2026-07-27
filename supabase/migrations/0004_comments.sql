-- A simple team memo/comment log, shown alongside the speaker roster so
-- different teams can leave notes for each other. No auth — "author" is a
-- free-text name the poster types in, same trust model as the rest of the app.
-- Run this in the Supabase SQL Editor after 0001_init.sql.

create table wkshp_comments (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index wkshp_comments_created_at_idx on wkshp_comments(created_at);

alter table wkshp_comments enable row level security;

create policy "public read wkshp_comments" on wkshp_comments for select using (true);
create policy "public write wkshp_comments" on wkshp_comments for all using (true) with check (true);

alter publication supabase_realtime add table wkshp_comments;
