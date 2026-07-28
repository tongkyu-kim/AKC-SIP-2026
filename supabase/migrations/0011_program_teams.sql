alter table wkshp_sessions add column teams text[] not null default '{}';
alter table wkshp_subsessions add column teams text[] not null default '{}';
