-- Adds "organizer" as a valid wkshp_speaker_category value, for the new
-- Organizer Roster (partners/co-organizers, kept separate from speakers and
-- participants so they never get mixed up via the roster drag-to-regroup
-- interactions).
--
-- Purely additive — existing rows and the existing enum values are
-- untouched. Run this once in the Supabase SQL Editor before using the
-- Organizer Roster feature.

alter type wkshp_speaker_category add value 'organizer';
