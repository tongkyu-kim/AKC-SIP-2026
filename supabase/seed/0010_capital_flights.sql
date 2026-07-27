-- Adds one arrival flight row (Day 1) and one departure flight row (Day 4)
-- per ASEAN member country, seeded with the country's capital-city airport
-- (real, public info) as departure_airport/arrival_city. Flight code and
-- times are intentionally left blank — those aren't known yet and shouldn't
-- be guessed; fill them in via each row's Edit dialog once flights are
-- booked. Non-destructive: plain INSERTs, safe to run once.
--
-- Note: Myanmar's seat of government is Naypyidaw, but its airport has very
-- limited international service — Yangon (RGN) is used here as the realistic
-- gateway. Swap it if your delegation is routing through Naypyidaw instead.

insert into wkshp_subsessions (id, session_id, title, kind, departure_airport, arrival_city, order_index) values
  ('00000000-0000-0000-0000-000300000010', '00000000-0000-0000-0000-000200000001', 'Brunei Delegation', 'flight', 'Bandar Seri Begawan (BWN)', 'Incheon (ICN)', 1),
  ('00000000-0000-0000-0000-000300000011', '00000000-0000-0000-0000-000200000001', 'Cambodia Delegation', 'flight', 'Phnom Penh (PNH)', 'Incheon (ICN)', 2),
  ('00000000-0000-0000-0000-000300000012', '00000000-0000-0000-0000-000200000001', 'Indonesia Delegation', 'flight', 'Jakarta (CGK)', 'Incheon (ICN)', 3),
  ('00000000-0000-0000-0000-000300000013', '00000000-0000-0000-0000-000200000001', 'Laos Delegation', 'flight', 'Vientiane (VTE)', 'Incheon (ICN)', 4),
  ('00000000-0000-0000-0000-000300000014', '00000000-0000-0000-0000-000200000001', 'Malaysia Delegation', 'flight', 'Kuala Lumpur (KUL)', 'Incheon (ICN)', 5),
  ('00000000-0000-0000-0000-000300000015', '00000000-0000-0000-0000-000200000001', 'Myanmar Delegation', 'flight', 'Yangon (RGN)', 'Incheon (ICN)', 6),
  ('00000000-0000-0000-0000-000300000016', '00000000-0000-0000-0000-000200000001', 'Philippines Delegation', 'flight', 'Manila (MNL)', 'Incheon (ICN)', 7),
  ('00000000-0000-0000-0000-000300000017', '00000000-0000-0000-0000-000200000001', 'Singapore Delegation', 'flight', 'Singapore (SIN)', 'Incheon (ICN)', 8),
  ('00000000-0000-0000-0000-000300000018', '00000000-0000-0000-0000-000200000001', 'Thailand Delegation', 'flight', 'Bangkok (BKK)', 'Incheon (ICN)', 9),
  ('00000000-0000-0000-0000-000300000019', '00000000-0000-0000-0000-000200000001', 'Timor-Leste Delegation', 'flight', 'Dili (DIL)', 'Incheon (ICN)', 10),
  ('00000000-0000-0000-0000-00030000001a', '00000000-0000-0000-0000-000200000001', 'Vietnam Delegation', 'flight', 'Hanoi (HAN)', 'Incheon (ICN)', 11);

insert into wkshp_subsessions (id, session_id, title, kind, departure_airport, arrival_city, order_index) values
  ('00000000-0000-0000-0000-00030000001b', '00000000-0000-0000-0000-00020000000c', 'Brunei Delegation', 'flight', 'Incheon (ICN)', 'Bandar Seri Begawan (BWN)', 1),
  ('00000000-0000-0000-0000-00030000001c', '00000000-0000-0000-0000-00020000000c', 'Cambodia Delegation', 'flight', 'Incheon (ICN)', 'Phnom Penh (PNH)', 2),
  ('00000000-0000-0000-0000-00030000001d', '00000000-0000-0000-0000-00020000000c', 'Indonesia Delegation', 'flight', 'Incheon (ICN)', 'Jakarta (CGK)', 3),
  ('00000000-0000-0000-0000-00030000001e', '00000000-0000-0000-0000-00020000000c', 'Laos Delegation', 'flight', 'Incheon (ICN)', 'Vientiane (VTE)', 4),
  ('00000000-0000-0000-0000-00030000001f', '00000000-0000-0000-0000-00020000000c', 'Malaysia Delegation', 'flight', 'Incheon (ICN)', 'Kuala Lumpur (KUL)', 5),
  ('00000000-0000-0000-0000-000300000020', '00000000-0000-0000-0000-00020000000c', 'Myanmar Delegation', 'flight', 'Incheon (ICN)', 'Yangon (RGN)', 6),
  ('00000000-0000-0000-0000-000300000021', '00000000-0000-0000-0000-00020000000c', 'Philippines Delegation', 'flight', 'Incheon (ICN)', 'Manila (MNL)', 7),
  ('00000000-0000-0000-0000-000300000022', '00000000-0000-0000-0000-00020000000c', 'Singapore Delegation', 'flight', 'Incheon (ICN)', 'Singapore (SIN)', 8),
  ('00000000-0000-0000-0000-000300000023', '00000000-0000-0000-0000-00020000000c', 'Thailand Delegation', 'flight', 'Incheon (ICN)', 'Bangkok (BKK)', 9),
  ('00000000-0000-0000-0000-000300000024', '00000000-0000-0000-0000-00020000000c', 'Timor-Leste Delegation', 'flight', 'Incheon (ICN)', 'Dili (DIL)', 10),
  ('00000000-0000-0000-0000-000300000025', '00000000-0000-0000-0000-00020000000c', 'Vietnam Delegation', 'flight', 'Incheon (ICN)', 'Hanoi (HAN)', 11);
