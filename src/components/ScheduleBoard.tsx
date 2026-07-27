"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { DaySection } from "@/components/DaySection";
import { SpeakersPanel } from "@/components/SpeakersPanel";
import { ParticipantRoster } from "@/components/ParticipantRoster";
import { CommentLog } from "@/components/CommentLog";
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
  updateSpeakerStatus,
  updateSubsession,
} from "@/lib/api";
import type { Comment, DayWithSessions, Speaker, Session, SessionWithChildren, SubsessionWithSpeakers } from "@/lib/types";

function maxOrder(items: { order_index: number }[]) {
  return items.length ? Math.max(...items.map((i) => i.order_index)) + 1 : 0;
}

export function ScheduleBoard({
  initialDays,
  initialSpeakers,
  initialComments,
}: {
  initialDays: DayWithSessions[];
  initialSpeakers: Speaker[];
  initialComments: Comment[];
}) {
  const { days, speakers, error, setDays } = useDashboardData(initialDays, initialSpeakers);
  const { comments } = useComments(initialComments);

  const [bioSpeaker, setBioSpeaker] = useState<Speaker | null>(null);
  const [speakerFormOpen, setSpeakerFormOpen] = useState(false);
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null);

  // Collapse state lives here (not locally in DaySection/SessionCard) so the
  // global collapse-all/expand bar can control every day and session at once,
  // while each row's own chevron still toggles just that one entry.
  const [collapsedDayIds, setCollapsedDayIds] = useState<Set<string>>(new Set());
  const [collapsedSessionIds, setCollapsedSessionIds] = useState<Set<string>>(new Set());

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

  // Always resolve the *live* subsession from current state so speaker-assignment edits
  // made while the dialog is open (add/remove) are reflected immediately.
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
      if (o?.type === "status") {
        // Dropping an assignment chip back onto the roster is the "take them out" gesture:
        // it unassigns them, in addition to updating status if it landed in a different column.
        if (a.source === "assignment") handleRemoveSpeakerLink(a.linkId);
        const targetStatus = o.status as Speaker["status"];
        if (targetStatus !== a.status) updateSpeakerStatus(a.speakerId, targetStatus);
        return;
      }
      if (o?.type === "country") {
        if (a.source === "assignment") handleRemoveSpeakerLink(a.linkId);
        updateSpeaker(a.speakerId, { country: o.country || null });
        return;
      }
      if (o?.type === "subsession" || o?.type === "session") {
        const targetKind: AssignmentKind = o.type;
        const targetId = over.id as string;
        if (a.source === "assignment") {
          if (a.fromKind === targetKind && a.fromId === targetId) return;
          handleMoveSpeakerAssignment(a.linkId, a.speakerId, a.role, targetKind, targetId);
        } else {
          handleAssignSpeaker(targetKind, targetId, a.speakerId, "Speaker");
        }
      }
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
    return null;
  })();

  if (error && days.length === 0) {
    return (
      <div className="mx-auto mt-10 max-w-lg rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
        <p className="font-medium">Can&rsquo;t load dashboard data</p>
        <p className="mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[2600px] px-4 py-6">
      <DndContext id="workshop-schedule-dnd" sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <ActiveDragTypeContext.Provider value={activeDrag?.type ?? null}>
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_300px_300px_300px]">
            <div className="min-w-0 space-y-6">
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
                  onOpenBio={setBioSpeaker}
                />
              ))}
            </div>

            <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
              <SpeakersPanel speakers={speakers} onOpenBio={setBioSpeaker} />
            </div>

            <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
              <ParticipantRoster speakers={speakers} onOpenBio={setBioSpeaker} />
            </div>

            <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
              <CommentLog comments={comments} />
            </div>
          </div>
        </ActiveDragTypeContext.Provider>

        <DragOverlay>{dragOverlayContent}</DragOverlay>
      </DndContext>

      <SpeakerBioDialog speaker={bioSpeaker} onClose={() => setBioSpeaker(null)} onEdit={() => setSpeakerFormOpen(true)} />
      <SpeakerFormDialog
        open={speakerFormOpen}
        speaker={bioSpeaker}
        onClose={() => setSpeakerFormOpen(false)}
        onSave={async (values) => {
          if (bioSpeaker) await updateSpeaker(bioSpeaker.id, values);
        }}
        onDelete={async (speaker) => {
          await deleteSpeaker(speaker.id);
          setBioSpeaker(null);
        }}
      />

      <SessionFormDialog
        open={sessionDialog.open}
        session={sessionDialog.session}
        days={days}
        defaultDayId={sessionDialog.dayId}
        onClose={() => setSessionDialog({ open: false, session: null })}
        onSave={handleSaveSession}
        onDelete={handleDeleteSession}
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
  );
}
