-- Remaps existing rows onto the unified vocabulary from 0013. Must run after
-- 0013 has been committed. Order matters within this file: "confirmed" is
-- renamed to "prepared" before "contacted" is renamed to "confirmed", so the
-- second statement's target value isn't still occupied by the first
-- statement's source rows.
update wkshp_speakers set status = 'prepared' where status = 'confirmed';
update wkshp_speakers set status = 'confirmed' where status = 'contacted';
update wkshp_speakers set status = 'backup' where status = 'ongoing';
