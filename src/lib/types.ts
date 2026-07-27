export type SpeakerStatus =
  | "backup"
  | "shortlisted"
  | "contacted"
  | "ongoing"
  | "confirmed";

export const SPEAKER_STATUSES: SpeakerStatus[] = [
  "backup",
  "shortlisted",
  "contacted",
  "ongoing",
  "confirmed",
];

export const STATUS_LABEL: Record<SpeakerStatus, string> = {
  backup: "Backup",
  shortlisted: "Shortlisted",
  contacted: "Contacted",
  ongoing: "Ongoing",
  confirmed: "Confirmed",
};

// Participants use the same underlying status values/colors as speakers (so
// no schema change is needed), but with their own 3-stage vocabulary and
// labels: TBD (shortlisted, yellow) -> Confirmed (contacted, blue) ->
// Prepared (confirmed, green). Backup/Ongoing aren't offered to participants.
export const PARTICIPANT_STATUSES: SpeakerStatus[] = ["shortlisted", "contacted", "confirmed"];

export const PARTICIPANT_STATUS_LABEL: Record<SpeakerStatus, string> = {
  backup: "Backup",
  shortlisted: "TBD",
  contacted: "Confirmed",
  ongoing: "Ongoing",
  confirmed: "Prepared",
};

export function statusLabel(status: SpeakerStatus, category: SpeakerCategory): string {
  return category === "participant" ? PARTICIPANT_STATUS_LABEL[status] : STATUS_LABEL[status];
}

// Tailwind class pairs (bg/text/ring) per status, chosen for light+dark readability.
export const STATUS_STYLE: Record<SpeakerStatus, string> = {
  backup: "bg-slate-100 text-slate-600 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600",
  shortlisted: "bg-yellow-100 text-yellow-700 ring-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:ring-yellow-700",
  contacted: "bg-blue-100 text-blue-700 ring-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-700",
  ongoing: "bg-violet-100 text-violet-700 ring-violet-300 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-700",
  confirmed: "bg-emerald-100 text-emerald-700 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-700",
};

// Solid color used for avatar rings/dots per status.
export const STATUS_DOT: Record<SpeakerStatus, string> = {
  backup: "bg-slate-400",
  shortlisted: "bg-yellow-500",
  contacted: "bg-blue-500",
  ongoing: "bg-violet-500",
  confirmed: "bg-emerald-500",
};

// Same palette as a left-border accent (kept as literal classes so Tailwind's scanner picks them up).
export const STATUS_BORDER: Record<SpeakerStatus, string> = {
  backup: "border-slate-400",
  shortlisted: "border-yellow-500",
  contacted: "border-blue-500",
  ongoing: "border-violet-500",
  confirmed: "border-emerald-500",
};

// A speaker's standing designation — independent of their per-session role text
// (Presenter/Moderator/Panelist/...) and of their booking status. Drives avatar color.
export type SpeakerCategory = "vip" | "speaker" | "moderator" | "participant";

export const SPEAKER_CATEGORIES: SpeakerCategory[] = ["vip", "speaker", "moderator", "participant"];

export const CATEGORY_LABEL: Record<SpeakerCategory, string> = {
  vip: "VIP",
  speaker: "Speaker",
  moderator: "Moderator",
  participant: "Participant",
};

// Solid fill color for the avatar per category.
export const CATEGORY_COLOR: Record<SpeakerCategory, string> = {
  vip: "bg-rose-500",
  speaker: "bg-blue-500",
  moderator: "bg-purple-500",
  participant: "bg-green-500",
};

export type SessionType = "session" | "break" | "meal" | "ceremony" | "workshop" | "logistics";

export const SESSION_TYPE_LABEL: Record<SessionType, string> = {
  session: "Session",
  break: "Break",
  meal: "Meal",
  ceremony: "Ceremony",
  workshop: "Workshop",
  logistics: "Logistics",
};

// Per-type color language for the agenda table: a left-border accent, a small
// type badge, and the time-pill color.
export const SESSION_TYPE_BORDER: Record<SessionType, string> = {
  session: "border-l-sky-500",
  break: "border-l-zinc-300 dark:border-l-zinc-600",
  meal: "border-l-orange-400",
  ceremony: "border-l-purple-500",
  workshop: "border-l-teal-500",
  logistics: "border-l-indigo-500",
};

export const SESSION_TYPE_META: Record<SessionType, { badge: string; time: string }> = {
  session: {
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
    time: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  },
  break: {
    badge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
    time: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  },
  meal: {
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    time: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  },
  ceremony: {
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    time: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  },
  workshop: {
    badge: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
    time: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  },
  logistics: {
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
    time: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  },
};

export interface Day {
  id: string;
  event_date: string | null;
  label: string;
  subtitle: string | null;
  day_order: number;
  is_preworkshop: boolean;
}

// ASEAN's 11 member states, in official display order.
export const ASEAN_COUNTRIES: string[] = [
  "Brunei",
  "Cambodia",
  "Indonesia",
  "Laos",
  "Malaysia",
  "Myanmar",
  "Philippines",
  "Singapore",
  "Thailand",
  "Timor-Leste",
  "Vietnam",
];

export interface Speaker {
  id: string;
  name: string;
  title_org: string | null;
  bio: string | null;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  status: SpeakerStatus;
  category: SpeakerCategory;
  country: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  day_id: string;
  title: string;
  description: string | null;
  // Only meaningful for sessions whose parent day has no fixed date yet
  // (e.g. the Pre-Session day) — lets each session carry its own date.
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  display_time: string | null;
  session_type: SessionType;
  order_index: number;
}

export type SubsessionKind = "program" | "flight";

export interface Subsession {
  id: string;
  session_id: string;
  title: string;
  time_range: string | null;
  description: string | null;
  order_index: number;
  kind: SubsessionKind;
  // Only meaningful when kind === "flight":
  flight_code: string | null;
  departure_airport: string | null;
  arrival_city: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  // When true, this row never shows a speakers/persons column — its
  // description gets that width instead (e.g. a plain itinerary item).
  hide_speakers: boolean;
}

export type SpeakerRole = "Presenter" | "Moderator" | "Panelist" | "Speaker";

// A speaker linked either to a session directly (e.g. an overall chair) or to
// one of its subsessions ("program items") — exactly one of the two ids is set.
export interface SpeakerAssignment {
  id: string;
  session_id: string | null;
  subsession_id: string | null;
  speaker_id: string;
  role: string;
  order_index: number;
}

// ---- hydrated view models used by the UI ----

export interface SubsessionWithSpeakers extends Subsession {
  speakers: (SpeakerAssignment & { speaker: Speaker })[];
}

export interface SessionWithChildren extends Session {
  speakers: (SpeakerAssignment & { speaker: Speaker })[];
  subsessions: SubsessionWithSpeakers[];
}

export interface DayWithSessions extends Day {
  sessions: SessionWithChildren[];
}

export interface Comment {
  id: string;
  author: string;
  message: string;
  created_at: string;
}
