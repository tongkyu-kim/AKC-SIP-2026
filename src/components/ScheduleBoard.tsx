"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { GanttChart, MessageSquare, Wallet } from "lucide-react";
import { DaySection } from "@/components/DaySection";
import { SpeakersPanel } from "@/components/SpeakersPanel";
import { ParticipantRoster } from "@/components/ParticipantRoster";
import { OrganizerRoster } from "@/components/OrganizerRoster";
import { CommentLog } from "@/components/CommentLog";
import { ProjectGanttPopup } from "@/components/ProjectGanttPopup";
import { BudgetPopup } from "@/components/BudgetPopup";
import { SpeakerBioDialog } from "@/components/SpeakerBioDialog";
import { SpeakerFormDialog } from "@/components/SpeakerFormDialog";
import { SessionFormDialog, type SessionFormValues } from "@/components/SessionFormDialog";
import { SubsessionFormDialog, type SubsessionFormValues } from "@/components/SubsessionFormDialog";
import { Avatar } from "@/components/ui/Avatar";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useComments } from "@/hooks/useComments";
import { ActiveDragTypeContext, type AssignmentKind, type DragData, type DropData } from "@/lib/dnd";
import {
  addSpeakerToSession,
  addSpeakerToSubsession,
  createSession,
  createSubsession,
  deleteSession,
  deleteSpeaker,
  deleteSubsession,
  removeSpeakerAssignment,
  reorderSessions,
  reorderSubsessions,
  updateSession,
  updateSpeaker,
  updateSubsession,
} from "@/lib/api";
import type { Comment, DayWithSessions, Speaker, Session, SessionWithChildren, SubsessionWithSpeakers } from "@/lib/types";

function maxOrder(items: { order_index: number }[]) {
  return items.length ? Math.max(...items.map((i) => i.order_index)) + 1 : 0;
}

// closestCenter alone picks whichever droppable's center is numerically
// nearest, even with zero visual overlap — across the whole page, not just
// nearby elements. With the roster panels and the schedule table sharing one
// DndContext, that let a small drag inside a roster's status/country groups
// occasionally "win" against a distant, unrelated session/subsession row.
// pointerWithin only matches droppables the pointer is actually over, so try
// that first and only fall back to closestCenter (needed for the sortable
// day/session reordering feel) when the pointer isn't within anything.
const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  return closestCenter(args);
};

export function ScheduleBoard({
  initialDays,
  initialSpeakers,
  initialComments,
}: {
  initialDays: DayWithSessions[];
  initialSpeakers: Speaker[];
  initialComments: Comment[];
}) {
  const { days, speakers, error, setDays, setSpeakers } = useDashboardData(initialDays, initialSpeakers);
  const { comments } = useComments(initialComments);

  const [bioSpeaker, setBioSpeaker] = useState<Speaker | null>(null);
  // Set only when the bio popup was opened from a chip already assigned to a
  // program (not from a plain roster card) — lets the popup offer a "Remove
  // from program" button scoped to that one assignment.
  const [bioAssignment, setBioAssignment] = useState<{ linkId: string; fromKind: AssignmentKind; fromId: string } | null>(null);
  const handleOpenBio = (speaker: Speaker, assignment?: { linkId: string; fromKind: AssignmentKind; fromId: string }) => {
    setBioSpeaker(speaker);
    setBioAssignment(assignment ?? null);
  };
  const [speakerFormOpen, setSpeakerFormOpen] = useState(false);
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null);
  const [commentLogOpen, setCommentLogOpen] = useState(false);
  const [ganttOpen, setGanttOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);

  // Collapse state lives here (not locally in DaySection/SessionCard) so the
  // global collapse-all/expand bar can control every day and session at once,
  // while each row's own chevron still toggles just that one entry.
  const [collapsedDayIds, setCollapsedDayIds] = useState<Set<string>>(new Set());
  // Logistics sessions (flight matrices) are dense with passenger chips, so
  // they start collapsed — open the ones you need instead of scrolling past
  // all of them by default.
  const [collapsedSessionIds, setCollapsedSessionIds] = useState<Set<string>>(
    () => new Set(initialDays.flatMap((d) => d.sessions).filter((s) => s.session_type === "logistics").map((s) => s.id)),
  );

  const toggleDayCollapsed = (dayId: string) => {
    setCollapsedDayIds((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) next.delete(dayId);
      else next.add(dayId);
      return next;
    });
  };

  const toggleSessionCollapsed = (sessionId: string) => {
    setCollapsedSessionIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  };

  const allSessionIds = days.flatMap((d) => d.sessions).map((s) => s.id);

  const handleCollapseAll = () => {
    setCollapsedDayIds(new Set(days.map((d) => d.id)));
    setCollapsedSessionIds(new Set(allSessionIds));
  };
  const handleExpandToPrograms = () => {
    setCollapsedDayIds(new Set());
    setCollapsedSessionIds(new Set(allSessionIds));
  };
  const handleExpandAll = () => {
    setCollapsedDayIds(new Set());
    setCollapsedSessionIds(new Set());
  };

  const [sessionDialog, setSessionDialog] = useState<{ open: boolean; session: SessionWithChildren | null; dayId?: string }>({
    open: false,
    session: null,
  });
  const [subsessionDialog, setSubsessionDialog] = useState<{ open: boolean; subsession: SubsessionWithSpeakers | null; sessionId?: string }>({
    open: false,
    subsession: null,
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const allSubsessions = days.flatMap((d) => d.sessions).flatMap((s) => s.subsessions);

  // Always resolve the *live* session/subsession from current state so
  // speaker-assignment edits made while the dialog is open (add/remove via
  // the "Remove" button in the assigned-speakers list) are reflected
  // immediately, instead of the dialog holding on to a stale snapshot from
  // whenever it was opened.
  const liveSession = sessionDialog.session
    ? days.flatMap((d) => d.sessions).find((s) => s.id === sessionDialog.session!.id) ?? null
    : null;
  const liveSubsession = subsessionDialog.subsession ? allSubsessions.find((s) => s.id === subsessionDialog.subsession!.id) ?? null : null;

  function patchSubsession(subsessionId: string, updater: (s: SubsessionWithSpeakers) => SubsessionWithSpeakers) {
    setDays((prev: DayWithSessions[]) =>
      prev.map((day) => ({
        ...day,
        sessions: day.sessions.map((session) => ({
          ...session,
          subsessions: session.subsessions.map((s) => (s.id === subsessionId ? updater(s) : s)),
        })),
      })),
    );
  }

  function patchSession(sessionId: string, updater: (s: SessionWithChildren) => SessionWithChildren) {
    setDays((prev: DayWithSessions[]) =>
      prev.map((day) => ({
        ...day,
        sessions: day.sessions.map((s) => (s.id === sessionId ? updater(s) : s)),
      })),
    );
  }

  // ---------- speakers ----------
  //
  // Every mutation here applies the change to local `speakers` state first
  // (optimistic) and rolls back + alerts on failure, rather than firing the
  // Supabase call and waiting on the realtime `postgres_changes` subscription
  // to eventually reconcile it. That subscription is a nice-to-have for
  // multi-tab sync, not something a status/country/category drag should
  // depend on to render correctly -- relying on it made drags look like they
  // "revert" any time the write failed silently or the realtime channel was
  // slow/disconnected, since nothing local ever changed to begin with.

  function patchSpeakerLocal(id: string, patch: Partial<Speaker>) {
    setSpeakers((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  async function mutateSpeaker(id: string, patch: Partial<Speaker>) {
    const previous = speakers.find((s) => s.id === id);
    if (!previous) return;
    patchSpeakerLocal(id, patch);
    try {
      await updateSpeaker(id, patch);
    } catch (e) {
      patchSpeakerLocal(id, previous);
      alert(`Failed to save change for ${previous.name}: ${e instanceof Error ? e.message : "unknown error"}`);
    }
  }

  const handleSpeakerCreated = (speaker: Speaker) => {
    setSpeakers((prev) => [...prev, speaker]);
  };

  // ---------- sessions ----------

  const handleReorderSessions = async (dayId: string, orderedIds: string[]) => {
    setDays((prev: DayWithSessions[]) =>
      prev.map((day) => {
        if (day.id !== dayId) return day;
        const byId = new Map(day.sessions.map((s) => [s.id, s]));
        return { ...day, sessions: orderedIds.map((id, i) => ({ ...byId.get(id)!, order_index: i })) };
      }),
    );
    await reorderSessions(orderedIds.map((id, i) => ({ id, day_id: dayId, order_index: i })));
  };

  const handleSaveSession = async (values: SessionFormValues) => {
    const patch = {
      day_id: values.day_id,
      title: values.title,
      description: values.description || null,
      event_date: values.event_date || null,
      start_time: values.start_time || null,
      end_time: values.end_time || null,
      display_time: values.display_time || null,
      session_type: values.session_type,
    };
    if (sessionDialog.session) {
      await updateSession(sessionDialog.session.id, patch);
    } else {
      const day = days.find((d) => d.id === values.day_id);
      await createSession({ ...patch, order_index: maxOrder(day?.sessions ?? []) });
    }
  };

  const handleDeleteSession = async (session: Session) => {
    await deleteSession(session.id);
  };

  // ---------- subsessions ----------

  const handleReorderSubsessions = async (sessionId: string, orderedIds: string[]) => {
    setDays((prev: DayWithSessions[]) =>
      prev.map((day) => ({
        ...day,
        sessions: day.sessions.map((session) => {
          if (session.id !== sessionId) return session;
          const byId = new Map(session.subsessions.map((s) => [s.id, s]));
          return { ...session, subsessions: orderedIds.map((id, i) => ({ ...byId.get(id)!, order_index: i })) };
        }),
      })),
    );
    await reorderSubsessions(orderedIds.map((id, i) => ({ id, session_id: sessionId, order_index: i })));
  };

  const handleSaveSubsession = async (values: SubsessionFormValues) => {
    const patch = {
      session_id: values.session_id,
      title: values.title,
      kind: values.kind,
      time_range: values.time_range || null,
      description: values.description || null,
      flight_code: values.flight_code || null,
      departure_airport: values.departure_airport || null,
      arrival_city: values.arrival_city || null,
      departure_time: values.departure_time || null,
      arrival_time: values.arrival_time || null,
      hide_speakers: values.hide_speakers,
    };
    if (subsessionDialog.subsession) {
      await updateSubsession(subsessionDialog.subsession.id, patch);
    } else {
      const session = days.flatMap((d) => d.sessions).find((s) => s.id === values.session_id);
      await createSubsession({ ...patch, order_index: maxOrder(session?.subsessions ?? []) });
    }
  };

  const handleDeleteSubsession = async (subsession: SubsessionWithSpeakers) => {
    await deleteSubsession(subsession.id);
  };

  function findAssignmentTarget(kind: AssignmentKind, id: string) {
    return kind === "session" ? days.flatMap((d) => d.sessions).find((s) => s.id === id) : allSubsessions.find((s) => s.id === id);
  }

  const handleAssignSpeaker = async (kind: AssignmentKind, id: string, speakerId: string, role: string) => {
    const speaker = speakers.find((s) => s.id === speakerId);
    const target = findAssignmentTarget(kind, id);
    if (!speaker || !target) return;
    if (target.speakers.some((l) => l.speaker_id === speakerId)) return;
    const order_index = maxOrder(target.speakers);
    if (kind === "session") {
      const link = await addSpeakerToSession(id, speakerId, role, order_index);
      patchSession(id, (s) => ({ ...s, speakers: [...s.speakers, { ...link, speaker }] }));
    } else {
      const link = await addSpeakerToSubsession(id, speakerId, role, order_index);
      patchSubsession(id, (s) => ({ ...s, speakers: [...s.speakers, { ...link, speaker }] }));
    }
  };

  // A team pill dropped onto a program attaches only the pill's label there
  // — it never creates or touches any speaker assignment. Purely "who's in
  // charge here", tracked separately from the assigned-people list.
  const handleAddTeamToProgram = async (kind: AssignmentKind, id: string, label: string) => {
    const target = findAssignmentTarget(kind, id);
    // `?? []` covers the window before the 0011_program_teams migration has
    // been run, when rows fetched from Supabase won't have this column yet.
    if (!target || (target.teams ?? []).includes(label)) return;
    const teams = [...(target.teams ?? []), label];
    if (kind === "session") {
      await updateSession(id, { teams });
      patchSession(id, (s) => ({ ...s, teams }));
    } else {
      await updateSubsession(id, { teams });
      patchSubsession(id, (s) => ({ ...s, teams }));
    }
  };

  const handleRemoveTeamFromProgram = async (kind: AssignmentKind, id: string, label: string) => {
    const target = findAssignmentTarget(kind, id);
    if (!target) return;
    const teams = (target.teams ?? []).filter((t) => t !== label);
    if (kind === "session") {
      await updateSession(id, { teams });
      patchSession(id, (s) => ({ ...s, teams }));
    } else {
      await updateSubsession(id, { teams });
      patchSubsession(id, (s) => ({ ...s, teams }));
    }
  };

  const handleRemoveSpeakerLink = async (linkId: string) => {
    await removeSpeakerAssignment(linkId);
    setDays((prev: DayWithSessions[]) =>
      prev.map((day) => ({
        ...day,
        sessions: day.sessions.map((session) => ({
          ...session,
          speakers: session.speakers.filter((l) => l.id !== linkId),
          subsessions: session.subsessions.map((s) => ({ ...s, speakers: s.speakers.filter((l) => l.id !== linkId) })),
        })),
      })),
    );
  };

  const handleMoveSpeakerAssignment = async (
    linkId: string,
    speakerId: string,
    role: string,
    targetKind: AssignmentKind,
    targetId: string,
  ) => {
    const target = findAssignmentTarget(targetKind, targetId);
    if (!target) return;
    const alreadyThere = target.speakers.some((l) => l.speaker_id === speakerId);
    await handleRemoveSpeakerLink(linkId);
    if (alreadyThere) return;
    await handleAssignSpeaker(targetKind, targetId, speakerId, role);
  };

  // ---------- unified drag-and-drop ----------

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined;
    if (data) setActiveDrag(data);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;
    const a = active.data.current as DragData | undefined;
    const o = over.data.current as DropData | undefined;
    if (!a) return;

    if (a.type === "session") {
      if (o?.type !== "session" || active.id === over.id || o.dayId !== a.dayId) return;
      const day = days.find((d) => d.id === a.dayId);
      if (!day) return;
      const ids = day.sessions.map((s) => s.id);
      const oldIndex = ids.indexOf(active.id as string);
      const newIndex = ids.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return;
      handleReorderSessions(a.dayId, arrayMove(ids, oldIndex, newIndex));
      return;
    }

    if (a.type === "subsession") {
      if (o?.type !== "subsession" || active.id === over.id || o.sessionId !== a.sessionId) return;
      const session = days.flatMap((d) => d.sessions).find((s) => s.id === a.sessionId);
      if (!session) return;
      const ids = session.subsessions.map((s) => s.id);
      const oldIndex = ids.indexOf(active.id as string);
      const newIndex = ids.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return;
      handleReorderSubsessions(a.sessionId, arrayMove(ids, oldIndex, newIndex));
      return;
    }

    if (a.type === "speaker") {
      // Organizers are locked out of every regrouping drop target (status,
      // country, type) so a stray drag can never mix them into the Speaker
      // or Participant rosters — assigning them onto the schedule below is
      // still fully allowed, this only blocks the recategorizing drops.
      const isOrganizer = speakers.find((s) => s.id === a.speakerId)?.category === "organizer";
      if (o?.type === "status") {
        if (isOrganizer) return;
        // Dropping an assignment chip back onto the roster is the "take them out" gesture:
        // it unassigns them, in addition to updating status if it landed in a different column.
        if (a.source === "assignment") handleRemoveSpeakerLink(a.linkId);
        const targetStatus = o.status as Speaker["status"];
        if (targetStatus !== a.status) mutateSpeaker(a.speakerId, { status: targetStatus });
        return;
      }
      if (o?.type === "country") {
        if (isOrganizer) return;
        if (a.source === "assignment") handleRemoveSpeakerLink(a.linkId);
        mutateSpeaker(a.speakerId, { country: o.country || null });
        return;
      }
      if (o?.type === "category") {
        if (isOrganizer) return;
        if (a.source === "assignment") handleRemoveSpeakerLink(a.linkId);
        mutateSpeaker(a.speakerId, { category: o.category });
        return;
      }
      if (o?.type === "organization") {
        // The inverse guard: only organizers use this axis, so a speaker/
        // participant dropped on an org group is a safe no-op instead of
        // acquiring an org-shaped `country` value.
        if (!isOrganizer) return;
        if (a.source === "assignment") handleRemoveSpeakerLink(a.linkId);
        mutateSpeaker(a.speakerId, { country: o.organization || null });
        return;
      }
      // People only live on items (subsessions) now — a session (the program
      // row) only accepts team pills, see the "group" branch below.
      if (o?.type === "subsession") {
        const targetKind: AssignmentKind = "subsession";
        const targetId = over.id as string;
        if (a.source === "assignment") {
          if (a.fromKind === targetKind && a.fromId === targetId) return;
          handleMoveSpeakerAssignment(a.linkId, a.speakerId, a.role, targetKind, targetId);
        } else {
          handleAssignSpeaker(targetKind, targetId, a.speakerId, "Speaker");
        }
      }
      return;
    }

    if (a.type === "group") {
      // Teams only live on the session (program) row now — its items
      // (subsessions) only accept people, see above. Attaches just the
      // label, never touches any speaker record.
      if (o?.type !== "session") return;
      handleAddTeamToProgram("session", over.id as string, a.label);
    }
  };

  const dragOverlayContent = (() => {
    if (!activeDrag) return null;
    if (activeDrag.type === "speaker") {
      const speaker = speakers.find((s) => s.id === activeDrag.speakerId);
      if (!speaker) return null;
      return (
        <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white py-1 pl-1 pr-3 text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <Avatar speaker={speaker} size="xs" />
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{speaker.name}</span>
        </div>
      );
    }
    if (activeDrag.type === "group") {
      return (
        <div className="rounded-full bg-gradient-to-br from-indigo-700 via-blue-700 to-sky-600 px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-lg">
          {activeDrag.label}
        </div>
      );
    }
    return null;
  })();

  const showError = error && days.length === 0;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 dark:bg-zinc-950 lg:h-dvh lg:overflow-hidden">
      <header className="relative flex-shrink-0 overflow-hidden bg-gradient-to-br from-indigo-700 via-blue-700 to-sky-600">
        <div
          aria-hidden
          className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_35%),radial-gradient(circle_at_80%_0%,white,transparent_30%)]"
        />
        <div className="relative mx-auto w-full max-w-[2600px] px-4 py-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">ASEAN-Korea Sustainable Innovation Program</p>
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                  October 7–10 · Gyeongju, Korea
                </span>
              </div>
              <h1 className="mt-1 truncate text-xl font-bold leading-tight text-white sm:text-2xl">
                Cross-Border AI Governance for Sustainable Development and Creative Culture
              </h1>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <button
                onClick={() => setCommentLogOpen(true)}
                aria-label="Comment log"
                title="Comment log"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
              >
                <MessageSquare size={16} />
              </button>
              <button
                onClick={() => setGanttOpen(true)}
                aria-label="Project Gantt"
                title="Project Gantt"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
              >
                <GanttChart size={16} />
              </button>
              <button
                onClick={() => setBudgetOpen(true)}
                aria-label="Budget Allocation"
                title="Budget Allocation"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
              >
                <Wallet size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="min-h-0 lg:flex-1 lg:overflow-hidden">
        {showError ? (
          <div className="mx-auto mt-10 max-w-lg rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <p className="font-medium">Can&rsquo;t load dashboard data</p>
            <p className="mt-1">{error}</p>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-[2600px] flex-col px-4 py-6 lg:h-full lg:min-h-0">
            <DndContext id="workshop-schedule-dnd" sensors={sensors} collisionDetection={collisionDetection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <ActiveDragTypeContext.Provider value={activeDrag?.type ?? null}>
                <div className="grid grid-cols-1 items-start gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[1fr_340px_340px_340px] lg:items-stretch">
                  <div className="min-w-0 space-y-6 lg:min-h-0 lg:overflow-y-auto">
                    <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">View:</span>
                      <button
                        onClick={handleCollapseAll}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Collapse all
                      </button>
                      <button
                        onClick={handleExpandToPrograms}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Programs only
                      </button>
                      <button
                        onClick={handleExpandAll}
                        className="rounded-md px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Expand all
                      </button>
                    </div>

                    {days.map((day) => (
                      <DaySection
                        key={day.id}
                        day={day}
                        collapsed={collapsedDayIds.has(day.id)}
                        onToggleCollapsed={() => toggleDayCollapsed(day.id)}
                        collapsedSessionIds={collapsedSessionIds}
                        onToggleSessionCollapsed={toggleSessionCollapsed}
                        onEditSession={(session) => setSessionDialog({ open: true, session })}
                        onAddSession={(dayId) => setSessionDialog({ open: true, session: null, dayId })}
                        onEditSubsession={(sub) => setSubsessionDialog({ open: true, subsession: sub })}
                        onAddSubsession={(sessionId) => setSubsessionDialog({ open: true, subsession: null, sessionId })}
                        onOpenBio={handleOpenBio}
                        onRemoveTeam={handleRemoveTeamFromProgram}
                      />
                    ))}
                  </div>

                  {/* Each roster panel now scrolls its own list internally (see its
                      lg:h-full section) so its team-pill row stays pinned at the
                      bottom regardless of scroll — this wrapper just needs to give
                      it a bounded height to fill. */}
                  <div className="lg:min-h-0">
                    <SpeakersPanel speakers={speakers} onOpenBio={handleOpenBio} onCreated={handleSpeakerCreated} />
                  </div>

                  <div className="lg:min-h-0">
                    <ParticipantRoster speakers={speakers} onOpenBio={handleOpenBio} onCreated={handleSpeakerCreated} />
                  </div>

                  <div className="lg:min-h-0">
                    <OrganizerRoster speakers={speakers} onOpenBio={handleOpenBio} onCreated={handleSpeakerCreated} />
                  </div>
                </div>
              </ActiveDragTypeContext.Provider>

              <DragOverlay>{dragOverlayContent}</DragOverlay>
            </DndContext>

            <SpeakerBioDialog
              speaker={bioSpeaker}
              assignment={bioAssignment}
              onClose={() => {
                setBioSpeaker(null);
                setBioAssignment(null);
              }}
              onEdit={() => setSpeakerFormOpen(true)}
              onRemoveFromProgram={async () => {
                if (!bioAssignment) return;
                await handleRemoveSpeakerLink(bioAssignment.linkId);
                setBioSpeaker(null);
                setBioAssignment(null);
              }}
            />
            <SpeakerFormDialog
              open={speakerFormOpen}
              speaker={bioSpeaker}
              onClose={() => setSpeakerFormOpen(false)}
              onSave={async (values) => {
                if (bioSpeaker) await mutateSpeaker(bioSpeaker.id, values);
              }}
              onDelete={async (speaker) => {
                try {
                  await deleteSpeaker(speaker.id);
                  setSpeakers((prev) => prev.filter((s) => s.id !== speaker.id));
                } catch (e) {
                  alert(`Failed to delete ${speaker.name}: ${e instanceof Error ? e.message : "unknown error"}`);
                  return;
                }
                setBioSpeaker(null);
                setBioAssignment(null);
              }}
            />

            <SessionFormDialog
              open={sessionDialog.open}
              session={liveSession}
              days={days}
              defaultDayId={sessionDialog.dayId}
              onClose={() => setSessionDialog({ open: false, session: null })}
              onSave={handleSaveSession}
              onDelete={handleDeleteSession}
              onRemoveSpeakerLink={handleRemoveSpeakerLink}
            />

            <SubsessionFormDialog
              open={subsessionDialog.open}
              subsession={liveSubsession}
              days={days}
              defaultSessionId={subsessionDialog.sessionId}
              onClose={() => setSubsessionDialog({ open: false, subsession: null })}
              onSave={handleSaveSubsession}
              onDelete={handleDeleteSubsession}
              onRemoveSpeakerLink={handleRemoveSpeakerLink}
            />
          </div>
        )}
      </div>

      <CommentLog open={commentLogOpen} onClose={() => setCommentLogOpen(false)} comments={comments} />
      <ProjectGanttPopup open={ganttOpen} onClose={() => setGanttOpen(false)} />
      <BudgetPopup open={budgetOpen} onClose={() => setBudgetOpen(false)} speakers={speakers} />
    </div>
  );
}
