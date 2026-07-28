"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripIcon } from "@/components/ui/GripIcon";
import { AssignedSpeakerChips } from "@/components/AssignedSpeakerChips";
import { useActiveDragType } from "@/lib/dnd";
import { ROW_GRID, ROW_GRID_LOGISTICS } from "@/lib/layout";
import type { Speaker, SubsessionWithSpeakers } from "@/lib/types";

export function SubsessionRow({
  subsession,
  sessionId,
  wide = false,
  duplicateSpeakerIds,
  onEdit,
  onOpenBio,
}: {
  subsession: SubsessionWithSpeakers;
  sessionId: string;
  wide?: boolean;
  duplicateSpeakerIds?: Set<string>;
  onEdit: () => void;
  onOpenBio: (speaker: Speaker) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id: subsession.id,
    data: { type: "subsession", sessionId },
  });
  const activeDragType = useActiveDragType();
  // Items (subsessions) only accept people now — teams live one level up, on
  // the parent session. See TeamBadges on SessionCard for the mirror rule.
  const isSpeakerDropTarget = isOver && activeDragType === "speaker";
  const rowGrid = wide ? ROW_GRID_LOGISTICS : ROW_GRID;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`${rowGrid} gap-x-3 border-l-4 border-transparent bg-zinc-50/60 px-3 py-2 transition-colors dark:bg-zinc-950/30 ${
        isSpeakerDropTarget ? "bg-sky-50 ring-2 ring-inset ring-sky-300 dark:bg-sky-950/40" : ""
      } ${isDragging ? "relative z-10 opacity-50 shadow-lg" : ""}`}
    >
      <span />
      {subsession.time_range ? (
        <span className="h-fit justify-self-center rounded bg-white px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-zinc-500 ring-1 ring-inset ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700">
          {subsession.time_range}
        </span>
      ) : (
        <span />
      )}

      <div className={subsession.hide_speakers ? "col-span-2 min-w-0 pl-3" : "min-w-0 pl-3"}>
        <button onClick={onEdit} className="text-left text-sm text-zinc-800 hover:text-sky-700 dark:text-zinc-100 dark:hover:text-sky-400">
          {subsession.title}
        </button>
        {subsession.description && <p className="mt-0.5 whitespace-pre-wrap text-xs text-zinc-500 dark:text-zinc-400">{subsession.description}</p>}
      </div>

      {!subsession.hide_speakers && (
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <AssignedSpeakerChips
            links={subsession.speakers}
            fromKind="subsession"
            fromId={subsession.id}
            duplicateSpeakerIds={duplicateSpeakerIds}
            onOpenBio={onOpenBio}
            emptyLabel="Drag here"
            isDropTarget={isSpeakerDropTarget}
          />
        </div>
      )}

      <div className="flex items-start justify-end">
        <button onClick={onEdit} className="rounded px-1.5 py-1 text-[11px] text-zinc-400 hover:bg-zinc-100 hover:text-sky-700 dark:hover:bg-zinc-800 dark:hover:text-sky-400">
          Edit
        </button>
      </div>

      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 flex-shrink-0 cursor-grab touch-none rounded p-0.5 text-zinc-300 hover:bg-black/5 hover:text-zinc-500 active:cursor-grabbing dark:text-zinc-600 dark:hover:bg-white/5 dark:hover:text-zinc-400"
        aria-label="Reorder subsession"
      >
        <GripIcon />
      </button>
    </div>
  );
}
