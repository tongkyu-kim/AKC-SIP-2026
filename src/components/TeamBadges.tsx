"use client";

// Static markers of which team(s) "stand" on a program — dropped there via a
// GroupPill drag. Deliberately separate from the assigned-people list: this
// is about team accountability, not attendance, so it never references any
// individual speaker record. Programs (top-level sessions) carry teams;
// their items (subsessions) carry people — see AssignedSpeakerChips.
export function TeamBadges({
  teams,
  onRemove,
  emptyLabel,
  isDropTarget,
}: {
  teams: string[];
  onRemove: (label: string) => void;
  emptyLabel?: string;
  isDropTarget?: boolean;
}) {
  return (
    <>
      {teams.map((team) => (
        <span
          key={team}
          className="inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-indigo-700 via-blue-700 to-sky-600 py-0.5 pl-2 pr-1 text-[10px] font-semibold text-white"
        >
          {team}
          <button
            onClick={() => onRemove(team)}
            aria-label={`Remove ${team} from this program`}
            className="rounded-full px-1 leading-none text-white/70 hover:bg-white/20 hover:text-white"
          >
            ×
          </button>
        </span>
      ))}
      {teams.length === 0 && emptyLabel && (
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
