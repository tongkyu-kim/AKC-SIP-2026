"use client";

import { useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { RosterCard } from "@/components/RosterCard";
import { SpeakerFormDialog, type SpeakerFormValues } from "@/components/SpeakerFormDialog";
import { Button } from "@/components/ui/Field";
import { useActiveDragType } from "@/lib/dnd";
import { createSpeaker } from "@/lib/api";
import { ASEAN_COUNTRIES, type Speaker } from "@/lib/types";

const UNASSIGNED = "Unassigned";
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

export function ParticipantRoster({ speakers, onOpenBio }: { speakers: Speaker[]; onOpenBio: (s: Speaker) => void }) {
  const [formOpen, setFormOpen] = useState(false);

  const participants = useMemo(() => speakers.filter((s) => s.category === "participant"), [speakers]);

  const byCountry = useMemo(() => {
    const map = new Map<string, Speaker[]>(GROUPS.map((c) => [c, []]));
    for (const p of participants) {
      const key = p.country && ASEAN_COUNTRIES.includes(p.country) ? p.country : UNASSIGNED;
      map.get(key)?.push(p);
    }
    return map;
  }, [participants]);

  const handleSave = async (values: SpeakerFormValues) => {
    await createSpeaker(values);
  };

  return (
    <section className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Participant Roster</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Grouped by ASEAN country. Drag a card between countries, or onto the timetable (e.g. a flight row) to assign.</p>
      </div>
      <Button variant="primary" className="mb-3 w-full" onClick={() => setFormOpen(true)}>
        + Add participant
      </Button>

      <div className="flex flex-col gap-3">
        {GROUPS.map((country) => (
          <CountrySection key={country} country={country} participants={byCountry.get(country) ?? []} onOpenBio={onOpenBio} />
        ))}
      </div>

      <SpeakerFormDialog open={formOpen} speaker={null} defaultCategory="participant" onClose={() => setFormOpen(false)} onSave={handleSave} />
    </section>
  );
}
