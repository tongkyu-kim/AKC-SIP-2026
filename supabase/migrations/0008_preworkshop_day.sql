-- Supports a "Pre-Session" day placed before Day 1, for prep workshops whose
-- exact dates aren't set yet: the day itself may have no fixed date, and each
-- session under it can carry its own manually-entered date instead of
-- inheriting the day's. Additive/non-destructive.

alter table wkshp_days alter column event_date drop not null;
alter table wkshp_days add column is_preworkshop boolean not null default false;

alter table wkshp_sessions add column event_date date;
