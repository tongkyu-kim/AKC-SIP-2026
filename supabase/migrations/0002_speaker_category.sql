-- Adds a "category" designation to speakers (VIP / Speaker / Moderator), used to
-- color-code their avatar. Purely additive — existing rows get the default
-- 'speaker' category and nothing is deleted or reset.
-- Run this in the Supabase SQL Editor after 0001_init.sql / 0002_seed.sql.

create type wkshp_speaker_category as enum ('vip', 'speaker', 'moderator');

alter table wkshp_speakers
  add column category wkshp_speaker_category not null default 'speaker';
