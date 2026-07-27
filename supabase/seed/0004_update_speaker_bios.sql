-- Replaces the two placeholder "name" fields that actually held a title
-- (Secretary-General / Ambassador) with the real officeholders' names, moves
-- those titles into title_org + bio, and adds short preliminary bios (from a
-- web search — verify before publishing) for the rest of the seeded roster.
-- Non-destructive: matches by the fixed id from 0002_seed.sql, UPDATE only.

update wkshp_speakers set
  name = 'Kim Jae-shin',
  title_org = 'Secretary-General, ASEAN-Korea Centre',
  bio = 'Secretary-General of the ASEAN-Korea Centre since April 2024. A career Korean diplomat, he previously served as Ambassador to the Philippines (2015-2017) and to Germany (2012-2015), and held senior posts including Deputy Minister of Foreign Affairs and presidential secretary for foreign affairs.'
where id = '00000000-0000-0000-0000-000100000001';

update wkshp_speakers set
  name = 'António de Sá Benevides',
  title_org = 'Ambassador of Timor-Leste to the Republic of Korea; Chair of ASEAN Committee in Seoul',
  bio = 'Ambassador of the Democratic Republic of Timor-Leste to the Republic of Korea (as of 2025), and Chair of the ASEAN Committee in Seoul, representing Timor-Leste''s diplomatic and economic relations with Korea. (Preliminary — verify current details before publishing.)'
where id = '00000000-0000-0000-0000-000100000002';

update wkshp_speakers set
  bio = 'President of the Economic Research Institute for ASEAN and East Asia (ERIA), elected for the 2023-2028 term. Formerly Special Advisor to Japan''s Minister of Economy, Trade and Industry (METI), with over 30 years in Japanese public service covering trade policy and the TPP/RCEP negotiations. Visiting Professor, University of Tokyo.'
where id = '00000000-0000-0000-0000-000100000003';

update wkshp_speakers set
  bio = 'Deputy Secretary-General of ASEAN for the ASEAN Socio-Cultural Community (ASCC), serving a 2024-2027 term. A Myanmar national with over 40 years of diplomatic experience, including postings as Permanent Representative to the UN Office in Vienna and Deputy Permanent Representative to the UN in New York.'
where id = '00000000-0000-0000-0000-000100000004';

update wkshp_speakers set
  title_org = 'Head, Digital Economy Division, ASEAN Secretariat',
  bio = 'Head of the Digital Economy Division at the ASEAN Secretariat, leading digital policy and economic integration initiatives across ASEAN member states. Previously Senior Vice President at PEMANDU Associates, and held roles at KPMG and PwC across Malaysia and the Middle East.'
where id = '00000000-0000-0000-0000-000100000005';

update wkshp_speakers set
  name = 'Lee Tae-Jun',
  title_org = 'Professor, KDI School of Public Policy and Management; Director, Open Government & Innovation (OGI) Lab',
  bio = 'Lee Tae-Jun (이태준) is a Professor at the KDI School of Public Policy and Management and Founder/Director of its Open Government & Innovation (OGI) Lab. His work focuses on AI-driven public governance and decision-making infrastructure, data- and platform-based recursive innovation ecosystems, and digital government innovation. He has contributed to 60+ policy research projects with the OECD, World Bank, UN, and EU, serves as an evaluator for the Prime Minister''s Office Committee on International Development Cooperation, and is a frequent media commentator on government digital policy. Previously an Assistant Professor at Bradley University (USA, 2010-2012) and Kookmin University (2012-2015).',
  notes = 'Ph.D.-conferring institution not publicly confirmed — recommend verifying directly with KDI School before publishing.'
where id = '00000000-0000-0000-0000-000100000006';

update wkshp_speakers set
  bio = 'Executive Director of the ASEAN Foundation. Holds a PhD in Economics from the University of Melbourne and previously directed the ASEAN Studies Center at Chulalongkorn University, where he has taught International Economics since 2002.'
where id = '00000000-0000-0000-0000-000100000007';

update wkshp_speakers set
  title_org = 'Dean''s Chair & Associate Professor, Lee Kuan Yew School of Public Policy, NUS',
  bio = 'Dean''s Chair and Associate Professor of Public Policy at the Lee Kuan Yew School of Public Policy, NUS, and Principal Investigator at the Centre for Trusted Internet and Community. Research focuses on AI governance and technology policy; ranked in the top 2% of cited scientists worldwide.'
where id = '00000000-0000-0000-0000-000100000008';

update wkshp_speakers set
  title_org = 'Associate Professor, KAIST Graduate School of Science and Technology Policy',
  bio = 'Associate Professor at KAIST''s Graduate School of Science and Technology Policy and Director of the Center for Global Development and Strategy. PhD from LSE and MPP from Harvard Kennedy School; research focuses on technology governance and data-driven policy.'
where id = '00000000-0000-0000-0000-000100000009';

update wkshp_speakers set
  bio = 'Leads global business development for Samsung Electronics'' B2B Integrated Offering Center. (Bio derived from provided title only — not independently verified.)'
where id = '00000000-0000-0000-0000-00010000000a';

update wkshp_speakers set
  bio = 'Director at Amazon Web Services (AWS). (Bio derived from provided title only — not independently verified.)'
where id = '00000000-0000-0000-0000-00010000000b';

update wkshp_speakers set
  title_org = 'Partner & Asia Pacific Sustainability Leader, PwC Malaysia',
  bio = 'Partner and Asia Pacific Sustainability Leader at PwC Malaysia, also serving as Chief Digital Officer for PwC Malaysia & Vietnam. Former CEO of PwC Southeast Asia Consulting, with expertise in sustainability, climate change, and digital transformation.'
where id = '00000000-0000-0000-0000-00010000000c';
