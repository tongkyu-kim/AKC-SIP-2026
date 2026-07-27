# ASEAN-Korea Workshop — Schedule Dashboard

Shared, editable schedule + speaker roster for the Oct 7–10 Gyeongju workshop, backed by Supabase.

## Features

- **Schedule board** — one column per day, sessions as rows, subsessions as itemized rows underneath.
  - Drag the grip handle to reorder sessions within a day, or subsessions within a session.
  - Subsessions always travel with their parent session (they're linked by `session_id`).
  - "Edit" on a session/subsession lets you move it to a different day/session via a dropdown.
  - Drag a speaker card from the roster onto a session row (for an overall chair/moderator) or onto a specific subsession/"program item" to assign them — or drag an already-assigned chip to move them between sessions/subsessions.
- **Speaker roster** — grouped by availability status: Backup → Shortlisted → Contacted → Ongoing → Confirmed.
  - Drag a speaker card between status groups to update availability.
  - Click a card (or a speaker chip on the schedule) to open their bio in a popup.
  - "+ Add speaker" to register a new potential speaker before assigning them.
- **Participant roster** — participants (speaker `category = 'participant'`) grouped by ASEAN country instead of status. Drag a card between countries to re-tag them, or onto the timetable (e.g. a flight row) to assign — same mechanic as the Speaker Roster, just grouped differently.
- **Flight matrix** — mark a subsession as Kind: Flight (in its edit dialog) to turn it into a flight row: flight code, departure airport, arrival city, departure/arrival time, and a persons list. Drag speakers or participants onto it to track who's on which plane. Used for Day 1 arrivals and a "Departure Flights" session on Day 4.
- Any program-item row can have "Hide the speakers column" checked (its edit dialog) when it doesn't need one — e.g. Day 4's two cultural tour options — freeing that width for the description instead.
- Drag an assigned chip back onto either roster to unassign them (in addition to updating status/country if it lands in a different group).
- **Comment log** — a free-text memo board next to the rosters, for teams to leave notes for each other. No login: you type a name/team once (remembered locally) and post.
- **Realtime sync** — every table is on Supabase Realtime, so edits from other members show up automatically (~250ms debounce).

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com) (or use an existing one).
2. Open **SQL Editor** and run, in order:
   - `supabase/migrations/0001_init.sql` — creates tables, enums, RLS policies, realtime publication.
   - `supabase/migrations/0002_speaker_category.sql` — adds the VIP/Speaker/Moderator category used for avatar colors.
   - `supabase/migrations/0003_participant_category.sql` — adds a fourth category, Participant (green).
   - `supabase/migrations/0004_comments.sql` — creates the comment log table.
   - `supabase/migrations/0005_session_speakers.sql` — lets a speaker be assigned directly to a session, not just a subsession.
   - `supabase/migrations/0006_participant_country.sql` — adds `country` to speakers, for the Participant Roster.
   - `supabase/migrations/0007_flight_rows.sql` — adds flight fields + `hide_speakers` to subsessions.
   - `supabase/seed/0002_seed.sql` — loads the Day 1–4 schedule and named speakers from the current timetable (fresh install only — see the warning in that file if you already have live data). On an existing database, run `supabase/seed/0006_update_day1_day4.sql` instead (non-destructive).
3. Grab your **Project URL** and **anon public key** from Project Settings → API.

> **Security note:** RLS policies currently allow anyone with the anon key to read/write. That's intentional for a link-shared internal planning tool with no login. If this needs to be locked down later (e.g. only logged-in organizers can edit), add Supabase Auth and tighten the policies in `0001_init.sql`.

> **Sharing a project with other apps:** every table/function/policy here is prefixed with `wkshp_` specifically so this can live in the same Supabase project as an unrelated app (e.g. another dashboard) without name collisions. If a `wkshp_*` name is somehow already taken, the migration will fail loudly on `create table` rather than touch existing data — safe to just rename the prefix and retry.

## 2. Configure the app

Copy `.env.local.example` to `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

## 3. Run it

```
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data model

- `days` → `sessions` (top-level schedule blocks, e.g. "Session 1: Cross-Border AI Governance") → `subsessions` (itemized agenda rows, e.g. "Presentation 1: ..."; `kind = 'flight'` turns one into a flight row with `flight_code`/`departure_airport`/`arrival_city`/`departure_time`/`arrival_time`).
- `speakers` — the roster, with `status` (backup/shortlisted/contacted/ongoing/confirmed), `category` (vip/speaker/moderator/participant — colors the avatar: rose/blue/purple/green), and `country` (ASEAN member, used to group participants).
- `subsession_speakers` — join table linking a speaker to *either* a session directly (`session_id`) *or* one of its subsessions (`subsession_id`) — exactly one of the two is set — with a `role` (Presenter/Moderator/Panelist/Speaker).
- `comments` — the comment log: free-text `author` + `message` + `created_at`, no auth.
