-- Gives the Pre-Session day a placeholder September date so the banner shows
-- an actual date instead of "Dates to be confirmed" (which was also being
-- duplicated by the subtitle text). Non-destructive, single UPDATE.

update wkshp_days set
  event_date = '2026-09-01',
  subtitle = 'Preparatory workshops for ASEAN participants (exact dates within September TBD)'
where id = '00000000-0000-0000-0000-000000000000';
