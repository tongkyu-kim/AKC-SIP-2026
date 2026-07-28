"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// A draggable team pill — drag it onto a session/subsession to attach the
// pill itself there as a standalone marker of which team stands on that
// program. It never touches any individual person's assignment. Uses the
// header's blue-violet gradient so it visually reads as a distinct,
// higher-level drag affordance from a person's RosterCard.
export function GroupPill({ id, label }: { id: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { type: "group", label },
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`cursor-grab select-none whitespace-nowrap rounded-full bg-gradient-to-br from-indigo-700 via-blue-700 to-sky-600 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-white shadow-sm hover:shadow active:cursor-grabbing ${
        isDragging ? "z-10 opacity-50" : ""
      }`}
    >
      {label}
    </button>
  );
}
