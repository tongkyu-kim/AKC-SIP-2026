"use client";

import { useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { StatusBadge } from "@/components/StatusBadge";
import { RosterCard } from "@/components/RosterCard";
import { GroupPill } from "@/components/GroupPill";
import { SpeakerFormDialog, type SpeakerFormValues } from "@/components/SpeakerFormDialog";
import { useActiveDragType } from "@/lib/dnd";
import { createSpeaker } from "@/lib/api";
import { CATEGORY_COLOR, CATEGORY_LABEL, SPEAKER_STATUSES, type Speaker, type SpeakerCategory, type SpeakerStatus } from "@/lib/types";

// Order requested for the "By Type" view — distinct from SPEAKER_CATEGORIES'
// storage order, and excludes "participant" (that's the other roster).
const SPEAKER_TYPES: SpeakerCategory[] = ["vip", "moderator", "speaker"];

function StatusSection({ status, speakers, onOpenBio }: { status: SpeakerStatus; speakers: Speaker[]; onOpenBio: (s: Speaker) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { type: "status", status } });
  const activeDragType = useActiveDragType();

  return (
    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/40">
      <div className="flex items-center justify-between px-2.5 pt-2.5 pb-1.5">
        <StatusBadge status={status} />
        <span className="text-xs text-zinc-400">{speakers.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-16 flex-col gap-1.5 rounded-lg p-2 pt-0 transition-colors ${
          isOver && activeDragType === "speaker" ? "bg-sky-50 ring-2 ring-sky-300 dark:bg-sky-950/40" : ""
        }`}
      >
        {speakers.map((s) => (
          <RosterCard key={s.id} speaker={s} onOpenBio={onOpenBio} />
        ))}
        {speakers.length === 0 && <div className="rounded-md border border-dashed border-zinc-200 py-3 text-center text-xs text-zinc-400 dark:border-zinc-800">Drop here</div>}
      </div>
    </div>
  );
}

function TypeSection({ category, speakers, onOpenBio }: { category: SpeakerCategory; speakers: Speaker[]; onOpenBio: (s: Speaker) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `category:${category}`, data: { type: "category", category } });
  const activeDragType = useActiveDragType();

  return (
    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/40">
      <div className="flex items-center justify-between px-2.5 pt-2.5 pb-1.5">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          <span className={`h-2 w-2 rounded-full ${CATEGORY_COLOR[category]}`} />
          {CATEGORY_LABEL[category]}
        </span>
        <span className="text-xs text-zinc-400">{speakers.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-16 flex-col gap-1.5 rounded-lg p-2 pt-0 transition-colors ${
          isOver && activeDragType === "speaker" ? "bg-sky-50 ring-2 ring-sky-300 dark:bg-sky-950/40" : ""
        }`}
      >
        {speakers.map((s) => (
          <RosterCard key={s.id} speaker={s} onOpenBio={onOpenBio} />
        ))}
        {speakers.length === 0 && <div className="rounded-md border border-dashed border-zinc-200 py-3 text-center text-xs text-zinc-400 dark:border-zinc-800">Drop here</div>}
      </div>
    </div>
  );
}

export function SpeakersPanel({ speakers, onOpenBio }: { speakers: Speaker[]; onOpenBio: (s: Speaker) => void }) {
  const [formOpen, setFormOpen] = useState(false);
  const [view, setView] = useState<"status" | "type" | "all">("all");

  // Excludes both participants and organizers — each has its own dedicated
  // roster, so neither should also show up here.
  const nonParticipants = useMemo(() => speakers.filter((s) => s.category !== "participant" && s.category !== "organizer"), [speakers]);

  const byStatus = useMemo(() => {
    const map = new Map<SpeakerStatus, Speaker[]>(SPEAKER_STATUSES.map((s) => [s, []]));
    for (const sp of nonParticipants) map.get(sp.status)?.push(sp);
    return map;
  }, [nonParticipants]);

  const byType = useMemo(() => {
    const map = new Map<SpeakerCategory, Speaker[]>(SPEAKER_TYPES.map((c) => [c, []]));
    for (const sp of nonParticipants) map.get(sp.category)?.push(sp);
    return map;
  }, [nonParticipants]);

  const allSorted = useMemo(() => [...nonParticipants].sort((a, b) => a.name.localeCompare(b.name)), [nonParticipants]);

  const handleSave = async (values: SpeakerFormValues) => {
    await createSpeaker(values);
  };

  return (
    <section className="relative flex flex-col rounded-lg bg-white p-3 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800 lg:h-full">
      <button
        onClick={() => setFormOpen(true)}
        aria-label="Add speaker"
        className="absolute right-4 top-3 flex h-7 w-7 items-center justify-center text-xl font-semibold leading-none text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
      >
        +
      </button>

      <h2 className="mb-2 flex flex-shrink-0 items-center gap-2 pr-9 text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Speaker/Guest Roster
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{nonParticipants.length}</span>
      </h2>

      <div className="mb-3 flex flex-shrink-0 flex-wrap gap-1.5">
        <button
          onClick={() => setView("all")}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            view === "all" ? "bg-sky-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          All Speakers
        </button>
        <button
          onClick={() => setView("status")}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            view === "status" ? "bg-sky-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          By Status
        </button>
        <button
          onClick={() => setView("type")}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            view === "type" ? "bg-sky-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          By Type
        </button>
      </div>

      {/* [scrollbar-gutter:stable] reserves the scrollbar's width whether or
          not this list actually needs to scroll, so the pill row below never
          shifts width when a scrollbar appears/disappears. */}
      <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:[scrollbar-gutter:stable]">
        {view === "all" && (
          <div className="flex flex-col gap-1.5">
            {allSorted.map((s) => (
              <RosterCard key={s.id} speaker={s} onOpenBio={onOpenBio} />
            ))}
            {allSorted.length === 0 && <p className="py-4 text-center text-xs text-zinc-400">No speakers yet.</p>}
          </div>
        )}

        {view === "status" && (
          <div className="flex flex-col gap-3">
            {SPEAKER_STATUSES.map((status) => (
              <StatusSection key={status} status={status} speakers={byStatus.get(status) ?? []} onOpenBio={onOpenBio} />
            ))}
          </div>
        )}

        {view === "type" && (
          <div className="flex flex-col gap-3">
            {SPEAKER_TYPES.map((category) => (
              <TypeSection key={category} category={category} speakers={byType.get(category) ?? []} onOpenBio={onOpenBio} />
            ))}
          </div>
        )}
      </div>

      {/* Pinned below the scrollable list — never pushed off-screen by it,
          regardless of how far the list above is scrolled. */}
      <div className="mt-3 flex flex-shrink-0 flex-nowrap gap-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <GroupPill id="group:all-vips" label="VIPS" />
        <GroupPill id="group:all-moderators" label="MODERATORS" />
        <GroupPill id="group:all-speakers" label="SPEAKERS" />
      </div>

      <SpeakerFormDialog open={formOpen} speaker={null} defaultCategory="speaker" onClose={() => setFormOpen(false)} onSave={handleSave} />
    </section>
  );
}
