-- Reclassifies the two flight-matrix container sessions (Day 1 arrivals, Day 4
-- departures) as session_type = 'logistics', so they pick up the Logistics
-- color and default-collapse behavior. Non-destructive, plain UPDATEs.

update wkshp_sessions set session_type = 'logistics'
where id in (
  '00000000-0000-0000-0000-000200000001', -- Day 1: Arrival in Korea & Transfer to Gyeongju
  '00000000-0000-0000-0000-00020000000c'  -- Day 4: Departure Flights
);
