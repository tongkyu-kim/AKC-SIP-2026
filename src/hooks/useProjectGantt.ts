"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GANTT_PROJECT_ID,
  deleteProjectPhase,
  deleteProjectSubtask,
  deleteProjectTask,
  fetchProjectGantt,
  generateGanttId,
  insertProjectPhase,
  insertProjectSubtask,
  insertProjectTask,
  updateProjectPhase,
  updateProjectSubtask,
  updateProjectTask,
} from "@/lib/api";
import { supabase, supabaseConfigured } from "@/lib/supabase/client";
import type { ProjectPhase, ProjectSubtask, ProjectTask } from "@/lib/types";

const GANTT_TABLES = ["project_phases", "project_tasks", "project_subtasks"] as const;

// Loads + persists the shared Project Charter Gantt data (project_phases/
// project_tasks/project_subtasks, scoped to this workshop's project row) and
// exposes the exact CRUD callback shape ProjectGanttChart expects. Only
// fetches while `enabled` (the popup is open) — no point loading/subscribing
// to a chart nobody's looking at.
export function useProjectGantt(enabled: boolean) {
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [subtasks, setSubtasks] = useState<ProjectSubtask[]>([]);
  const [range, setRange] = useState<{ start: string; end: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  // No separate "loading" flag — before the first successful fetch, `range`
  // is null, which is all a caller needs to show a loading state.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = useCallback(async () => {
    try {
      const data = await fetchProjectGantt();
      setPhases(data.phases);
      setTasks(data.tasks);
      setSubtasks(data.subtasks);
      setRange({ start: data.start_date, end: data.end_date });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load the project timeline");
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // Popup content isn't SSR'd (unlike the rest of the dashboard's initial
    // data), so it needs a real fetch-on-open effect — reload() eventually
    // calls setState, which the newer react-hooks/set-state-in-effect rule
    // flags on principle, but there's no cascading-render risk here: it
    // fires once per `enabled` transition, not on every render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [enabled, reload]);

  useEffect(() => {
    if (!enabled || !supabaseConfigured) return;
    const scheduleReload = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(reload, 250);
    };
    const channel = supabase.channel("gantt-sync");
    for (const table of GANTT_TABLES) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, scheduleReload);
    }
    channel.subscribe();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [enabled, reload]);

  // ---------- phases ----------

  const addPhase = useCallback((title: string): string | null => {
    const trimmed = title.trim();
    if (!trimmed) return null;
    const id = generateGanttId();
    setPhases((prev) => {
      const display_order = prev.length;
      const newPhase: ProjectPhase = {
        id,
        project_id: GANTT_PROJECT_ID,
        title: trimmed,
        display_order,
        collapsed: false,
        created_at: new Date().toISOString(),
      };
      insertProjectPhase(newPhase).catch(() => reload());
      return [...prev, newPhase];
    });
    return id;
  }, [reload]);

  const renamePhase = useCallback((id: string, title: string) => {
    setPhases((prev) => prev.map((p) => (p.id === id ? { ...p, title } : p)));
    updateProjectPhase(id, { title }).catch(() => reload());
  }, [reload]);

  const togglePhase = useCallback((id: string) => {
    setPhases((prev) => {
      const phase = prev.find((p) => p.id === id);
      if (!phase) return prev;
      const collapsed = !phase.collapsed;
      updateProjectPhase(id, { collapsed }).catch(() => reload());
      return prev.map((p) => (p.id === id ? { ...p, collapsed } : p));
    });
  }, [reload]);

  const removePhase = useCallback((id: string) => {
    setPhases((prev) => prev.filter((p) => p.id !== id));
    setTasks((prev) => {
      const doomed = new Set(prev.filter((t) => t.phase_id === id).map((t) => t.id));
      setSubtasks((sPrev) => sPrev.filter((s) => !doomed.has(s.task_id)));
      return prev.filter((t) => t.phase_id !== id);
    });
    deleteProjectPhase(id).catch(() => reload());
  }, [reload]);

  // ---------- tasks ----------

  const addTask = useCallback((phaseId: string, title: string, startDate?: string, endDate?: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const today = new Date();
    const fallbackEnd = new Date(today.getTime() + 6 * 86400000);
    setTasks((prev) => {
      const display_order = prev.filter((t) => t.phase_id === phaseId).length;
      const newTask: ProjectTask = {
        id: generateGanttId(),
        project_id: GANTT_PROJECT_ID,
        phase_id: phaseId,
        title: trimmed,
        description: "",
        owner: "",
        notes: "",
        start_date: startDate ?? today.toISOString().slice(0, 10),
        end_date: endDate ?? fallbackEnd.toISOString().slice(0, 10),
        status: "planned",
        collapsed: false,
        display_order,
        created_at: new Date().toISOString(),
      };
      insertProjectTask(newTask).catch(() => reload());
      return [...prev, newTask];
    });
  }, [reload]);

  const updateTask = useCallback((id: string, updates: Partial<Omit<ProjectTask, "id">>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    updateProjectTask(id, updates).catch(() => reload());
  }, [reload]);

  const reorderTasks = useCallback((orderedIds: string[]) => {
    setTasks((prev) => {
      const orderMap = new Map(orderedIds.map((id, i) => [id, i]));
      return prev.map((t) => (orderMap.has(t.id) ? { ...t, display_order: orderMap.get(t.id)! } : t));
    });
    orderedIds.forEach((id, i) => updateProjectTask(id, { display_order: i }).catch(() => reload()));
  }, [reload]);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === id);
      if (!task) return prev;
      const collapsed = !task.collapsed;
      updateProjectTask(id, { collapsed }).catch(() => reload());
      return prev.map((t) => (t.id === id ? { ...t, collapsed } : t));
    });
  }, [reload]);

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSubtasks((prev) => prev.filter((s) => s.task_id !== id));
    deleteProjectTask(id).catch(() => reload());
  }, [reload]);

  // ---------- subtasks ----------

  const addSubtask = useCallback((taskId: string, title: string, startDate?: string, endDate?: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const today = new Date();
    const fallbackEnd = new Date(today.getTime() + 6 * 86400000);
    setSubtasks((prev) => {
      const display_order = prev.filter((s) => s.task_id === taskId).length;
      const newSubtask: ProjectSubtask = {
        id: generateGanttId(),
        project_id: GANTT_PROJECT_ID,
        task_id: taskId,
        title: trimmed,
        description: "",
        owner: "",
        notes: "",
        start_date: startDate ?? today.toISOString().slice(0, 10),
        end_date: endDate ?? fallbackEnd.toISOString().slice(0, 10),
        status: "planned",
        display_order,
        created_at: new Date().toISOString(),
      };
      insertProjectSubtask(newSubtask).catch(() => reload());
      return [...prev, newSubtask];
    });
  }, [reload]);

  const updateSubtask = useCallback((id: string, updates: Partial<Omit<ProjectSubtask, "id">>) => {
    setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    updateProjectSubtask(id, updates).catch(() => reload());
  }, [reload]);

  const reorderSubtasks = useCallback((orderedIds: string[]) => {
    setSubtasks((prev) => {
      const orderMap = new Map(orderedIds.map((id, i) => [id, i]));
      return prev.map((s) => (orderMap.has(s.id) ? { ...s, display_order: orderMap.get(s.id)! } : s));
    });
    orderedIds.forEach((id, i) => updateProjectSubtask(id, { display_order: i }).catch(() => reload()));
  }, [reload]);

  const removeSubtask = useCallback((id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
    deleteProjectSubtask(id).catch(() => reload());
  }, [reload]);

  return {
    phases,
    tasks,
    subtasks,
    range,
    error,
    addPhase,
    renamePhase,
    togglePhase,
    removePhase,
    addTask,
    updateTask,
    toggleTask,
    removeTask,
    reorderTasks,
    addSubtask,
    updateSubtask,
    removeSubtask,
    reorderSubtasks,
  };
}
