"use client";

import { useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { ProjectGanttChart } from "@/components/ProjectGanttChart";
import { useProjectGantt } from "@/hooks/useProjectGantt";

// Same phase-band color AKC-TIU's own CATEGORY_MAP uses for the
// "innovation-program" category, so the Gantt's phase bands match the color
// that project wears everywhere else in the TIU dashboard.
const INNOVATION_PROGRAM_COLOR = { bg: "#A0C4E2", pillBg: "#DBE9F4", text: "#3D4A56" };

export function ProjectGanttPopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  const gantt = useProjectGantt(open);

  // ProjectGanttChart re-centers the timeline whenever fiscalYearStart/End
  // change (by reference). Building `new Date(...)` inline on every render
  // handed it a fresh object on every render — including every task edit,
  // since that re-renders this popup too — so it kept re-centering on any
  // change anywhere in the chart. Memoizing on the underlying date *strings*
  // (not the `range` object, which is a new reference on every reload even
  // when the dates are unchanged) keeps the same Date instance across
  // reloads unless the range actually changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fiscalYearStart = useMemo(() => (gantt.range ? new Date(`${gantt.range.start}T00:00:00`) : null), [gantt.range?.start]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fiscalYearEnd = useMemo(() => (gantt.range ? new Date(`${gantt.range.end}T00:00:00`) : null), [gantt.range?.end]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative flex h-[90vh] w-[95vw] max-w-[1800px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-cell-border px-5 py-3.5">
          <h2 className="text-base font-semibold text-foreground">Project Timeline</h2>
          <button onClick={onClose} className="flex-shrink-0 rounded-full p-1.5 text-text-secondary hover:bg-hover hover:text-foreground" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-4">
          {!gantt.range && !gantt.error && <p className="py-10 text-center text-sm text-text-secondary">Loading project timeline…</p>}
          {gantt.error && <p className="py-2 text-center text-xs text-apple-red">{gantt.error}</p>}
          {gantt.range && fiscalYearStart && fiscalYearEnd && (
            <ProjectGanttChart
              phases={gantt.phases}
              tasks={gantt.tasks}
              subtasks={gantt.subtasks}
              fiscalYearStart={fiscalYearStart}
              fiscalYearEnd={fiscalYearEnd}
              color={INNOVATION_PROGRAM_COLOR}
              onAddPhase={gantt.addPhase}
              onRenamePhase={gantt.renamePhase}
              onTogglePhase={gantt.togglePhase}
              onDeletePhase={gantt.removePhase}
              onAddTask={gantt.addTask}
              onUpdateTask={gantt.updateTask}
              onToggleTask={gantt.toggleTask}
              onDeleteTask={gantt.removeTask}
              onReorderTasks={gantt.reorderTasks}
              onAddSubtask={gantt.addSubtask}
              onUpdateSubtask={gantt.updateSubtask}
              onDeleteSubtask={gantt.removeSubtask}
              onReorderSubtasks={gantt.reorderSubtasks}
            />
          )}
        </div>
      </div>
    </div>
  );
}
