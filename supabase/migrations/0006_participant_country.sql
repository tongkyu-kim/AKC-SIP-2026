-- Lets a speaker (typically category = 'participant') be tagged with their
-- ASEAN member country, for the country-grouped Participant Roster. Additive.

alter table wkshp_speakers add column country text;
