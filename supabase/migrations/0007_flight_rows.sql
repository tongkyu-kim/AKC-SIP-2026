-- Lets a subsession/"program item" represent a flight instead of a talk, for
-- the arrival/departure matrix on transport-heavy days. When kind = 'flight',
-- the flight_* columns hold the structured details and the row is rendered
-- differently (flight code, route, two times) instead of a title + time_range.
-- Also adds hide_speakers, for rows that never need a speakers/persons column
-- at all (e.g. a plain itinerary item) so their description can use the full
-- row width instead.
-- Additive/non-destructive: all new columns are nullable or have a safe default.

alter table wkshp_subsessions
  add column kind text not null default 'program' check (kind in ('program', 'flight')),
  add column flight_code text,
  add column departure_airport text,
  add column arrival_city text,
  add column departure_time text,
  add column arrival_time text,
  add column hide_speakers boolean not null default false;
