-- Seed data for the ASEAN-Korea Workshop, Oct 7-10, Gyeongju.
-- Run this AFTER supabase/migrations/0001_init.sql AND 0002_speaker_category.sql,
-- in the Supabase SQL Editor. Safe to re-run: it wipes and re-inserts the seeded
-- rows only (if you've already customized live data, re-running this WILL discard
-- those edits — use the non-destructive UPDATE-only scripts instead on an existing
-- database: 0003_update_speaker_categories.sql, 0004_update_speaker_bios.sql, and
-- 0005_update_day4.sql).

delete from wkshp_subsession_speakers;
delete from wkshp_subsessions;
delete from wkshp_sessions;
delete from wkshp_speakers;
delete from wkshp_days;

-- ---------- days ----------

insert into wkshp_days (id, event_date, label, subtitle, day_order, is_preworkshop) values
  ('00000000-0000-0000-0000-000000000000', null, 'Pre-Session', 'Preparatory workshops for ASEAN participants (exact dates within Aug.-Sept. TBD)', 0, true);

insert into wkshp_days (id, event_date, label, subtitle, day_order) values
  ('00000000-0000-0000-0000-000000000001', '2026-10-07', 'Day 1 — Wednesday', 'Arrival in Korea & Transfer to Gyeongju', 1),
  ('00000000-0000-0000-0000-000000000002', '2026-10-08', 'Day 2 — Thursday', 'Opening Ceremony, High-Level Session & Keynote', 2),
  ('00000000-0000-0000-0000-000000000003', '2026-10-09', 'Day 3 — Friday', 'Thematic Sessions (1 & 2), ASEAN-Korea Workshop', 3),
  ('00000000-0000-0000-0000-000000000004', '2026-10-10', 'Day 4 — Saturday', 'Optional Cultural Tour Program (Self-Funded)', 4);

-- ---------- speakers ----------

insert into wkshp_speakers (id, name, title_org, status, category, bio, notes) values
  ('00000000-0000-0000-0000-000100000001', 'Kim Jae-shin', 'Secretary-General, ASEAN-Korea Centre', 'shortlisted', 'vip',
   'Secretary-General of the ASEAN-Korea Centre since April 2024. A career Korean diplomat, he previously served as Ambassador to the Philippines (2015-2017) and to Germany (2012-2015), and held senior posts including Deputy Minister of Foreign Affairs and presidential secretary for foreign affairs.', null),
  ('00000000-0000-0000-0000-000100000002', 'António de Sá Benevides', 'Ambassador of Timor-Leste to the Republic of Korea; Chair of ASEAN Committee in Seoul', 'shortlisted', 'vip',
   'Ambassador of the Democratic Republic of Timor-Leste to the Republic of Korea (as of 2025), and Chair of the ASEAN Committee in Seoul, representing Timor-Leste''s diplomatic and economic relations with Korea. (Preliminary — verify current details before publishing.)', null),
  ('00000000-0000-0000-0000-000100000003', 'Tetsuya Watanabe', 'President, ERIA', 'shortlisted', 'vip',
   'President of the Economic Research Institute for ASEAN and East Asia (ERIA), elected for the 2023-2028 term. Formerly Special Advisor to Japan''s Minister of Economy, Trade and Industry (METI), with over 30 years in Japanese public service covering trade policy and the TPP/RCEP negotiations. Visiting Professor, University of Tokyo.', null),
  ('00000000-0000-0000-0000-000100000004', 'San Lwin', 'ASEAN ASCC Deputy Secretary-General', 'shortlisted', 'vip',
   'Deputy Secretary-General of ASEAN for the ASEAN Socio-Cultural Community (ASCC), serving a 2024-2027 term. A Myanmar national with over 40 years of diplomatic experience, including postings as Permanent Representative to the UN Office in Vienna and Deputy Permanent Representative to the UN in New York.', null),
  ('00000000-0000-0000-0000-000100000005', 'Sivaram Superamanian', 'Head, Digital Economy Division, ASEAN Secretariat', 'shortlisted', 'speaker',
   'Head of the Digital Economy Division at the ASEAN Secretariat, leading digital policy and economic integration initiatives across ASEAN member states. Previously Senior Vice President at PEMANDU Associates, and held roles at KPMG and PwC across Malaysia and the Middle East.', null),
  ('00000000-0000-0000-0000-000100000006', 'Lee Tae-Jun', 'Professor, KDI School of Public Policy and Management; Director, Open Government & Innovation (OGI) Lab', 'shortlisted', 'speaker',
   'Lee Tae-Jun (이태준) is a Professor at the KDI School of Public Policy and Management and Founder/Director of its Open Government & Innovation (OGI) Lab. His work focuses on AI-driven public governance and decision-making infrastructure, data- and platform-based recursive innovation ecosystems, and digital government innovation. He has contributed to 60+ policy research projects with the OECD, World Bank, UN, and EU, serves as an evaluator for the Prime Minister''s Office Committee on International Development Cooperation, and is a frequent media commentator on government digital policy. Previously an Assistant Professor at Bradley University (USA, 2010-2012) and Kookmin University (2012-2015).',
   'Ph.D.-conferring institution not publicly confirmed — recommend verifying directly with KDI School before publishing.'),
  ('00000000-0000-0000-0000-000100000007', 'Piti Srisangnam', 'Executive Director, ASEAN Foundation', 'shortlisted', 'moderator',
   'Executive Director of the ASEAN Foundation. Holds a PhD in Economics from the University of Melbourne and previously directed the ASEAN Studies Center at Chulalongkorn University, where he has taught International Economics since 2002.', null),
  ('00000000-0000-0000-0000-000100000008', 'Prof. Araz Taeihagh', 'Dean''s Chair & Associate Professor, Lee Kuan Yew School of Public Policy, NUS', 'shortlisted', 'speaker',
   'Dean''s Chair and Associate Professor of Public Policy at the Lee Kuan Yew School of Public Policy, NUS, and Principal Investigator at the Centre for Trusted Internet and Community. Research focuses on AI governance and technology policy; ranked in the top 2% of cited scientists worldwide.', null),
  ('00000000-0000-0000-0000-000100000009', 'Prof. Park Kyung-Ryul', 'Associate Professor, KAIST Graduate School of Science and Technology Policy', 'shortlisted', 'speaker',
   'Associate Professor at KAIST''s Graduate School of Science and Technology Policy and Director of the Center for Global Development and Strategy. PhD from LSE and MPP from Harvard Kennedy School; research focuses on technology governance and data-driven policy.', null),
  ('00000000-0000-0000-0000-00010000000a', '박구룡', '삼성전자 B2B통합오퍼링센터 글로벌 사업개발 그룹장', 'shortlisted', 'speaker',
   'Leads global business development for Samsung Electronics'' B2B Integrated Offering Center. (Bio derived from provided title only — not independently verified.)', null),
  ('00000000-0000-0000-0000-00010000000b', '이경희', '아마존 웹서비스 이사', 'shortlisted', 'speaker',
   'Director at Amazon Web Services (AWS). (Bio derived from provided title only — not independently verified.)', null),
  ('00000000-0000-0000-0000-00010000000c', 'Andrew Chan', 'Partner & Asia Pacific Sustainability Leader, PwC Malaysia', 'shortlisted', 'moderator',
   'Partner and Asia Pacific Sustainability Leader at PwC Malaysia, also serving as Chief Digital Officer for PwC Malaysia & Vietnam. Former CEO of PwC Southeast Asia Consulting, with expertise in sustainability, climate change, and digital transformation.', null);

-- ---------- Day 1 ----------

insert into wkshp_sessions (id, day_id, title, description, display_time, session_type, order_index) values
  ('00000000-0000-0000-0000-000200000001', '00000000-0000-0000-0000-000000000001',
   'Arrival in Korea & Transfer to Gyeongju',
   E'Add each incoming flight below (+ Item -> Kind: Flight). Drag participants or speakers from the rosters onto a flight row to track who''s on which plane.\n\nTransfer to Gyeongju and registration follow arrivals.',
   'All Day', 'logistics', 1);

-- One arrival flight per ASEAN member's capital-city airport. Flight code and
-- times are left blank on purpose (not known yet) — fill in via Edit once
-- flights are booked. Myanmar routes via Yangon (RGN), the practical
-- international gateway, rather than the capital Naypyidaw.
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

-- ---------- Day 2 ----------

insert into wkshp_sessions (id, day_id, title, description, start_time, end_time, session_type, order_index) values
  ('00000000-0000-0000-0000-000200000002', '00000000-0000-0000-0000-000000000002',
   'Opening Ceremony & High-Level Session (Tentative)',
   'Format and theme to be determined by KOFICE',
   '14:00', '16:00', 'ceremony', 1),
  ('00000000-0000-0000-0000-000200000003', '00000000-0000-0000-0000-000000000002',
   'Opening Ceremony Program',
   null,
   '16:30', '18:00', 'ceremony', 2),
  ('00000000-0000-0000-0000-000200000004', '00000000-0000-0000-0000-000000000002',
   'Break',
   null,
   '17:00', '18:00', 'break', 3),
  ('00000000-0000-0000-0000-000200000005', '00000000-0000-0000-0000-000000000002',
   'Official Dinner',
   'Hosted by Ministry of Culture, Sports, and Tourism',
   '18:00', '20:00', 'meal', 4);

insert into wkshp_subsessions (id, session_id, title, time_range, order_index) values
  ('00000000-0000-0000-0000-000300000001', '00000000-0000-0000-0000-000200000003', 'Opening Remarks', '16:30-16:35', 1),
  ('00000000-0000-0000-0000-000300000002', '00000000-0000-0000-0000-000200000003', 'Congratulatory Remarks', '16:35-16:40', 2),
  ('00000000-0000-0000-0000-000300000003', '00000000-0000-0000-0000-000200000003', 'Photo Session', '16:40-16:50', 3),
  ('00000000-0000-0000-0000-000300000004', '00000000-0000-0000-0000-000200000003', '[Keynote] Sustainable Development Through Culture and Creativity', '16:50-17:10', 4),
  ('00000000-0000-0000-0000-000300000005', '00000000-0000-0000-0000-000200000003', 'Networking', '16:50-17:00', 5);

insert into wkshp_subsession_speakers (subsession_id, speaker_id, role, order_index) values
  ('00000000-0000-0000-0000-000300000001', '00000000-0000-0000-0000-000100000001', 'Speaker', 1),
  ('00000000-0000-0000-0000-000300000002', '00000000-0000-0000-0000-000100000002', 'Speaker', 1),
  ('00000000-0000-0000-0000-000300000004', '00000000-0000-0000-0000-000100000003', 'Speaker', 1),
  ('00000000-0000-0000-0000-000300000004', '00000000-0000-0000-0000-000100000004', 'Speaker', 2);

-- ---------- Day 3 ----------

insert into wkshp_sessions (id, day_id, title, description, start_time, end_time, session_type, order_index) values
  ('00000000-0000-0000-0000-000200000006', '00000000-0000-0000-0000-000000000003',
   '(Session 1) Cross-Border AI Governance', null, '09:00', '10:40', 'session', 1),
  ('00000000-0000-0000-0000-000200000007', '00000000-0000-0000-0000-000000000003',
   'Break', null, '10:40', '10:50', 'break', 2),
  ('00000000-0000-0000-0000-000200000008', '00000000-0000-0000-0000-000000000003',
   '(Session 2) Digital Infrastructure & AI Ecosystems', null, '10:50', '12:30', 'session', 3),
  ('00000000-0000-0000-0000-000200000009', '00000000-0000-0000-0000-000000000003',
   'Lunch', null, '12:30', '14:00', 'meal', 4),
  ('00000000-0000-0000-0000-00020000000a', '00000000-0000-0000-0000-000000000003',
   '(Workshop) ASEAN Member Country Presentations & Action Plan',
   E'Internal session (detailed proceedings TBD with KMAC)\n① Country / sector AI policy and digital transformation status presentations\n② Identification of regional cooperation needs and key chokepoints\n③ ASEAN-Korea cooperation tasks and action plan development\n④ Deriving actionable points for ASEAN-Korea AI cooperation',
   '14:00', '18:00', 'workshop', 5);

insert into wkshp_subsessions (id, session_id, title, time_range, order_index) values
  ('00000000-0000-0000-0000-000300000006', '00000000-0000-0000-0000-000200000006', 'Presentation 1: AI Governance Across Borders', '09:00-09:20', 1),
  ('00000000-0000-0000-0000-000300000007', '00000000-0000-0000-0000-000200000006', E'Presentation 2: Korea’s AI Policy & Digital Government', '09:20-09:40', 2),
  ('00000000-0000-0000-0000-000300000008', '00000000-0000-0000-0000-000200000006', E'Presentation 3: Korea’s AI Policy & Digital Government (Speaker TBD)', '09:40-10:00', 3),
  ('00000000-0000-0000-0000-000300000009', '00000000-0000-0000-0000-000200000006', 'Panel Discussion', '10:00-10:40', 4),
  ('00000000-0000-0000-0000-00030000000a', '00000000-0000-0000-0000-000200000008', 'Presentation 1: Building AI-Ready Infrastructure', '10:50-11:10', 1),
  ('00000000-0000-0000-0000-00030000000b', '00000000-0000-0000-0000-000200000008', E'Presentation 2: Korea’s Digital Infrastructure & AI Ecosystem', '11:10-11:30', 2),
  ('00000000-0000-0000-0000-00030000000c', '00000000-0000-0000-0000-000200000008', 'Presentation 3: Korean Private Sector', '11:30-11:50', 3),
  ('00000000-0000-0000-0000-00030000000d', '00000000-0000-0000-0000-000200000008', 'Panel Discussion', '11:50-12:30', 4);

insert into wkshp_subsession_speakers (subsession_id, speaker_id, role, order_index) values
  ('00000000-0000-0000-0000-000300000006', '00000000-0000-0000-0000-000100000005', 'Presenter', 1),
  ('00000000-0000-0000-0000-000300000007', '00000000-0000-0000-0000-000100000006', 'Presenter', 1),
  ('00000000-0000-0000-0000-000300000009', '00000000-0000-0000-0000-000100000007', 'Moderator', 1),
  ('00000000-0000-0000-0000-00030000000a', '00000000-0000-0000-0000-000100000008', 'Presenter', 1),
  ('00000000-0000-0000-0000-00030000000b', '00000000-0000-0000-0000-000100000009', 'Presenter', 1),
  ('00000000-0000-0000-0000-00030000000c', '00000000-0000-0000-0000-00010000000a', 'Presenter', 1),
  ('00000000-0000-0000-0000-00030000000c', '00000000-0000-0000-0000-00010000000b', 'Presenter', 2),
  ('00000000-0000-0000-0000-00030000000d', '00000000-0000-0000-0000-00010000000c', 'Moderator', 1);

-- ---------- Day 4 ----------

insert into wkshp_sessions (id, day_id, title, description, display_time, session_type, order_index) values
  ('00000000-0000-0000-0000-00020000000b', '00000000-0000-0000-0000-000000000004',
   'Optional Cultural Tour Program (Self-Funded)',
   E'Date/Time: Saturday, 10 October 2026 (Morning)\nEligible Participants: Participants from the interactive program who wish to join a small-group cultural tour (self-funded)\nProgram: Optional cultural tour (see options below)\n\nConfirmation Requested\n• Please confirm whether your organization would like to participate and indicate your preferred tour option.\n• The proposed itineraries may be modified or combined based on participants’ preferences (e.g., adding Bulguksa Temple and Seokguram Grotto to Option B).\n• The final quotation will be recalculated once the number of participants is confirmed. Participating organizations will then contract directly with the travel agency.',
   'Morning', 'session', 1);

insert into wkshp_subsessions (id, session_id, title, time_range, description, hide_speakers, order_index) values
  ('00000000-0000-0000-0000-00030000000e', '00000000-0000-0000-0000-00020000000b',
   'Option A -- Daereungwon, Hwangridan-gil & Bulguksa Temple (approx. KRW 76,000/person)',
   '09:00-14:30',
   E'Accompanied by event staff and a professional tour interpreter.\n09:00-09:20 Hotel pick-up\n09:20-09:40 Bus transfer\n09:40-10:40 Tour of Daereungwon Tomb Complex\n10:40-11:40 Walk through Hwangridan-gil\n11:40-12:40 Lunch (restaurant in Hwangridan-gil)\n12:40-14:00 Tour of Bulguksa Temple\n14:00-14:30 Bus transfer (drop-off at hotel or Gyeongju Station)\nTotal duration: approximately 5 hours 30 minutes',
   true, 1),
  ('00000000-0000-0000-0000-00030000000f', '00000000-0000-0000-0000-00020000000b',
   'Option B -- Choi Clan House & Gyochon Village (approx. KRW 60,000/person)',
   '09:10-12:50',
   E'Accompanied by event staff and a professional tour interpreter.\n09:10-09:30 Hotel pick-up\n09:30-10:00 Bus transfer\n10:00-11:00 Tour of Choi Clan House (Gyo-dong Choi House)\n11:00-11:40 Tour of Gyochon Traditional Village\n11:40-12:20 Lunch (traditional Korean set menu near Gyochon Village)\n12:20-12:50 Bus transfer (drop-off at hotel or Gyeongju Station)\nTotal duration: approximately 3 hours 40 minutes',
   true, 2);

insert into wkshp_sessions (id, day_id, title, description, display_time, session_type, order_index) values
  ('00000000-0000-0000-0000-00020000000c', '00000000-0000-0000-0000-000000000004',
   'Departure Flights',
   'Add each departing flight below (+ Item -> Kind: Flight). Drag participants or speakers onto a flight row to track who''s on which plane.',
   'Afternoon', 'logistics', 2);

-- One departure flight per ASEAN member's capital-city airport (mirrors the
-- Day 1 arrivals). Flight code and times left blank on purpose.
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
