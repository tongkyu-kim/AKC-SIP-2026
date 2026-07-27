-- Replaces Day 4's content with the Optional Cultural Tour Program details.
-- Non-destructive to other days: updates the existing Day 4 session in place
-- and replaces its subsessions with the two tour options (A and B).

update wkshp_days set
  subtitle = 'Optional Cultural Tour Program (Self-Funded)'
where id = '00000000-0000-0000-0000-000000000004';

update wkshp_sessions set
  title = 'Optional Cultural Tour Program (Self-Funded)',
  description = E'Date/Time: Saturday, 10 October 2026 (Morning)\nEligible Participants: Participants from the interactive program who wish to join a small-group cultural tour (self-funded)\nProgram: Optional cultural tour (see options below)\n\nConfirmation Requested\n• Please confirm whether your organization would like to participate and indicate your preferred tour option.\n• The proposed itineraries may be modified or combined based on participants'' preferences (e.g., adding Bulguksa Temple and Seokguram Grotto to Option B).\n• The final quotation will be recalculated once the number of participants is confirmed. Participating organizations will then contract directly with the travel agency.',
  display_time = 'Morning',
  start_time = null,
  end_time = null,
  session_type = 'session'
where id = '00000000-0000-0000-0000-00020000000b';

delete from wkshp_subsessions where session_id = '00000000-0000-0000-0000-00020000000b';

insert into wkshp_subsessions (id, session_id, title, time_range, description, order_index) values
  ('00000000-0000-0000-0000-00030000000e', '00000000-0000-0000-0000-00020000000b',
   'Option A -- Daereungwon, Hwangridan-gil & Bulguksa Temple (approx. KRW 76,000/person)',
   '09:00-14:30',
   E'Accompanied by event staff and a professional tour interpreter.\n09:00-09:20 Hotel pick-up\n09:20-09:40 Bus transfer\n09:40-10:40 Tour of Daereungwon Tomb Complex\n10:40-11:40 Walk through Hwangridan-gil\n11:40-12:40 Lunch (restaurant in Hwangridan-gil)\n12:40-14:00 Tour of Bulguksa Temple\n14:00-14:30 Bus transfer (drop-off at hotel or Gyeongju Station)\nTotal duration: approximately 5 hours 30 minutes',
   1),
  ('00000000-0000-0000-0000-00030000000f', '00000000-0000-0000-0000-00020000000b',
   'Option B -- Choi Clan House & Gyochon Village (approx. KRW 60,000/person)',
   '09:10-12:50',
   E'Accompanied by event staff and a professional tour interpreter.\n09:10-09:30 Hotel pick-up\n09:30-10:00 Bus transfer\n10:00-11:00 Tour of Choi Clan House (Gyo-dong Choi House)\n11:00-11:40 Tour of Gyochon Traditional Village\n11:40-12:20 Lunch (traditional Korean set menu near Gyochon Village)\n12:20-12:50 Bus transfer (drop-off at hotel or Gyeongju Station)\nTotal duration: approximately 3 hours 40 minutes',
   2);
