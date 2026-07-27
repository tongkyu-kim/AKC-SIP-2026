"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SessionCard } from "@/components/SessionCard";
import { ChevronIcon } from "@/components/ui/ChevronIcon";
import { ROW_GRID } from "@/lib/layout";
import type { DayWithSessions, Speaker, SessionWithChildren, SubsessionWithSpeakers } from "@/lib/types";

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function DaySection({
  day,
  collapsed,
  onToggleCollapsed,
  collapsedSessionIds,
  onToggleSessionCollapsed,
  onEditSession,
  onAddSession,
  onEditSubsession,
  onAddSubsession,
  onOpenBio,
}: {
  day: DayWithSessions;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  collapsedSessionIds: Set<string>;
  onToggleSessionCollapsed: (sessionId: string) => void;
  onEditSession: (session: SessionWithChildren) => void;
  onAddSession: (dayId: string) => void;
  onEditSubsession: (sub: SubsessionWithSpeakers) => void;
  onAddSubsession: (sessionId: string) => void;
  onOpenBio: (speaker: Speaker) => void;
}) {
  const dateLabel = formatDate(day.event_date);

  return (
    <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div
        className={`flex items-center gap-3 px-4 py-2.5 text-white ${
          day.is_preworkshop ? "bg-gradient-to-r from-sky-400 to-cyan-400" : "bg-gradient-to-r from-indigo-600 to-sky-600"
        }`}
      >
        <button onClick={onToggleCollapsed} className="flex-shrink-0 rounded-md p-1 hover:bg-white/15" aria-label={collapsed ? "Expand day" : "Collapse day"}>
          <ChevronIcon open={!collapsed} />
        </button>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-white/15 text-[11px] font-bold backdrop-blur-sm">
          {day.is_preworkshop ? "PRE" : day.day_order}
        </div>
        <button onClick={onToggleCollapsed} className="min-w-0 flex-1 text-left">
          <h2 className="truncate text-sm font-bold leading-tight">{day.label.replace(/^Day \d+\s*—\s*/, "")}</h2>
          <p className="truncate text-xs text-white/80">
            {dateLabel ?? (day.is_preworkshop ? "Aug.–Sept." : "Dates to be confirmed")}
            {day.subtitle ? ` · ${day.subtitle}` : ""}
            {collapsed ? ` · ${day.sessions.length} session${day.sessions.length === 1 ? "" : "s"}` : ""}
          </p>
        </button>
        <button
          onClick={() => onAddSession(day.id)}
          className="flex-shrink-0 rounded-md bg-white/15 px-2.5 py-1 text-xs font-medium hover:bg-white/25"
        >
          + Session
        </button>
      </div>

      {!collapsed && (
        <>
          <div
            className={`${ROW_GRID} gap-x-3 border-b border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-500`}
          >
            <span />
            <span className="justify-self-center">Time</span>
            <span>Program</span>
            <span>People</span>
            <span />
            <span />
          </div>

          <SortableContext items={day.sessions.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {day.sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  dayId={day.id}
                  collapsed={collapsedSessionIds.has(session.id)}
                  onToggleCollapsed={() => onToggleSessionCollapsed(session.id)}
                  onEditSession={() => onEditSession(session)}
                  onEditSubsession={onEditSubsession}
                  onAddSubsession={() => onAddSubsession(session.id)}
                  onOpenBio={onOpenBio}
                />
              ))}
              {day.sessions.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-zinc-400">No sessions yet — click &ldquo;+ Session&rdquo; to start building this day.</p>
              )}
            </div>
          </SortableContext>
        </>
      )}
    </section>
  );
}
