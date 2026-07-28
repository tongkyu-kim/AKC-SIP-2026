"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Field";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/StatusBadge";
import type { AssignmentKind } from "@/lib/dnd";
import { personLabel, type Speaker } from "@/lib/types";

export function SpeakerBioDialog({
  speaker,
  assignment,
  onClose,
  onEdit,
  onRemoveFromProgram,
}: {
  speaker: Speaker | null;
  // Present only when this popup was opened from a chip already assigned to
  // a session/subsession — enables the "Remove from program" button below,
  // scoped to just that one assignment (never touches the roster record).
  assignment?: { linkId: string; fromKind: AssignmentKind; fromId: string } | null;
  onClose: () => void;
  onEdit?: (speaker: Speaker) => void;
  onRemoveFromProgram?: () => Promise<void>;
}) {
  return (
    <Modal open={!!speaker} onClose={onClose} title="Bio">
      {speaker && (
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            {speaker.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={speaker.photo_url}
                alt={speaker.name}
                className="h-16 w-16 flex-shrink-0 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
              />
            ) : (
              <Avatar speaker={speaker} size="md" />
            )}
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">{speaker.name}</h3>
              {speaker.title_org && <p className="text-sm text-zinc-500 dark:text-zinc-400">{speaker.title_org}</p>}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {speaker.category !== "organizer" && <StatusBadge status={speaker.status} />}
                <span className="text-xs font-medium text-zinc-400">{personLabel(speaker)}</span>
              </div>
            </div>
          </div>

          {speaker.bio ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{speaker.bio}</p>
          ) : (
            <p className="text-sm italic text-zinc-400 dark:text-zinc-500">No bio added yet.</p>
          )}

          {(speaker.email || speaker.phone) && (
            <div className="space-y-1 border-t border-zinc-100 pt-3 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
              {speaker.email && <div>✉️ {speaker.email}</div>}
              {speaker.phone && <div>📞 {speaker.phone}</div>}
            </div>
          )}

          {speaker.notes && (
            <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <span className="font-medium">Internal notes: </span>
              {speaker.notes}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-2">
            <div>
              {assignment && onRemoveFromProgram && (
                <Button variant="danger" onClick={onRemoveFromProgram}>
                  Remove from program
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
              {onEdit && (
                <Button
                  variant="primary"
                  onClick={() => {
                    onEdit(speaker);
                  }}
                >
                  Edit person
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
