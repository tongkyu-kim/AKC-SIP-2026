-- Adds an empty "Pre-Session" day before Day 1, for prep workshops whose
-- dates aren't set yet. Non-destructive: a single INSERT, safe to run once.
-- Add your workshop sessions afterward via "+ Session" (pick Type: Workshop,
-- and fill in each session's own Date once it's known).

insert into wkshp_days (id, event_date, label, subtitle, day_order, is_preworkshop) values
  ('00000000-0000-0000-0000-000000000000', null, 'Pre-Session', 'Preparatory workshops for ASEAN participants — dates to be confirmed', 0, true);
