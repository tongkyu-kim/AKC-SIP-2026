"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Avatar } from "@/components/ui/Avatar";
import type { AssignmentKind } from "@/lib/dnd";
import { CATEGORY_LABEL, STATUS_STYLE, type Speaker, type SpeakerAssignment } from "@/lib/types";

export function SpeakerChip({
  link,
  fromKind,
  fromId,
  onOpenBio,
}: {
  link: SpeakerAssignment & { speaker: Speaker };
  fromKind: AssignmentKind;
  fromId: string;
  onOpenBio: (speaker: Speaker) => void;
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
      onClick={() => onOpenBio(link.speaker)}
      style={{ transform: CSS.Translate.toString(transform) }}
      title={`${CATEGORY_LABEL[link.speaker.category]} · ${link.role} — drag to move, click for bio`}
      className={`inline-flex cursor-grab items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2.5 text-xs ring-1 ring-inset transition-transform hover:scale-105 active:cursor-grabbing ${STATUS_STYLE[link.speaker.status]} ${
        isDragging ? "z-10 opacity-40" : ""
      }`}
    >
      <Avatar speaker={link.speaker} size="xs" />
      <span className="font-medium">{link.speaker.name}</span>
      <span className="flex-shrink-0 opacity-70">{CATEGORY_LABEL[link.speaker.category]}</span>
    </button>
  );
}
