"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Avatar } from "@/components/ui/Avatar";
import type { AssignmentKind } from "@/lib/dnd";
import { personLabel, STATUS_STYLE, type Speaker, type SpeakerAssignment } from "@/lib/types";

// Organizers skip the booking-status workflow — always a plain gray pill
// rather than a status color, since there's no status to reflect.
const ORGANIZER_STYLE = "bg-zinc-100 text-zinc-600 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-600";

export function SpeakerChip({
  link,
  fromKind,
  fromId,
  duplicate = false,
  onOpenBio,
}: {
  link: SpeakerAssignment & { speaker: Speaker };
  fromKind: AssignmentKind;
  fromId: string;
  duplicate?: boolean;
  onOpenBio: (speaker: Speaker, assignment: { linkId: string; fromKind: AssignmentKind; fromId: string }) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `chip:${link.id}`,
    data: {
      type: "speaker",
      source: "assignment",
      speakerId: link.speaker_id,
      status: link.speaker.status,
      linkId: link.id,
      role: link.role,
      fromKind,
      fromId,
    },
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onOpenBio(link.speaker, { linkId: link.id, fromKind, fromId })}
      style={{ transform: CSS.Translate.toString(transform) }}
      title={`${personLabel(link.speaker)} · ${link.role}${duplicate ? " · ⚠ assigned more than once in this program" : ""} — drag to move, click for bio`}
      className={`inline-flex cursor-grab items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2.5 text-xs transition-transform hover:scale-105 active:cursor-grabbing ${
        link.speaker.category === "organizer" ? ORGANIZER_STYLE : STATUS_STYLE[link.speaker.status]
      } ${duplicate ? "ring-2 ring-amber-500 dark:ring-amber-400" : "ring-1 ring-inset"} ${isDragging ? "z-10 opacity-40" : ""}`}
    >
      <Avatar speaker={link.speaker} size="xs" />
      {duplicate && (
        <span className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold leading-none text-white" aria-hidden>
          !
        </span>
      )}
      <span className="font-medium">{link.speaker.name}</span>
      <span className="flex-shrink-0 opacity-70">{personLabel(link.speaker)}</span>
    </button>
  );
}
