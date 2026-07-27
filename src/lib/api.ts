import { supabase } from "@/lib/supabase/client";
import type {
  Comment,
  Day,
  DayWithSessions,
  Session,
  SessionWithChildren,
  Speaker,
  SpeakerAssignment,
  SpeakerStatus,
  Subsession,
  SubsessionWithSpeakers,
} from "@/lib/types";

export async function fetchDashboard(): Promise<{
  days: DayWithSessions[];
  speakers: Speaker[];
}> {
  const [
    { data: days, error: daysErr },
    { data: sessions, error: sessionsErr },
    { data: subsessions, error: subErr },
    { data: links, error: linksErr },
    { data: speakers, error: speakersErr },
  ] = await Promise.all([
    supabase.from("wkshp_days").select("*").order("day_order"),
    supabase.from("wkshp_sessions").select("*").order("order_index"),
    supabase.from("wkshp_subsessions").select("*").order("order_index"),
    supabase.from("wkshp_subsession_speakers").select("*").order("order_index"),
    supabase.from("wkshp_speakers").select("*").order("name"),
  ]);

  const err = daysErr || sessionsErr || subErr || linksErr || speakersErr;
  if (err) throw err;

  const speakerById = new Map<string, Speaker>((speakers ?? []).map((s) => [s.id, s as Speaker]));

  const linksBySubsession = new Map<string, (SpeakerAssignment & { speaker: Speaker })[]>();
  const linksBySession = new Map<string, (SpeakerAssignment & { speaker: Speaker })[]>();
  for (const link of (links ?? []) as SpeakerAssignment[]) {
    const speaker = speakerById.get(link.speaker_id);
    if (!speaker) continue;
    if (link.subsession_id) {
      const list = linksBySubsession.get(link.subsession_id) ?? [];
      list.push({ ...link, speaker });
      linksBySubsession.set(link.subsession_id, list);
    } else if (link.session_id) {
      const list = linksBySession.get(link.session_id) ?? [];
      list.push({ ...link, speaker });
      linksBySession.set(link.session_id, list);
    }
  }

  const subsessionsBySession = new Map<string, SubsessionWithSpeakers[]>();
  for (const sub of (subsessions ?? []) as Subsession[]) {
    const list = subsessionsBySession.get(sub.session_id) ?? [];
    list.push({ ...sub, speakers: linksBySubsession.get(sub.id) ?? [] });
    subsessionsBySession.set(sub.session_id, list);
  }

  const sessionsByDay = new Map<string, SessionWithChildren[]>();
  for (const session of (sessions ?? []) as Session[]) {
    const list = sessionsByDay.get(session.day_id) ?? [];
    list.push({ ...session, speakers: linksBySession.get(session.id) ?? [], subsessions: subsessionsBySession.get(session.id) ?? [] });
    sessionsByDay.set(session.day_id, list);
  }

  const dayList: DayWithSessions[] = ((days ?? []) as Day[]).map((d) => ({
    ...d,
    sessions: sessionsByDay.get(d.id) ?? [],
  }));

  return { days: dayList, speakers: (speakers ?? []) as Speaker[] };
}

// ---------- speakers ----------

export async function createSpeaker(input: Partial<Speaker> & { name: string }) {
  const { data, error } = await supabase.from("wkshp_speakers").insert(input).select().single();
  if (error) throw error;
  return data as Speaker;
}

export async function updateSpeaker(id: string, patch: Partial<Speaker>) {
  const { data, error } = await supabase.from("wkshp_speakers").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as Speaker;
}

export async function updateSpeakerStatus(id: string, status: SpeakerStatus) {
  return updateSpeaker(id, { status });
}

export async function deleteSpeaker(id: string) {
  const { error } = await supabase.from("wkshp_speakers").delete().eq("id", id);
  if (error) throw error;
}

// ---------- sessions ----------

export async function createSession(input: Partial<Session> & { day_id: string; title: string; order_index: number }) {
  const { data, error } = await supabase.from("wkshp_sessions").insert(input).select().single();
  if (error) throw error;
  return data as Session;
}

export async function updateSession(id: string, patch: Partial<Session>) {
  const { data, error } = await supabase.from("wkshp_sessions").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as Session;
}

export async function deleteSession(id: string) {
  const { error } = await supabase.from("wkshp_sessions").delete().eq("id", id);
  if (error) throw error;
}

// Persist a new session order, optionally moving a session to a different day.
export async function reorderSessions(updates: { id: string; day_id: string; order_index: number }[]) {
  const results = await Promise.all(
    updates.map((u) => supabase.from("wkshp_sessions").update({ day_id: u.day_id, order_index: u.order_index }).eq("id", u.id)),
  );
  const err = results.find((r) => r.error)?.error;
  if (err) throw err;
}

// ---------- subsessions ----------

export async function createSubsession(input: Partial<Subsession> & { session_id: string; title: string; order_index: number }) {
  const { data, error } = await supabase.from("wkshp_subsessions").insert(input).select().single();
  if (error) throw error;
  return data as Subsession;
}

export async function updateSubsession(id: string, patch: Partial<Subsession>) {
  const { data, error } = await supabase.from("wkshp_subsessions").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as Subsession;
}

export async function deleteSubsession(id: string) {
  const { error } = await supabase.from("wkshp_subsessions").delete().eq("id", id);
  if (error) throw error;
}

// Persist a new subsession order, optionally moving a subsession to a different session
// (it therefore travels with whichever session it's dropped into).
export async function reorderSubsessions(updates: { id: string; session_id: string; order_index: number }[]) {
  const results = await Promise.all(
    updates.map((u) =>
      supabase.from("wkshp_subsessions").update({ session_id: u.session_id, order_index: u.order_index }).eq("id", u.id),
    ),
  );
  const err = results.find((r) => r.error)?.error;
  if (err) throw err;
}

// ---------- speaker assignments (session- or subsession-level) ----------

export async function addSpeakerToSubsession(subsession_id: string, speaker_id: string, role: string, order_index: number) {
  const { data, error } = await supabase
    .from("wkshp_subsession_speakers")
    .insert({ subsession_id, speaker_id, role, order_index })
    .select()
    .single();
  if (error) throw error;
  return data as SpeakerAssignment;
}

export async function addSpeakerToSession(session_id: string, speaker_id: string, role: string, order_index: number) {
  const { data, error } = await supabase
    .from("wkshp_subsession_speakers")
    .insert({ session_id, speaker_id, role, order_index })
    .select()
    .single();
  if (error) throw error;
  return data as SpeakerAssignment;
}

export async function updateSpeakerAssignment(id: string, patch: Partial<SpeakerAssignment>) {
  const { data, error } = await supabase.from("wkshp_subsession_speakers").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as SpeakerAssignment;
}

export async function removeSpeakerAssignment(id: string) {
  const { error } = await supabase.from("wkshp_subsession_speakers").delete().eq("id", id);
  if (error) throw error;
}

// ---------- comment log ----------

export async function fetchComments(): Promise<Comment[]> {
  const { data, error } = await supabase.from("wkshp_comments").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Comment[];
}

export async function createComment(author: string, message: string) {
  const { data, error } = await supabase.from("wkshp_comments").insert({ author, message }).select().single();
  if (error) throw error;
  return data as Comment;
}

export async function deleteComment(id: string) {
  const { error } = await supabase.from("wkshp_comments").delete().eq("id", id);
  if (error) throw error;
}
