-- Optional: sets sensible categories on the speakers already seeded from the
-- timetable, based on their actual role in the program (dignitaries/keynote
-- speakers = VIP, panel moderators = Moderator, everyone else = Speaker).
-- Non-destructive: only UPDATEs matching rows by name, no deletes/inserts.
-- Safe to skip if you'd rather set categories by hand in the UI.

update wkshp_speakers set category = 'vip' where name in (
  'Secretary General, ASEAN-Korea Centre',
  'Timor-Leste Ambassador to Rep. of Korea',
  'Tetsuya Watanabe',
  'San Lwin'
);

update wkshp_speakers set category = 'moderator' where name in (
  'Piti Srisangnam',
  'Andrew Chan'
);

update wkshp_speakers set category = 'speaker' where name in (
  'Sivaram Superamanian',
  'Taejun Lee',
  'Prof. Araz Taeihagh',
  'Prof. Park Kyung-Ryul',
  '박구룡',
  '이경희'
);
