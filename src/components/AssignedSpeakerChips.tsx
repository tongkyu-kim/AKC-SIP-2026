"use client";

import { SpeakerChip } from "@/components/SpeakerChip";
import type { AssignmentKind } from "@/lib/dnd";
import type { Speaker, SpeakerAssignment } from "@/lib/types";

type Link = SpeakerAssignment & { speaker: Speaker };

// Renders a program's assigned-people list — every assignee gets their own
// chip, always, regardless of how many share a team/category. No merging:
// dragging a team pill onto a program just assigns each of its people
// individually, exactly like dragging them one at a time would.
export function AssignedSpeakerChips({
  links,
  fromKind,
  fromId,
  duplicateSpeakerIds,
  onOpenBio,
  emptyLabel,
  isDropTarget,
}: {
  links: Link[];
  fromKind: AssignmentKind;
  fromId: string;
  duplicateSpeakerIds?: Set<string>;
  onOpenBio: (speaker: Speaker, assignment?: { linkId: string; fromKind: AssignmentKind; fromId: string }) => void;
  emptyLabel: string;
  isDropTarget: boolean;
}) {
  return (
    <>
      {links.map((link) => (
        <SpeakerChip key={link.id} link={link} fromKind={fromKind} fromId={fromId} duplicate={duplicateSpeakerIds?.has(link.speaker_id)} onOpenBio={onOpenBio} />
      ))}
      {links.length === 0 && (
        <span
          className={`rounded-full border border-dashed px-2 py-0.5 text-xs ${
            isDropTarget ? "border-sky-400 text-sky-600 dark:text-sky-400" : "border-zinc-200 text-zinc-400 dark:border-zinc-700 dark:text-zinc-600"
          }`}
        >
          {emptyLabel}
        </span>
      )}
    </>
  );
}
