-- Swaps the Pre-Session day's specific placeholder date for a broader
-- "Aug.-Sept." range label (the app shows this automatically whenever a
-- pre-workshop day has no event_date set). Non-destructive, single UPDATE.

update wkshp_days set
  event_date = null,
  subtitle = 'Preparatory workshops for ASEAN participants (exact dates within Aug.-Sept. TBD)'
where id = '00000000-0000-0000-0000-000000000000';
