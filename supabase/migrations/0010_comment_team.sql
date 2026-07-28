-- Splits the Comment Log into 4 team columns (AKC / KMAC / WEtheTEAM /
-- Others) instead of one flat feed. Nullable + no default: existing
-- comments and any future row that doesn't set a team just render under
-- "Others" client-side (see COMMENT_TEAMS in src/lib/types.ts) rather than
-- needing a migration to backfill a value.

alter table wkshp_comments add column team text;
