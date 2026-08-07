"use client";

import { useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { RosterCard } from "@/components/RosterCard";
import { StatusBadge } from "@/components/StatusBadge";
import { GroupPill } from "@/components/GroupPill";
import { SpeakerFormDialog, type SpeakerFormValues } from "@/components/SpeakerFormDialog";
import { useActiveDragType } from "@/lib/dnd";
import { createSpeaker } from "@/lib/api";
import { ASEAN_COUNTRIES, PARTICIPANT_STATUSES, PARTICIPANT_STATUS_LABEL, type Speaker, type SpeakerStatus } from "@/lib/types";

const UNASSIGNED = "Others";
const GROUPS = [...ASEAN_COUNTRIES, UNASSIGNED];

function CountrySection({ country, participants, onOpenBio }: { country: string; participants: Speaker[]; onOpenBio: (s: Speaker) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `country:${country}`, data: { type: "country", country: country === UNASSIGNED ? "" : country } });
  const activeDragType = useActiveDragType();

  return (
    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/40">
      <div className="flex items-center justify-between px-2.5 pt-2.5 pb-1.5">
        <span className={`text-sm font-semibold ${country === UNASSIGNED ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-200"}`}>{country}</span>
        <span className="text-xs text-zinc-400">{participants.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-16 flex-col gap-1.5 rounded-lg p-2 pt-0 transition-colors ${
          isOver && activeDragType === "speaker" ? "bg-sky-50 ring-2 ring-sky-300 dark:bg-sky-950/40" : ""
        }`}
      >
        {participants.map((p) => (
          <RosterCard key={p.id} speaker={p} onOpenBio={onOpenBio} />
        ))}
        {participants.length === 0 && <div className="rounded-md border border-dashed border-zinc-200 py-3 text-center text-xs text-zinc-400 dark:border-zinc-800">Drop here</div>}
      </div>
    </div>
  );
}

function ParticipantStatusSection({ status, participants, onOpenBio }: { status: SpeakerStatus; participants: Speaker[]; onOpenBio: (s: Speaker) => void }) {
  // Prefixed id (unlike the speaker roster's plain status id) so the two
  // rosters' status columns don't collide as duplicate dnd-kit droppable ids
  // when both happen to be in their "by status" view at once.
  const { setNodeRef, isOver } = useDroppable({ id: `participant-status:${status}`, data: { type: "status", status } });
  const activeDragType = useActiveDragType();

  return (
    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/40">
      <div className="flex items-center justify-between px-2.5 pt-2.5 pb-1.5">
        <StatusBadge status={status} label={PARTICIPANT_STATUS_LABEL[status]} />
        <span className="text-xs text-zinc-400">{participants.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-16 flex-col gap-1.5 rounded-lg p-2 pt-0 transition-colors ${
          isOver && activeDragType === "speaker" ? "bg-sky-50 ring-2 ring-sky-300 dark:bg-sky-950/40" : ""
        }`}
      >
        {participants.map((p) => (
          <RosterCard key={p.id} speaker={p} onOpenBio={onOpenBio} />
        ))}
        {participants.length === 0 && <div className="rounded-md border border-dashed border-zinc-200 py-3 text-center text-xs text-zinc-400 dark:border-zinc-800">Drop here</div>}
      </div>
    </div>
  );
}

export function ParticipantRoster({ speakers, onOpenBio }: { speakers: Speaker[]; onOpenBio: (s: Speaker) => void }) {
  const [formOpen, setFormOpen] = useState(false);
  const [view, setView] = useState<"country" | "status" | "all">("all");

  const participants = useMemo(() => speakers.filter((s) => s.category === "participant"), [speakers]);

  const byCountry = useMemo(() => {
    const map = new Map<string, Speaker[]>(GROUPS.map((c) => [c, []]));
    for (const p of participants) {
      const key = p.country && ASEAN_COUNTRIES.includes(p.country) ? p.country : UNASSIGNED;
      map.get(key)?.push(p);
    }
    return map;
  }, [participants]);

  const byStatus = useMemo(() => {
    const map = new Map<SpeakerStatus, Speaker[]>(PARTICIPANT_STATUSES.map((s) => [s, []]));
    for (const p of participants) map.get(p.status)?.push(p);
    return map;
  }, [participants]);

  const allSorted = useMemo(() => [...participants].sort((a, b) => a.name.localeCompare(b.name)), [participants]);

  const handleSave = async (values: SpeakerFormValues) => {
    await createSpeaker(values);
  };

  return (
    <section className="relative flex flex-col rounded-lg bg-white p-3 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800 lg:h-full">
      <button
        onClick={() => setFormOpen(true)}
        aria-label="Add participant"
        className="absolute right-4 top-3 flex h-7 w-7 items-center justify-center text-xl font-semibold leading-none text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
      >
        +
      </button>

      <h2 className="mb-2 flex flex-shrink-0 items-center gap-2 pr-9 text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Participant Roster
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{participants.length}</span>
      </h2>

      <div className="mb-3 flex flex-shrink-0 flex-wrap gap-1.5">
        <button
          onClick={() => setView("all")}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            view === "all" ? "bg-sky-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          All Participants
        </button>
        <button
          onClick={() => setView("country")}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            view === "country" ? "bg-sky-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          By Country
        </button>
        <button
          onClick={() => setView("status")}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            view === "status" ? "bg-sky-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          By Status
        </button>
      </div>

      {/* [scrollbar-gutter:stable] reserves the scrollbar's width whether or
          not this list actually needs to scroll, so the pill row below never
          shifts width when a scrollbar appears/disappears. */}
      <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:[scrollbar-gutter:stable]">
        {view === "all" && (
          <div className="flex flex-col gap-1.5">
            {allSorted.map((p) => (
              <RosterCard key={p.id} speaker={p} onOpenBio={onOpenBio} />
            ))}
            {allSorted.length === 0 && <p className="py-4 text-center text-xs text-zinc-400">No participants yet.</p>}
          </div>
        )}

        {view === "country" && (
          <div className="flex flex-col gap-3">
            {GROUPS.map((country) => (
              <CountrySection key={country} country={country} participants={byCountry.get(country) ?? []} onOpenBio={onOpenBio} />
            ))}
          </div>
        )}

        {view === "status" && (
          <div className="flex flex-col gap-3">
            {PARTICIPANT_STATUSES.map((status) => (
              <ParticipantStatusSection key={status} status={status} participants={byStatus.get(status) ?? []} onOpenBio={onOpenBio} />
            ))}
          </div>
        )}
      </div>

      {/* Pinned below the scrollable list — never pushed off-screen by it,
          regardless of how far the list above is scrolled. */}
      <div className="mt-3 flex flex-shrink-0 flex-wrap gap-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <GroupPill id="group:all-participants" label="ALL PARTICIPANTS" />
      </div>

      <SpeakerFormDialog open={formOpen} speaker={null} defaultCategory="participant" onClose={() => setFormOpen(false)} onSave={handleSave} />
    </section>
  );
}
