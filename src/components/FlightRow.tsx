"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripIcon } from "@/components/ui/GripIcon";
import { SpeakerChip } from "@/components/SpeakerChip";
import { useActiveDragType } from "@/lib/dnd";
import { ROW_GRID } from "@/lib/layout";
import type { Speaker, SubsessionWithSpeakers } from "@/lib/types";

const timePillClass =
  "rounded bg-white px-1.5 py-0.5 text-[10px] font-medium tabular-nums ring-1 ring-inset ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700";

export function FlightRow({
  subsession,
  sessionId,
  onEdit,
  onOpenBio,
}: {
  subsession: SubsessionWithSpeakers;
  sessionId: string;
  onEdit: () => void;
  onOpenBio: (speaker: Speaker) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id: subsession.id,
    data: { type: "subsession", sessionId },
  });
  const activeDragType = useActiveDragType();
  const isSpeakerDropTarget = isOver && activeDragType === "speaker";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`${ROW_GRID} gap-x-3 border-l-4 border-indigo-400/70 bg-indigo-50/40 px-3 py-2 transition-colors dark:bg-indigo-950/10 ${
        isSpeakerDropTarget ? "bg-sky-50 ring-2 ring-inset ring-sky-300 dark:bg-sky-950/40" : ""
      } ${isDragging ? "relative z-10 opacity-50 shadow-lg" : ""}`}
    >
      <span />
      <div className="flex flex-col items-center justify-self-center gap-0.5">
        {subsession.departure_time && <span className={timePillClass}>{subsession.departure_time}</span>}
        {subsession.arrival_time && <span className={timePillClass}>{subsession.arrival_time}</span>}
        {!subsession.departure_time && !subsession.arrival_time && <span className="text-xs text-zinc-300 dark:text-zinc-600">—</span>}
      </div>

      <div className="min-w-0 pl-3">
        <div className="flex flex-wrap items-baseline gap-2">
          <button onClick={onEdit} className="text-left text-sm font-bold text-zinc-900 hover:text-sky-700 dark:text-zinc-100 dark:hover:text-sky-400">
            {subsession.flight_code || subsession.title || "Flight"}
          </button>
          <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">Flight</span>
        </div>
        <div className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
          {subsession.departure_airport || "Departure airport"}
          <span className="mx-1.5 text-zinc-400">→</span>
          {subsession.arrival_city || "Arrival city"}
        </div>
        {subsession.description && <p className="mt-0.5 whitespace-pre-wrap text-xs text-zinc-500 dark:text-zinc-400">{subsession.description}</p>}
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        {subsession.speakers.map((link) => (
          <SpeakerChip key={link.id} link={link} fromKind="subsession" fromId={subsession.id} onOpenBio={onOpenBio} />
        ))}
        {subsession.speakers.length === 0 && (
          <span className={`rounded-full border border-dashed px-2 py-0.5 text-xs ${isSpeakerDropTarget ? "border-sky-400 text-sky-600 dark:text-sky-400" : "border-zinc-200 text-zinc-400 dark:border-zinc-700 dark:text-zinc-600"}`}>
            Drag passengers here
          </span>
        )}
      </div>

      <div className="flex items-start justify-end">
        <button onClick={onEdit} className="rounded px-1.5 py-1 text-[11px] text-zinc-400 hover:bg-zinc-100 hover:text-sky-700 dark:hover:bg-zinc-800 dark:hover:text-sky-400">
          Edit
        </button>
      </div>

      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 flex-shrink-0 cursor-grab touch-none rounded p-0.5 text-zinc-300 hover:bg-black/5 hover:text-zinc-500 active:cursor-grabbing dark:text-zinc-600 dark:hover:bg-white/5 dark:hover:text-zinc-400"
        aria-label="Reorder flight"
      >
        <GripIcon />
      </button>
    </div>
  );
}
