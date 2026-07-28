import { supabase } from "@/lib/supabase/client";
import type {
  Comment,
  Day,
  DayWithSessions,
  ProjectPhase,
  ProjectSubtask,
  ProjectTask,
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

export async function createComment(author: string, message: string, team: string) {
  const { data, error } = await supabase.from("wkshp_comments").insert({ author, message, team }).select().single();
  if (error) throw error;
  return data as Comment;
}

export async function deleteComment(id: string) {
  const { error } = await supabase.from("wkshp_comments").delete().eq("id", id);
  if (error) throw error;
}

// ---------- shared project Gantt ----------
//
// These tables (project_phases/project_tasks/project_subtasks) belong to the
// AKC-TIU dashboard's Project Charter, not this app — they live in the same
// Supabase project so both dashboards read/write the exact same rows. We only
// ever touch the one project row that is this workshop's FY2026 charter.
// No "wkshp_" prefix here on purpose: these are AKC-TIU's tables.

export const GANTT_PROJECT_ID = "innovation-program";

// Matches AKC-TIU's own id scheme (src/lib/utils.ts generateId) — plain
// lowercase-base36 strings, not uuids, since project_phases/tasks/subtasks
// all use `id text primary key`. Exported (rather than generated inside the
// insert* functions below) so callers can generate the id up front and use
// it immediately for an optimistic local update, the same way AKC-TIU's own
// useProjects.ts does — addPhase there returns the new id synchronously so
// a drag-to-create-phase can seed a first task into it without waiting on
// the network round trip.
export function generateGanttId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function fetchProjectGantt(): Promise<{
  phases: ProjectPhase[];
  tasks: ProjectTask[];
  subtasks: ProjectSubtask[];
  start_date: string;
  end_date: string;
}> {
  const [
    { data: project, error: projectErr },
    { data: phases, error: phaseErr },
    { data: tasks, error: taskErr },
    { data: subtasks, error: subErr },
  ] = await Promise.all([
    supabase.from("projects").select("start_date,end_date").eq("id", GANTT_PROJECT_ID).single(),
    supabase.from("project_phases").select("*").eq("project_id", GANTT_PROJECT_ID).order("display_order"),
    supabase.from("project_tasks").select("*").eq("project_id", GANTT_PROJECT_ID).order("display_order"),
    supabase.from("project_subtasks").select("*").eq("project_id", GANTT_PROJECT_ID).order("display_order"),
  ]);
  const err = projectErr || phaseErr || taskErr || subErr;
  if (err) throw err;
  return {
    phases: (phases ?? []) as ProjectPhase[],
    tasks: (tasks ?? []) as ProjectTask[],
    subtasks: (subtasks ?? []) as ProjectSubtask[],
    start_date: (project as { start_date: string } | null)?.start_date ?? new Date().toISOString().slice(0, 10),
    end_date: (project as { end_date: string } | null)?.end_date ?? new Date().toISOString().slice(0, 10),
  };
}

export async function insertProjectPhase(row: ProjectPhase) {
  const { error } = await supabase.from("project_phases").insert(row);
  if (error) throw error;
}

export async function updateProjectPhase(id: string, patch: Partial<Omit<ProjectPhase, "id">>) {
  const { data, error } = await supabase.from("project_phases").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as ProjectPhase;
}

export async function deleteProjectPhase(id: string) {
  const { error } = await supabase.from("project_phases").delete().eq("id", id);
  if (error) throw error;
}

export async function insertProjectTask(row: ProjectTask) {
  const { error } = await supabase.from("project_tasks").insert(row);
  if (error) throw error;
}

export async function updateProjectTask(id: string, patch: Partial<Omit<ProjectTask, "id">>) {
  const { data, error } = await supabase.from("project_tasks").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as ProjectTask;
}

export async function deleteProjectTask(id: string) {
  const { error } = await supabase.from("project_tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function insertProjectSubtask(row: ProjectSubtask) {
  const { error } = await supabase.from("project_subtasks").insert(row);
  if (error) throw error;
}

export async function updateProjectSubtask(id: string, patch: Partial<Omit<ProjectSubtask, "id">>) {
  const { data, error } = await supabase.from("project_subtasks").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as ProjectSubtask;
}

export async function deleteProjectSubtask(id: string) {
  const { error } = await supabase.from("project_subtasks").delete().eq("id", id);
  if (error) throw error;
}
