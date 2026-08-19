-- Unify the booking-status vocabulary shared by every wkshp_speakers row
-- (vip/speaker/moderator/participant/organizer alike). Previously "confirmed"
-- read as blue for speakers but green for participants, and "contacted" the
-- reverse -- same word, different meaning depending which roster you were
-- looking at. One 5-stage pipeline now applies everywhere:
--   backup (gray) -> unavailable (red) -> shortlisted (yellow)
--   -> confirmed (blue) -> prepared (green)
--
-- Run this block first, in the Supabase SQL editor, before deploying the app
-- code that references the new enum values -- Postgres enum additions must
-- be committed before any row can be set to them.
alter type wkshp_speaker_status add value if not exists 'unavailable';
alter type wkshp_speaker_status add value if not exists 'prepared';
