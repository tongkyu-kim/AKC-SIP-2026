"use client";

import { useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { RosterCard } from "@/components/RosterCard";
import { GroupPill } from "@/components/GroupPill";
import { SpeakerFormDialog, type SpeakerFormValues } from "@/components/SpeakerFormDialog";
import { useActiveDragType } from "@/lib/dnd";
import { createSpeaker } from "@/lib/api";
import { ORGANIZER_ORGS, type Speaker } from "@/lib/types";

const UNASSIGNED = "Others";
const GROUPS = [...ORGANIZER_ORGS, UNASSIGNED];

// Organizers skip the booking-status workflow entirely (always confirmed/
// prepared), so this group header is plain text — no colored StatusBadge
// like the speaker roster's status groups.
function OrgSection({ org, organizers, onOpenBio }: { org: string; organizers: Speaker[]; onOpenBio: (s: Speaker) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `organization:${org}`, data: { type: "organization", organization: org === UNASSIGNED ? "" : org } });
  const activeDragType = useActiveDragType();

  return (
    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950/40">
      <div className="flex items-center justify-between px-2.5 pt-2.5 pb-1.5">
        <span className={`text-sm font-semibold ${org === UNASSIGNED ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-200"}`}>{org}</span>
        <span className="text-xs text-zinc-400">{organizers.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-16 flex-col gap-1.5 rounded-lg p-2 pt-0 transition-colors ${
          isOver && activeDragType === "speaker" ? "bg-sky-50 ring-2 ring-sky-300 dark:bg-sky-950/40" : ""
        }`}
      >
        {organizers.map((o) => (
          <RosterCard key={o.id} speaker={o} onOpenBio={onOpenBio} />
        ))}
        {organizers.length === 0 && <div className="rounded-md border border-dashed border-zinc-200 py-3 text-center text-xs text-zinc-400 dark:border-zinc-800">Drop here</div>}
      </div>
    </div>
  );
}

// Partners/co-organizers, grouped by their organization (AKC/KMAC/WEtheTEAM/
// KOFICE) rather than by status — they're always confirmed/prepared, so
// there's no booking-status workflow to track. The "By Organization" drop
// targets use a distinct "organization" drag-data type (not "country" /
// "status" / "category") so an organizer card can never land on the Speaker
// or Participant rosters' regrouping targets and vice versa — see the
// isOrganizer guard in ScheduleBoard. They can still be dragged onto the
// schedule to assign them to a program, exactly like everyone else.
export function OrganizerRoster({ speakers, onOpenBio }: { speakers: Speaker[]; onOpenBio: (s: Speaker) => void }) {
  const [formOpen, setFormOpen] = useState(false);
  const [view, setView] = useState<"organization" | "all">("all");

  const organizers = useMemo(() => speakers.filter((s) => s.category === "organizer"), [speakers]);

  const byOrg = useMemo(() => {
    const map = new Map<string, Speaker[]>(GROUPS.map((g) => [g, []]));
    for (const o of organizers) {
      const key = o.country && ORGANIZER_ORGS.includes(o.country) ? o.country : UNASSIGNED;
      map.get(key)?.push(o);
    }
    return map;
  }, [organizers]);

  const allSorted = useMemo(() => [...organizers].sort((a, b) => a.name.localeCompare(b.name)), [organizers]);

  const handleSave = async (values: SpeakerFormValues) => {
    await createSpeaker(values);
  };

  return (
    <section className="relative flex flex-col rounded-lg bg-white p-3 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800 lg:h-full">
      <button
        onClick={() => setFormOpen(true)}
        aria-label="Add organizer"
        className="absolute right-4 top-3 flex h-7 w-7 items-center justify-center text-xl font-semibold leading-none text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
      >
        +
      </button>

      <h2 className="mb-2 flex-shrink-0 pr-9 text-base font-semibold text-zinc-900 dark:text-zinc-100">Organizer Roster</h2>

      <div className="mb-3 flex flex-shrink-0 gap-1.5">
        <button
          onClick={() => setView("all")}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            view === "all" ? "bg-sky-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          All Organizers
        </button>
        <button
          onClick={() => setView("organization")}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            view === "organization" ? "bg-sky-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          By Organization
        </button>
      </div>

      {/* [scrollbar-gutter:stable] reserves the scrollbar's width whether or
          not this list actually needs to scroll, so the pill row below never
          shifts width when a scrollbar appears/disappears. */}
      <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:[scrollbar-gutter:stable]">
        {view === "all" ? (
          <div className="flex flex-col gap-1.5">
            {allSorted.map((o) => (
              <RosterCard key={o.id} speaker={o} onOpenBio={onOpenBio} />
            ))}
            {allSorted.length === 0 && <p className="py-4 text-center text-xs text-zinc-400">No organizers yet.</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {GROUPS.map((org) => (
              <OrgSection key={org} org={org} organizers={byOrg.get(org) ?? []} onOpenBio={onOpenBio} />
            ))}
          </div>
        )}
      </div>

      {/* Pinned below the scrollable list — never pushed off-screen by it,
          regardless of how far the list above is scrolled. */}
      <div className="mt-3 flex flex-shrink-0 flex-wrap gap-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        {ORGANIZER_ORGS.map((org) => (
          <GroupPill key={org} id={`group:org-${org}`} label={org} />
        ))}
      </div>

      <SpeakerFormDialog open={formOpen} speaker={null} defaultCategory="organizer" onClose={() => setFormOpen(false)} onSave={handleSave} />
    </section>
  );
}
