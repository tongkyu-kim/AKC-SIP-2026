"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Avatar } from "@/components/ui/Avatar";
import { STATUS_BORDER, type Speaker } from "@/lib/types";

// A draggable roster card — used both by the Speaker Roster (grouped by
// status) and the Participant Roster (grouped by country). Always draggable
// as type "speaker"/"roster" regardless of which panel it's sitting in, so it
// can be dropped onto a session/subsession row exactly the same way.
export function RosterCard({ speaker, onOpenBio }: { speaker: Speaker; onOpenBio: (s: Speaker) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: speaker.id,
    data: { type: "speaker", source: "roster", speakerId: speaker.id, status: speaker.status },
  });

  // Organizers skip the booking-status workflow — always a plain gray
  // border rather than a status color, since there's no status to reflect.
  const borderClass = speaker.category === "organizer" ? "border-zinc-300 dark:border-zinc-600" : STATUS_BORDER[speaker.status];

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onOpenBio(speaker)}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`flex w-full cursor-grab select-none items-center gap-2 rounded-lg border-l-2 bg-white py-2 pl-2 pr-2.5 text-left text-sm shadow-sm hover:shadow active:cursor-grabbing dark:bg-zinc-900 ${borderClass} ${
        isDragging ? "z-10 opacity-40" : ""
      }`}
    >
      <Avatar speaker={speaker} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-zinc-900 dark:text-zinc-100">{speaker.name}</div>
        {speaker.title_org && <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">{speaker.title_org}</div>}
      </div>
    </button>
  );
}
