"use client";

import { useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { StatusBadge } from "@/components/StatusBadge";
import { RosterCard } from "@/components/RosterCard";
import { GroupPill } from "@/components/GroupPill";
import { SpeakerFormDialog, type SpeakerFormValues } from "@/components/SpeakerFormDialog";
import { useActiveDragType } from "@/lib/dnd";
import { createSpeaker } from "@/lib/api";
import { CATEGORY_COLOR, CATEGORY_LABEL, STATUSES, type Speaker, type SpeakerCategory, type SpeakerStatus } from "@/lib/types";

// The Speaker Roster's "By Type" split — VIPs get their own section above
// entirely, so they're never one of these.
const GUEST_TYPES: SpeakerCategory[] = ["moderator", "speaker"];

function viewButtonClass(active: boolean) {
  return `rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
    active ? "bg-sky-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
  }`;
}

// idPrefix keeps this section's droppable ids distinct from the other
// status-grouped sections sharing the page (dnd-kit ids must be globally
// unique) -- the Participant Roster's own status view uses "participant-status:".
function StatusSection({
  idPrefix,
  status,
  speakers,
  onOpenBio,
}: {
  idPrefix: string;
  status: SpeakerStatus;
  speakers: Speaker[];
  onOpenBio: (s: Speaker) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `${idPrefix}-status:${status}`, data: { type: "status", status } });
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

// Top section of the shared column: distinguished guests only (category
// "vip"). Kept as its own independently-scrolling block, separate from the
// Speaker Roster below, so the two never compete for the same list.
function VipSection({ speakers, onOpenBio, onCreated }: { speakers: Speaker[]; onOpenBio: (s: Speaker) => void; onCreated: (s: Speaker) => void }) {
  const [formOpen, setFormOpen] = useState(false);
  const [view, setView] = useState<"all" | "status">("all");

  const byStatus = useMemo(() => {
    const map = new Map<SpeakerStatus, Speaker[]>(STATUSES.map((s) => [s, []]));
    for (const sp of speakers) map.get(sp.status)?.push(sp);
    return map;
  }, [speakers]);

  const allSorted = useMemo(() => [...speakers].sort((a, b) => a.name.localeCompare(b.name)), [speakers]);

  const handleSave = async (values: SpeakerFormValues) => {
    onCreated(await createSpeaker(values));
  };

  return (
    <div className="flex flex-col lg:min-h-0 lg:flex-[2]">
      <div className="relative flex flex-shrink-0 items-center gap-2 pr-9">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Distinguished Guests (VIPs)</h2>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{speakers.length}</span>
        <button
          onClick={() => setFormOpen(true)}
          aria-label="Add VIP"
          className="absolute right-0 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-lg font-semibold leading-none text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
        >
          +
        </button>
      </div>

      <div className="my-2 flex flex-shrink-0 flex-wrap gap-1.5">
        <button onClick={() => setView("all")} className={viewButtonClass(view === "all")}>
          All VIPs
        </button>
        <button onClick={() => setView("status")} className={viewButtonClass(view === "status")}>
          By Status
        </button>
      </div>

      <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:[scrollbar-gutter:stable]">
        {view === "all" && (
          <div className="flex flex-col gap-1.5">
            {allSorted.map((s) => (
              <RosterCard key={s.id} speaker={s} onOpenBio={onOpenBio} />
            ))}
            {allSorted.length === 0 && <p className="py-4 text-center text-xs text-zinc-400">No VIPs yet.</p>}
          </div>
        )}

        {view === "status" && (
          <div className="flex flex-col gap-3">
            {STATUSES.map((status) => (
              <StatusSection key={status} idPrefix="vip" status={status} speakers={byStatus.get(status) ?? []} onOpenBio={onOpenBio} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-shrink-0 flex-nowrap gap-1.5 border-t border-zinc-100 pt-2 dark:border-zinc-800">
        <GroupPill id="group:all-vips" label="VIPS" />
      </div>

      <SpeakerFormDialog open={formOpen} speaker={null} defaultCategory="vip" onClose={() => setFormOpen(false)} onSave={handleSave} />
    </div>
  );
}

// Bottom section: moderators + speakers, the people who actually present.
function GuestSection({ speakers, onOpenBio, onCreated }: { speakers: Speaker[]; onOpenBio: (s: Speaker) => void; onCreated: (s: Speaker) => void }) {
  const [formOpen, setFormOpen] = useState(false);
  const [view, setView] = useState<"all" | "status" | "type">("all");

  const byStatus = useMemo(() => {
    const map = new Map<SpeakerStatus, Speaker[]>(STATUSES.map((s) => [s, []]));
    for (const sp of speakers) map.get(sp.status)?.push(sp);
    return map;
  }, [speakers]);

  const byType = useMemo(() => {
    const map = new Map<SpeakerCategory, Speaker[]>(GUEST_TYPES.map((c) => [c, []]));
    for (const sp of speakers) map.get(sp.category)?.push(sp);
    return map;
  }, [speakers]);

  const allSorted = useMemo(() => [...speakers].sort((a, b) => a.name.localeCompare(b.name)), [speakers]);

  const handleSave = async (values: SpeakerFormValues) => {
    onCreated(await createSpeaker(values));
  };

  return (
    <div className="flex flex-col lg:min-h-0 lg:flex-[3]">
      <div className="relative flex flex-shrink-0 items-center gap-2 pr-9">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Speaker Roster</h2>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{speakers.length}</span>
        <button
          onClick={() => setFormOpen(true)}
          aria-label="Add speaker"
          className="absolute right-0 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-lg font-semibold leading-none text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
        >
          +
        </button>
      </div>

      <div className="my-2 flex flex-shrink-0 flex-wrap gap-1.5">
        <button onClick={() => setView("all")} className={viewButtonClass(view === "all")}>
          All Speakers
        </button>
        <button onClick={() => setView("status")} className={viewButtonClass(view === "status")}>
          By Status
        </button>
        <button onClick={() => setView("type")} className={viewButtonClass(view === "type")}>
          By Type
        </button>
      </div>

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
            {STATUSES.map((status) => (
              <StatusSection key={status} idPrefix="speaker" status={status} speakers={byStatus.get(status) ?? []} onOpenBio={onOpenBio} />
            ))}
          </div>
        )}

        {view === "type" && (
          <div className="flex flex-col gap-3">
            {GUEST_TYPES.map((category) => (
              <TypeSection key={category} category={category} speakers={byType.get(category) ?? []} onOpenBio={onOpenBio} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-shrink-0 flex-nowrap gap-1.5 border-t border-zinc-100 pt-2 dark:border-zinc-800">
        <GroupPill id="group:all-moderators" label="MODERATORS" />
        <GroupPill id="group:all-speakers" label="SPEAKERS" />
      </div>

      <SpeakerFormDialog open={formOpen} speaker={null} defaultCategory="speaker" onClose={() => setFormOpen(false)} onSave={handleSave} />
    </div>
  );
}

export function SpeakersPanel({
  speakers,
  onOpenBio,
  onCreated,
}: {
  speakers: Speaker[];
  onOpenBio: (s: Speaker) => void;
  onCreated: (s: Speaker) => void;
}) {
  const vips = useMemo(() => speakers.filter((s) => s.category === "vip"), [speakers]);
  const guests = useMemo(() => speakers.filter((s) => s.category === "moderator" || s.category === "speaker"), [speakers]);

  return (
    <section className="flex flex-col gap-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800 lg:h-full">
      <VipSection speakers={vips} onOpenBio={onOpenBio} onCreated={onCreated} />
      <div className="flex-shrink-0 border-t border-zinc-200 dark:border-zinc-800" />
      <GuestSection speakers={guests} onOpenBio={onOpenBio} onCreated={onCreated} />
    </section>
  );
}
