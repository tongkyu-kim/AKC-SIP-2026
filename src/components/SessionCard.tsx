"use client";

import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronIcon } from "@/components/ui/ChevronIcon";
import { GripIcon } from "@/components/ui/GripIcon";
import { TeamBadges } from "@/components/TeamBadges";
import { SubsessionRow } from "@/components/SubsessionRow";
import { FlightRow } from "@/components/FlightRow";
import { useActiveDragType, type AssignmentKind } from "@/lib/dnd";
import { ROW_GRID, ROW_GRID_LOGISTICS } from "@/lib/layout";
import { SESSION_TYPE_BORDER, SESSION_TYPE_LABEL, SESSION_TYPE_META, type Speaker, type SessionWithChildren, type SubsessionWithSpeakers } from "@/lib/types";

function formatTime(session: SessionWithChildren) {
  if (session.display_time) return session.display_time;
  if (session.start_time && session.end_time) return `${session.start_time}–${session.end_time}`;
  return session.start_time ?? "";
}

function formatSessionDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function SessionCard({
  session,
  dayId,
  collapsed,
  onToggleCollapsed,
  onEditSession,
  onEditSubsession,
  onAddSubsession,
  onOpenBio,
  onRemoveTeam,
}: {
  session: SessionWithChildren;
  dayId: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onEditSession: () => void;
  onEditSubsession: (sub: SubsessionWithSpeakers) => void;
  onAddSubsession: () => void;
  onOpenBio: (speaker: Speaker) => void;
  onRemoveTeam: (kind: AssignmentKind, id: string, label: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id: session.id,
    data: { type: "session", dayId },
  });
  const activeDragType = useActiveDragType();
  // The program (top-level session) row only accepts team pills now — actual
  // people live one level down, on its items (subsessions). See
  // AssignedSpeakerChips for the mirror-image rule on SubsessionRow/FlightRow.
  const isTeamDropTarget = isOver && activeDragType === "group";

  const meta = SESSION_TYPE_META[session.session_type];
  const time = formatTime(session);
  const dateLabel = formatSessionDate(session.event_date);
  const hasSubsessions = session.subsessions.length > 0;
  const showSubsessions = hasSubsessions && !collapsed;
  const rowGrid = session.session_type === "logistics" ? ROW_GRID_LOGISTICS : ROW_GRID;

  // Flags anyone who appears more than once across this program's items (a
  // passenger dragged onto two flights by mistake, say) so it's easy to spot
  // instead of silently doubling up.
  const occurrences = new Map<string, number>();
  for (const sub of session.subsessions) {
    for (const link of sub.speakers) occurrences.set(link.speaker_id, (occurrences.get(link.speaker_id) ?? 0) + 1);
  }
  const duplicateSpeakerIds = new Set([...occurrences].filter(([, count]) => count > 1).map(([id]) => id));

  return (
    <>
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        className={`${rowGrid} gap-x-3 border-l-4 bg-white px-3 py-2.5 transition-colors dark:bg-zinc-900 ${SESSION_TYPE_BORDER[session.session_type]} ${
          isTeamDropTarget ? "bg-sky-50 ring-2 ring-inset ring-sky-300 dark:bg-sky-950/40" : ""
        } ${isDragging ? "relative z-20 opacity-60 shadow-lg" : ""}`}
      >
        {hasSubsessions ? (
          <button
            onClick={onToggleCollapsed}
            className="mt-0.5 flex-shrink-0 rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label={collapsed ? "Expand items" : "Collapse items"}
          >
            <ChevronIcon open={!collapsed} />
          </button>
        ) : (
          <span />
        )}

        {time || dateLabel ? (
          <div className={`flex h-fit flex-col items-center justify-self-center gap-0 rounded px-1.5 py-1 text-center leading-tight ${meta.time}`}>
            {dateLabel && <span className="text-[10px] font-semibold">{dateLabel}</span>}
            {time && <span className="text-[10px] font-medium tabular-nums opacity-90">{time}</span>}
          </div>
        ) : (
          <span />
        )}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={onEditSession} className="text-left text-sm font-bold text-zinc-900 hover:text-sky-700 dark:text-zinc-100 dark:hover:text-sky-400">
              {session.title}
            </button>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${meta.badge}`}>{SESSION_TYPE_LABEL[session.session_type]}</span>
          </div>
          {session.description && <p className="mt-1 whitespace-pre-wrap text-xs text-zinc-500 dark:text-zinc-400">{session.description}</p>}
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <TeamBadges
            teams={session.teams ?? []}
            onRemove={(label) => onRemoveTeam("session", session.id, label)}
            emptyLabel="Drag team here"
            isDropTarget={isTeamDropTarget}
          />
        </div>

        <div className="flex items-start justify-end gap-1">
          <button onClick={onAddSubsession} className="rounded px-1.5 py-1 text-[11px] font-medium text-sky-700 hover:bg-sky-100 dark:text-sky-400 dark:hover:bg-sky-950">
            + Item
          </button>
          <button onClick={onEditSession} className="rounded px-1.5 py-1 text-[11px] text-zinc-400 hover:bg-zinc-100 hover:text-sky-700 dark:hover:bg-zinc-800 dark:hover:text-sky-400">
            Edit
          </button>
        </div>

        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 flex-shrink-0 cursor-grab touch-none rounded p-0.5 text-zinc-300 hover:bg-black/5 hover:text-zinc-500 active:cursor-grabbing dark:text-zinc-600 dark:hover:bg-white/5 dark:hover:text-zinc-400"
          aria-label="Reorder session"
        >
          <GripIcon />
        </button>
      </div>

      {showSubsessions && (
        <SortableContext items={session.subsessions.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {session.subsessions.map((sub) =>
            sub.kind === "flight" ? (
              <FlightRow
                key={sub.id}
                subsession={sub}
                sessionId={session.id}
                wide={session.session_type === "logistics"}
                duplicateSpeakerIds={duplicateSpeakerIds}
                onEdit={() => onEditSubsession(sub)}
                onOpenBio={onOpenBio}
              />
            ) : (
              <SubsessionRow
                key={sub.id}
                subsession={sub}
                sessionId={session.id}
                wide={session.session_type === "logistics"}
                duplicateSpeakerIds={duplicateSpeakerIds}
                onEdit={() => onEditSubsession(sub)}
                onOpenBio={onOpenBio}
              />
            ),
          )}
        </SortableContext>
      )}
    </>
  );
}
