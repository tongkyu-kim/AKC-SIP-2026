-- Adds a fourth speaker category, "participant" (colored green in the UI),
-- alongside vip/speaker/moderator. Purely additive.
-- Run this in the Supabase SQL Editor after 0002_speaker_category.sql.

alter type wkshp_speaker_category add value 'participant';
