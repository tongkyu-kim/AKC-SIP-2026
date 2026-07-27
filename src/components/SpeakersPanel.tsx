"use client";

import { useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { StatusBadge } from "@/components/StatusBadge";
import { RosterCard } from "@/components/RosterCard";
import { SpeakerFormDialog, type SpeakerFormValues } from "@/components/SpeakerFormDialog";
import { Button } from "@/components/ui/Field";
import { useActiveDragType } from "@/lib/dnd";
import { createSpeaker } from "@/lib/api";
import { SPEAKER_STATUSES, type Speaker, type SpeakerStatus } from "@/lib/types";

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

export function SpeakersPanel({ speakers, onOpenBio }: { speakers: Speaker[]; onOpenBio: (s: Speaker) => void }) {
  const [formOpen, setFormOpen] = useState(false);

  const nonParticipants = useMemo(() => speakers.filter((s) => s.category !== "participant"), [speakers]);

  const byStatus = useMemo(() => {
    const map = new Map<SpeakerStatus, Speaker[]>(SPEAKER_STATUSES.map((s) => [s, []]));
    for (const sp of nonParticipants) map.get(sp.status)?.push(sp);
    return map;
  }, [nonParticipants]);

  const handleSave = async (values: SpeakerFormValues) => {
    await createSpeaker(values);
  };

  return (
    <section className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Speaker Roster</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Drag a card onto the timetable to assign, or between groups to update availability.</p>
      </div>
      <Button variant="primary" className="mb-3 w-full" onClick={() => setFormOpen(true)}>
        + Add speaker
      </Button>

      <div className="flex flex-col gap-3">
        {SPEAKER_STATUSES.map((status) => (
          <StatusSection key={status} status={status} speakers={byStatus.get(status) ?? []} onOpenBio={onOpenBio} />
        ))}
      </div>

      <SpeakerFormDialog open={formOpen} speaker={null} defaultCategory="speaker" onClose={() => setFormOpen(false)} onSave={handleSave} />
    </section>
  );
}
