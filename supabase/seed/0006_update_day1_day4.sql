-- Restructures Day 1 and Day 4 around the new flight-row feature.
-- Non-destructive: UPDATEs existing rows by known id, and adds one new
-- (initially empty) session for Day 4's departure flights.

-- Day 1: give the arrival session flight-entry guidance. Add flight rows
-- yourself via "+ Item" -> Kind: Flight on this session.
update wkshp_sessions set
  description = E'Add each incoming flight below (+ Item -> Kind: Flight). Drag participants or speakers from the rosters onto a flight row to track who''s on which plane.\n\nTransfer to Gyeongju and registration follow arrivals.'
where id = '00000000-0000-0000-0000-000200000001';

-- Day 4: the two cultural tour options don't need a speakers column — free
-- that width for the itinerary text instead.
update wkshp_subsessions set hide_speakers = true
where id in ('00000000-0000-0000-0000-00030000000e', '00000000-0000-0000-0000-00030000000f');

-- Day 4: a second session for departure flights, mirroring Day 1's arrivals.
insert into wkshp_sessions (id, day_id, title, description, display_time, session_type, order_index) values
  ('00000000-0000-0000-0000-00020000000c', '00000000-0000-0000-0000-000000000004',
   'Departure Flights',
   'Add each departing flight below (+ Item -> Kind: Flight). Drag participants or speakers onto a flight row to track who''s on which plane.',
   'Afternoon', 'session', 2);
