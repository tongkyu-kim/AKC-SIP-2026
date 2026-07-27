-- Lets a speaker be assigned directly to a session (e.g. an overall session
-- chair/moderator), not just to one of its subsessions/"program items".
-- Additive/non-destructive: subsession_id becomes nullable, a new nullable
-- session_id is added, and a check constraint requires exactly one of the two
-- to be set. Existing rows (all subsession-only) already satisfy that.

alter table wkshp_subsession_speakers
  add column session_id uuid references wkshp_sessions(id) on delete cascade,
  alter column subsession_id drop not null;

alter table wkshp_subsession_speakers
  add constraint wkshp_subsession_speakers_target_check check (
    (session_id is not null and subsession_id is null) or
    (session_id is null and subsession_id is not null)
  );

create index wkshp_subsession_speakers_session_id_idx on wkshp_subsession_speakers(session_id);
