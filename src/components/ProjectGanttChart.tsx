'use client'

// Ported from the AKC-TIU dashboard's src/components/ProjectGanttChart.tsx
// (same design language, same drag-to-move/resize/create interactions) so
// this workshop's shared Project Charter Gantt looks and behaves identically
// to the source dashboard. Only the `cn`/type imports below were adapted to
// this app's layout — the rest is intentionally left as close to the
// original as possible so future updates can be diffed against the source.
//
// The mutual useCallback recursion (handleDragMove/handleDragEnd,
// handleCreateDragMove/handleCreateDragEnd) and the mid-render ref reads
// (dragInfoRef/createDragInfoRef, forced to re-render via the `dragTick`
// counter) are deliberate in the source component — real-time drag feedback
// without a re-render on every mousemove. This app's eslint-config-next pulls
// in newer react-hooks rules (immutability/refs) that flag exactly that
// pattern; disabling them here rather than restructuring avoids risking the
// drag interactions during a otherwise-mechanical port.
/* eslint-disable react-hooks/immutability, react-hooks/refs */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  endOfMonth,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ChevronDown, ChevronRight, Plus, Trash2, X } from 'lucide-react'
import clsx, { type ClassValue } from 'clsx'
import type { ProjectPhase, ProjectTask, ProjectSubtask, TaskStatus } from '@/lib/types'

function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// ─── Constants ────────────────────────────────────────────────────────────────

type ZoomLevel = 'day' | 'week' | 'month'
const PX_PER_DAY: Record<ZoomLevel, number> = { day: 36, week: 14, month: 4.6 }
const PHASE_ROW_H = 36
const TASK_ROW_H = 32
const PHASE_SHADE = '#f8f8f8' // same shade used for weekend columns on the month/week calendar
const PHASE_LINE_H = 3 // the phase band's center line
const PHASE_TICK_H = 20 // end-cap ticks + the center "Phase n" badge, all the same height
// The right (timeline) panel scrolls both axes in one element, so its
// horizontal scrollbar eats into its own vertical viewport — the left
// (hierarchy) panel only scrolls vertically and has no such loss. Without
// compensating, the two panels' clientHeight differ by this amount, so a
// scrollTop synced 1:1 between them shows a different row at the bottom of
// each once you scroll far down (bars appear to creep upward relative to
// their row labels). Matches the 8px `::-webkit-scrollbar { height }` set
// globally in this app's globals.css.
const SCROLLBAR_COMPENSATION = 8

const STATUS_STYLES: Record<TaskStatus, { fill: string; label: string }> = {
  planned: { fill: '#B9BEC7', label: 'Planned' },
  'in-progress': { fill: '#2596BE', label: 'In progress' },
  completed: { fill: '#34A853', label: 'Completed' },
}
// Planned bars stay full-strength; in-progress/completed are toned down
// ~30% so a Gantt full of finished work doesn't out-shout the phase bands
// (which now render at full category color instead of a faint tint).
const STATUS_OPACITY: Record<TaskStatus, number> = {
  planned: 1,
  'in-progress': 0.7,
  completed: 0.7,
}

// A task or subtask bar — the fields the timeline actually renders/edits.
// ProjectTask and ProjectSubtask both satisfy this shape structurally.
interface TimelineItem {
  id: string
  title: string
  description: string
  owner: string
  notes: string
  start_date: string
  end_date: string
  status: TaskStatus
}

// ─── Date/column helpers ──────────────────────────────────────────────────────

// The timeline always spans six months before the fiscal year through six
// months after it (so a project's full FY is always in view, and there's
// room to scroll into the surrounding months to plan/schedule wrap-up or
// lead-in work) — not just "whenever a task happens to already sit out
// there," since the whole point of the buffer is to have room to create
// the first task in it. Only grows further if an existing task/subtask
// somehow falls outside even that, so real data is never clipped. Same
// range at every zoom level: day/week zoom just means more horizontal
// scrolling within it.
function computeRange(items: TimelineItem[], fiscalYearStart: Date, fiscalYearEnd: Date) {
  let start = addMonths(fiscalYearStart, -6)
  let end = addMonths(fiscalYearEnd, 6)
  for (const t of items) {
    const s = parseISO(t.start_date)
    const e = parseISO(t.end_date)
    if (s < start) start = s
    if (e > end) end = e
  }
  return { start, end }
}

interface Column { key: string; label: string; date: Date; days: number }

function buildColumns(rangeStart: Date, rangeEnd: Date, zoom: ZoomLevel): Column[] {
  const cols: Column[] = []
  if (zoom === 'month') {
    let cursor = startOfMonth(rangeStart)
    while (cursor <= rangeEnd) {
      const days = endOfMonth(cursor).getDate()
      cols.push({ key: format(cursor, 'yyyy-MM'), label: format(cursor, 'MMM yyyy'), date: cursor, days })
      cursor = addMonths(cursor, 1)
    }
  } else if (zoom === 'week') {
    let cursor = startOfWeek(rangeStart, { weekStartsOn: 1 })
    while (cursor <= rangeEnd) {
      cols.push({ key: format(cursor, 'yyyy-MM-dd'), label: format(cursor, 'MMM d'), date: cursor, days: 7 })
      cursor = addWeeks(cursor, 1)
    }
  } else {
    let cursor = rangeStart
    while (cursor <= rangeEnd) {
      cols.push({ key: format(cursor, 'yyyy-MM-dd'), label: format(cursor, 'd'), date: cursor, days: 1 })
      cursor = addDays(cursor, 1)
    }
  }
  return cols
}

// Groups consecutive day-columns by month, for the day-view's month super-header.
function groupByMonth(cols: Column[]) {
  const groups: { label: string; days: number }[] = []
  for (const c of cols) {
    const label = format(c.date, 'MMM yyyy')
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.days += c.days
    else groups.push({ label, days: c.days })
  }
  return groups
}

// ─── Row model ────────────────────────────────────────────────────────────────

type Row =
  | { kind: 'phase'; phase: ProjectPhase; tasks: ProjectTask[]; phaseIndex: number }
  | { kind: 'task'; phase: ProjectPhase; task: ProjectTask; subtasks: ProjectSubtask[]; phaseIndex: number }
  | { kind: 'subtask'; phase: ProjectPhase; task: ProjectTask; subtask: ProjectSubtask; phaseIndex: number }

// Row order is purely display_order — never the item's own dates. A task
// keeps its row permanently until a user drags it somewhere else; editing
// its start/end date must never reshuffle the list.
function buildRows(phases: ProjectPhase[], tasks: ProjectTask[], subtasks: ProjectSubtask[]): Row[] {
  const rows: Row[] = []
  const sortedPhases = [...phases].sort((a, b) => a.display_order - b.display_order)
  sortedPhases.forEach((phase, phaseIndex) => {
    const phaseTasks = tasks
      .filter(t => t.phase_id === phase.id)
      .sort((a, b) => a.display_order - b.display_order)
    rows.push({ kind: 'phase', phase, tasks: phaseTasks, phaseIndex })
    if (!phase.collapsed) {
      for (const task of phaseTasks) {
        const taskSubtasks = subtasks
          .filter(s => s.task_id === task.id)
          .sort((a, b) => a.display_order - b.display_order)
        rows.push({ kind: 'task', phase, task, subtasks: taskSubtasks, phaseIndex })
        if (!task.collapsed) {
          for (const subtask of taskSubtasks) rows.push({ kind: 'subtask', phase, task, subtask, phaseIndex })
        }
      }
    }
  })
  return rows
}

function rowHeight(row: Row) {
  return row.kind === 'phase' ? PHASE_ROW_H : TASK_ROW_H
}

// ─── Hover tooltip ────────────────────────────────────────────────────────────

function ItemTooltip({ item, x, y }: { item: TimelineItem; x: number; y: number }) {
  const days = differenceInCalendarDays(parseISO(item.end_date), parseISO(item.start_date)) + 1
  const style = STATUS_STYLES[item.status]
  // Bars in the bottom half of the viewport flip the tooltip to sit above
  // the cursor instead of below it — otherwise it renders off the bottom
  // edge (or the container's own bottom edge) and is effectively invisible
  // for every row down there, which is worse than the tighter fit up top.
  const flipUp = y > window.innerHeight * 0.55
  const verticalStyle = flipUp ? { bottom: window.innerHeight - y + 14 } : { top: y + 14 }
  return (
    <div
      className="fixed z-[200] w-64 rounded-xl border border-cell-border bg-white shadow-xl p-3 pointer-events-none"
      style={{ left: Math.min(x + 14, window.innerWidth - 272), ...verticalStyle }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: style.fill }} />
        <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
      </div>
      {item.description && <p className="text-xs text-text-secondary mb-1.5 line-clamp-3">{item.description}</p>}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
        <span className="text-text-tertiary">Owner</span>
        <span className="text-foreground truncate">{item.owner || '—'}</span>
        <span className="text-text-tertiary">Start</span>
        <span className="text-foreground">{format(parseISO(item.start_date), 'MMM d, yyyy')}</span>
        <span className="text-text-tertiary">End</span>
        <span className="text-foreground">{format(parseISO(item.end_date), 'MMM d, yyyy')}</span>
        <span className="text-text-tertiary">Duration</span>
        <span className="text-foreground">{days} day{days === 1 ? '' : 's'}</span>
        <span className="text-text-tertiary">Status</span>
        <span className="text-foreground">{style.label}</span>
      </div>
      {item.notes && (
        <p className="text-[11px] text-text-tertiary mt-1.5 pt-1.5 border-t border-cell-border line-clamp-2">{item.notes}</p>
      )}
    </div>
  )
}

// ─── Item detail panel (shared by tasks and subtasks) ────────────────────────

function ItemDetailPanel({
  item,
  parentLabel,
  parentValue,
  parentOptions,
  onSave,
  onDelete,
  onClose,
}: {
  item: TimelineItem
  parentLabel: string
  parentValue: string
  parentOptions: { id: string; title: string }[]
  onSave: (updates: Omit<TimelineItem, 'id'> & { parentId: string }) => void
  onDelete: () => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState({ ...item, parentId: parentValue })

  const save = () => {
    onSave({
      title: draft.title.trim() || item.title,
      owner: draft.owner,
      status: draft.status,
      start_date: draft.start_date,
      end_date: draft.end_date < draft.start_date ? draft.start_date : draft.end_date,
      description: draft.description,
      notes: draft.notes,
      parentId: draft.parentId,
    })
    onClose()
  }

  const inputCls = 'w-full text-sm px-2.5 py-1.5 rounded-lg border border-cell-border focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue bg-white'
  const labelCls = 'text-[10px] font-semibold text-text-secondary uppercase tracking-wide mb-1 block'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] w-[46.8rem] max-w-[92vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 rounded-t-2xl" style={{ backgroundColor: STATUS_STYLES[draft.status].fill }} />
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <input
              autoFocus
              value={draft.title}
              onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))}
              placeholder="Title"
              className="flex-1 min-w-0 text-base font-semibold px-2 py-1 -mx-2 rounded-lg border border-transparent hover:border-cell-border focus:outline-none focus:border-apple-blue"
            />
            <button onClick={onClose} className="text-text-secondary hover:text-foreground flex-shrink-0"><X size={16} /></button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={labelCls}>{parentLabel}</label>
              <select
                value={draft.parentId}
                onChange={(e) => setDraft(d => ({ ...d, parentId: e.target.value }))}
                className={cn(inputCls, 'bg-white')}
              >
                {parentOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.title}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select
                value={draft.status}
                onChange={(e) => setDraft(d => ({ ...d, status: e.target.value as TaskStatus }))}
                className={cn(inputCls, 'bg-white')}
              >
                {(Object.keys(STATUS_STYLES) as TaskStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_STYLES[s].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Start date</label>
              <input
                type="date"
                value={draft.start_date}
                onChange={(e) => setDraft(d => ({ ...d, start_date: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>End date</label>
              <input
                type="date"
                value={draft.end_date}
                min={draft.start_date}
                onChange={(e) => setDraft(d => ({ ...d, end_date: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Owner</label>
              <input
                value={draft.owner}
                onChange={(e) => setDraft(d => ({ ...d, owner: e.target.value }))}
                placeholder="Unassigned"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))}
              placeholder="What is this about…"
              rows={2}
              className={cn(inputCls, 'resize-none')}
            />
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea
              value={draft.notes}
              onChange={(e) => setDraft(d => ({ ...d, notes: e.target.value }))}
              placeholder="Additional notes…"
              rows={2}
              className={cn(inputCls, 'resize-none')}
            />
          </div>

          <div className="flex gap-2 mt-1">
            <button
              onClick={onDelete}
              className="p-2 rounded-xl border border-red-200 text-apple-red hover:bg-red-50 transition-colors flex-shrink-0"
              title="Delete"
            >
              <Trash2 size={15} />
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 text-sm rounded-xl border border-cell-border text-foreground hover:bg-hover transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!draft.title.trim()}
              className="flex-1 py-2 text-sm rounded-xl font-medium bg-apple-blue text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Drag state (move / resize task & subtask bars) ──────────────────────────

interface DragInfo {
  itemId: string
  itemType: 'task' | 'subtask'
  mode: 'move' | 'start' | 'end'
  startX: number
  origStart: Date
  origEnd: Date
  draftStart: Date
  draftEnd: Date
  moved: boolean
}

// Drag-to-create: mousedown on empty canvas (not on a bar) starts tracking
// a date range against whichever row it lands on — a phase row creates a
// task, a task/subtask row creates a subtask under that task, and blank
// space below every row (including the visualization-only filler rows)
// creates a brand-new phase seeded with a first task spanning the dragged
// range — mirroring the month calendar's click-or-drag-to-select convention.
interface CreateDragInfo {
  kind: 'task' | 'subtask' | 'phase'
  targetId: string // phaseId for a new task, taskId for a new subtask, unused for a new phase
  rowTop: number
  rowHeight: number
  anchorDate: Date
  draftDate: Date
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProjectGanttChart({
  phases,
  tasks,
  subtasks,
  fiscalYearStart,
  fiscalYearEnd,
  color,
  onAddPhase,
  onRenamePhase,
  onTogglePhase,
  onDeletePhase,
  onAddTask,
  onUpdateTask,
  onToggleTask,
  onDeleteTask,
  onReorderTasks,
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onReorderSubtasks,
}: {
  phases: ProjectPhase[]
  tasks: ProjectTask[]
  subtasks: ProjectSubtask[]
  fiscalYearStart: Date
  fiscalYearEnd: Date
  color: { bg: string; pillBg: string; text: string }
  onAddPhase: (title: string) => string | null
  onRenamePhase: (id: string, title: string) => void
  onTogglePhase: (id: string) => void
  onDeletePhase: (id: string) => void
  onAddTask: (phaseId: string, title: string, startDate?: string, endDate?: string) => void
  onUpdateTask: (id: string, updates: Partial<Omit<ProjectTask, 'id'>>) => void
  onToggleTask: (id: string) => void
  onDeleteTask: (id: string) => void
  onReorderTasks: (orderedIds: string[]) => void
  onAddSubtask: (taskId: string, title: string, startDate?: string, endDate?: string) => void
  onUpdateSubtask: (id: string, updates: Partial<Omit<ProjectSubtask, 'id'>>) => void
  onDeleteSubtask: (id: string) => void
  onReorderSubtasks: (orderedIds: string[]) => void
}) {
  const [zoom, setZoom] = useState<ZoomLevel>('week')
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null)
  const [selectedSubtask, setSelectedSubtask] = useState<ProjectSubtask | null>(null)
  const [hover, setHover] = useState<{ item: TimelineItem; x: number; y: number } | null>(null)
  const [addingPhase, setAddingPhase] = useState(false)
  const [newPhaseTitle, setNewPhaseTitle] = useState('')
  const [pendingPhaseDates, setPendingPhaseDates] = useState<{ start: string; end: string } | null>(null)
  const [addingTaskFor, setAddingTaskFor] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [pendingTaskDates, setPendingTaskDates] = useState<{ start: string; end: string } | null>(null)
  const [addingSubtaskFor, setAddingSubtaskFor] = useState<string | null>(null)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [pendingSubtaskDates, setPendingSubtaskDates] = useState<{ start: string; end: string } | null>(null)
  const [renamingPhase, setRenamingPhase] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [confirmDeletePhase, setConfirmDeletePhase] = useState<string | null>(null)
  const [, setDragTick] = useState(0)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [taskDropTargetId, setTaskDropTargetId] = useState<string | null>(null)
  const [draggedSubtaskId, setDraggedSubtaskId] = useState<string | null>(null)
  const [subtaskDropTargetId, setSubtaskDropTargetId] = useState<string | null>(null)
  const [tierMenuOpen, setTierMenuOpen] = useState(false)
  const tierMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tierMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (tierMenuRef.current && !tierMenuRef.current.contains(e.target as Node)) setTierMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [tierMenuOpen])

  const leftScrollRef = useRef<HTMLDivElement>(null)
  const rightScrollRef = useRef<HTMLDivElement>(null)
  const headerScrollRef = useRef<HTMLDivElement>(null)
  const syncingRef = useRef<'left' | 'right' | null>(null)
  const dragInfoRef = useRef<DragInfo | null>(null)
  const createDragInfoRef = useRef<CreateDragInfo | null>(null)
  const canvasLeftRef = useRef(0)
  const [containerHeight, setContainerHeight] = useState(320)
  // offsetHeight - clientHeight is exactly the horizontal scrollbar's
  // rendered height (0 if it's not currently showing) — measured rather
  // than hardcoded, since the OS/browser's actual thickness for our
  // `::-webkit-scrollbar { height: 8px }` rule isn't guaranteed to render
  // at precisely 8 device-independent pixels everywhere.
  const [scrollbarHeight, setScrollbarHeight] = useState(SCROLLBAR_COMPENSATION)

  useEffect(() => {
    const el = rightScrollRef.current
    if (!el) return
    const measure = () => {
      setContainerHeight(el.clientHeight)
      setScrollbarHeight(el.offsetHeight - el.clientHeight)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // The right canvas's scrollable height used to be approximated as
  // bodyHeight + a hardcoded buffer meant to match the left panel's trailing
  // "+ Add phase" row — close, but not exact, so the two panels' actual max
  // scrollTop differed by a few px and the sync would clamp one before the
  // other right at the bottom (bars drifting from their row labels only once
  // scrolled all the way down). Measuring the left panel's real scrollHeight
  // and using it directly removes the guesswork — the two are now
  // byte-for-byte the same number, not just close.
  const [leftContentHeight, setLeftContentHeight] = useState(0)
  // No dependency array on purpose — this re-measures after every render so
  // it stays correct as rows/phases/the "add phase" input come and go. Safe
  // from an infinite loop: once the measured value stops changing, the
  // setState call is a no-op (same number) and React bails out without
  // re-rendering.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = leftScrollRef.current
    if (!el) return
    setLeftContentHeight(el.scrollHeight)
  })

  const pxPerDay = PX_PER_DAY[zoom]
  const allItems = useMemo(() => [...tasks, ...subtasks], [tasks, subtasks])
  const { start: rangeStart, end: rangeEnd } = useMemo(
    () => computeRange(allItems, fiscalYearStart, fiscalYearEnd),
    [allItems, fiscalYearStart, fiscalYearEnd],
  )
  const columns = useMemo(() => buildColumns(rangeStart, rangeEnd, zoom), [rangeStart, rangeEnd, zoom])
  const timelineStart = columns[0]?.date ?? rangeStart
  const monthGroups = useMemo(() => (zoom === 'day' ? groupByMonth(columns) : null), [zoom, columns])
  // Single source of truth for column x-positions — computed once here and
  // used for the header cells, the vertical grid lines, and the month-group
  // super-header alike, so nothing can drift out of alignment the way
  // independently flexbox-rendered header cells and separately-computed
  // grid-line positions could.
  // Positions are rounded to whole pixels as they accumulate (not just at
  // the end) so the running cursor never carries a fractional remainder —
  // important at month zoom, where pxPerDay (4.6) makes every column width
  // fractional. Whole-pixel values mean the header's separator lines and
  // the body's grid lines, even though drawn as separate elements, land on
  // the exact same device pixel instead of drifting by a rounded fraction.
  const columnPositions = useMemo(() => {
    let cursor = 0
    return columns.map(c => {
      const left = Math.round(cursor)
      cursor += c.days * pxPerDay
      const width = Math.round(cursor) - left
      return { ...c, left, width }
    })
  }, [columns, pxPerDay])
  const monthGroupPositions = useMemo(() => {
    if (!monthGroups) return null
    let cursor = 0
    return monthGroups.map(g => {
      const left = Math.round(cursor)
      cursor += g.days * pxPerDay
      const width = Math.round(cursor) - left
      return { ...g, left, width }
    })
  }, [monthGroups, pxPerDay])
  // Derived from the same rounded columnPositions rather than recomputed
  // from totalDays * pxPerDay, so the canvas is never a fractional pixel
  // wider or narrower than the sum of the columns actually drawn inside it.
  const totalWidth = useMemo(() => {
    const last = columnPositions[columnPositions.length - 1]
    return last ? last.left + last.width : 0
  }, [columnPositions])

  const rows = useMemo(() => buildRows(phases, tasks, subtasks), [phases, tasks, subtasks])
  const rowLayouts = useMemo(() => {
    let cursor = 0
    return rows.map(row => {
      const height = rowHeight(row)
      const top = cursor
      cursor += height
      return { row, top, height }
    })
  }, [rows])
  const bodyHeight = rowLayouts.reduce((sum, r) => sum + r.height, 0)
  // The grid backdrop always fills at least the visible container height
  // (measured below), so the ledger's blank rows extend all the way down
  // instead of stopping partway with dead white space beneath — real rows
  // just extend it further once there's more content than that to show.
  // Uses the left panel's measured scrollHeight (not bodyHeight + a guessed
  // buffer) so the two panels' scrollable ranges match exactly — see
  // leftContentHeight above.
  const canvasHeight = Math.max(bodyHeight, containerHeight, leftContentHeight, 320)
  // Horizontal lines follow real row boundaries where rows exist, then keep
  // going at a uniform interval to fill the rest of the empty canvas.
  const horizontalLines = useMemo(() => {
    const lines = rowLayouts.map(r => r.top + r.height)
    let cursor = lines.length > 0 ? lines[lines.length - 1] : 0
    while (cursor < canvasHeight) {
      cursor = Math.min(cursor + TASK_ROW_H, canvasHeight)
      lines.push(cursor)
    }
    return lines
  }, [rowLayouts, canvasHeight])

  const today = startOfDay(new Date())
  const todayLeft = differenceInCalendarDays(today, timelineStart) * pxPerDay

  // Center the viewport on mount, on every zoom switch, and whenever the
  // fiscal year changes (switching Project Charter tabs reuses this same
  // component instance, so a tab switch doesn't remount it). Centers on
  // today when the year being viewed is the one today falls in, otherwise
  // centers on the fiscal year's start — computeRange keeps that point
  // inside the timeline, but without this the default scroll position (0)
  // would just show the far edge of the (now much wider, full-fiscal-year)
  // range.
  useEffect(() => {
    const el = rightScrollRef.current
    if (!el) return
    const centerLeft = today >= fiscalYearStart && today <= fiscalYearEnd
      ? todayLeft
      : differenceInCalendarDays(startOfDay(fiscalYearStart), timelineStart) * pxPerDay
    const target = Math.max(0, centerLeft - el.clientWidth / 2)
    el.scrollLeft = target
    if (headerScrollRef.current) headerScrollRef.current.scrollLeft = target
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, fiscalYearStart, fiscalYearEnd])

  const handleDragMove = useCallback((e: MouseEvent) => {
    const s = dragInfoRef.current
    if (!s) return
    const deltaPx = e.clientX - s.startX
    if (Math.abs(deltaPx) > 3) s.moved = true
    const deltaDays = Math.round(deltaPx / pxPerDay)
    if (s.mode === 'move') {
      s.draftStart = addDays(s.origStart, deltaDays)
      s.draftEnd = addDays(s.origEnd, deltaDays)
    } else if (s.mode === 'start') {
      s.draftStart = addDays(s.origStart, deltaDays)
      if (s.draftStart >= s.origEnd) s.draftStart = addDays(s.origEnd, -1)
    } else {
      s.draftEnd = addDays(s.origEnd, deltaDays)
      if (s.draftEnd <= s.origStart) s.draftEnd = addDays(s.origStart, 1)
    }
    setDragTick(v => v + 1)
  }, [pxPerDay])

  const handleDragEnd = useCallback(() => {
    const s = dragInfoRef.current
    window.removeEventListener('mousemove', handleDragMove)
    window.removeEventListener('mouseup', handleDragEnd)
    if (s) {
      if (s.moved) {
        const updates = { start_date: format(s.draftStart, 'yyyy-MM-dd'), end_date: format(s.draftEnd, 'yyyy-MM-dd') }
        if (s.itemType === 'task') onUpdateTask(s.itemId, updates)
        else onUpdateSubtask(s.itemId, updates)
      } else if (s.itemType === 'task') {
        const t = tasks.find(t => t.id === s.itemId)
        if (t) setSelectedTask(t)
      } else {
        const st = subtasks.find(st => st.id === s.itemId)
        if (st) setSelectedSubtask(st)
      }
    }
    dragInfoRef.current = null
    setDragTick(v => v + 1)
  }, [onUpdateTask, onUpdateSubtask, tasks, subtasks, handleDragMove])

  useEffect(() => () => {
    window.removeEventListener('mousemove', handleDragMove)
    window.removeEventListener('mouseup', handleDragEnd)
  }, [handleDragMove, handleDragEnd])

  const startDrag = (item: TimelineItem, itemType: 'task' | 'subtask', mode: 'move' | 'start' | 'end') => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setHover(null)
    dragInfoRef.current = {
      itemId: item.id,
      itemType,
      mode,
      startX: e.clientX,
      origStart: parseISO(item.start_date),
      origEnd: parseISO(item.end_date),
      draftStart: parseISO(item.start_date),
      draftEnd: parseISO(item.end_date),
      moved: false,
    }
    setDragTick(v => v + 1)
    window.addEventListener('mousemove', handleDragMove)
    window.addEventListener('mouseup', handleDragEnd)
  }

  const xToDate = useCallback((clientX: number) => {
    const dayIndex = Math.round((clientX - canvasLeftRef.current) / pxPerDay)
    return addDays(timelineStart, dayIndex)
  }, [pxPerDay, timelineStart])

  const handleCreateDragMove = useCallback((e: MouseEvent) => {
    const s = createDragInfoRef.current
    if (!s) return
    s.draftDate = xToDate(e.clientX)
    setDragTick(v => v + 1)
  }, [xToDate])

  const handleCreateDragEnd = useCallback(() => {
    window.removeEventListener('mousemove', handleCreateDragMove)
    window.removeEventListener('mouseup', handleCreateDragEnd)
    const s = createDragInfoRef.current
    if (s) {
      const start = s.anchorDate < s.draftDate ? s.anchorDate : s.draftDate
      const end = s.anchorDate < s.draftDate ? s.draftDate : s.anchorDate
      const range = { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') }
      if (s.kind === 'task') {
        setNewTaskTitle('')
        setPendingTaskDates(range)
        setAddingTaskFor(s.targetId)
      } else if (s.kind === 'subtask') {
        setNewSubtaskTitle('')
        setPendingSubtaskDates(range)
        setAddingSubtaskFor(s.targetId)
      } else {
        setNewPhaseTitle('')
        setPendingPhaseDates(range)
        setAddingPhase(true)
      }
    }
    createDragInfoRef.current = null
    setDragTick(v => v + 1)
  }, [handleCreateDragMove])

  useEffect(() => () => {
    window.removeEventListener('mousemove', handleCreateDragMove)
    window.removeEventListener('mouseup', handleCreateDragEnd)
  }, [handleCreateDragMove, handleCreateDragEnd])

  // Mousedown on empty canvas (bars/handles stopPropagation, so this only
  // fires on genuinely empty space) starts a create-drag against whichever
  // row it lands in. A plain click (no movement) still creates a task/
  // subtask on that single day, same as clicking a day cell on the calendar.
  // Below the last real row — including the visualization-only filler rows —
  // there's no phase/task to target, so the drag creates a brand-new phase
  // (seeded with a first task spanning the dragged range) instead.
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const rl = rowLayouts.find(r => y >= r.top && y < r.top + r.height)
    canvasLeftRef.current = rect.left
    const anchorDate = xToDate(e.clientX)
    if (rl) {
      const targetId = rl.row.kind === 'phase' ? rl.row.phase.id : rl.row.task.id
      const kind: 'task' | 'subtask' = rl.row.kind === 'phase' ? 'task' : 'subtask'
      createDragInfoRef.current = { kind, targetId, rowTop: rl.top, rowHeight: rl.height, anchorDate, draftDate: anchorDate }
    } else {
      const rowTop = Math.floor(y / TASK_ROW_H) * TASK_ROW_H
      createDragInfoRef.current = { kind: 'phase', targetId: '', rowTop, rowHeight: TASK_ROW_H, anchorDate, draftDate: anchorDate }
    }
    setDragTick(v => v + 1)
    window.addEventListener('mousemove', handleCreateDragMove)
    window.addEventListener('mouseup', handleCreateDragEnd)
  }

  const onLeftScroll = () => {
    if (syncingRef.current === 'right') { syncingRef.current = null; return }
    syncingRef.current = 'left'
    if (rightScrollRef.current && leftScrollRef.current) rightScrollRef.current.scrollTop = leftScrollRef.current.scrollTop
  }
  const onRightScroll = () => {
    if (syncingRef.current === 'left') { syncingRef.current = null; return }
    syncingRef.current = 'right'
    if (leftScrollRef.current && rightScrollRef.current) leftScrollRef.current.scrollTop = rightScrollRef.current.scrollTop
    if (headerScrollRef.current && rightScrollRef.current) headerScrollRef.current.scrollLeft = rightScrollRef.current.scrollLeft
  }

  const commitAddPhase = () => {
    const trimmed = newPhaseTitle.trim()
    if (trimmed) {
      const newPhaseId = onAddPhase(trimmed)
      if (newPhaseId && pendingPhaseDates) {
        onAddTask(newPhaseId, trimmed, pendingPhaseDates.start, pendingPhaseDates.end)
      }
    }
    setNewPhaseTitle('')
    setAddingPhase(false)
    setPendingPhaseDates(null)
  }

  const commitAddTask = (phaseId: string) => {
    const trimmed = newTaskTitle.trim()
    if (trimmed) onAddTask(phaseId, trimmed, pendingTaskDates?.start, pendingTaskDates?.end)
    setNewTaskTitle('')
    setAddingTaskFor(null)
    setPendingTaskDates(null)
  }

  const commitAddSubtask = (taskId: string) => {
    const trimmed = newSubtaskTitle.trim()
    if (trimmed) onAddSubtask(taskId, trimmed, pendingSubtaskDates?.start, pendingSubtaskDates?.end)
    setNewSubtaskTitle('')
    setAddingSubtaskFor(null)
    setPendingSubtaskDates(null)
  }

  const commitRename = (id: string) => {
    const trimmed = renameDraft.trim()
    if (trimmed) onRenamePhase(id, trimmed)
    setRenamingPhase(null)
  }

  // Bulk fold/unfold by tier, rather than clicking every phase/task chevron
  // one at a time. Goes through the existing per-item toggle callbacks
  // (only touching items not already in the target state) instead of a new
  // bulk-update prop, since collapsed is a per-row boolean already wired
  // that way end to end.
  const applyTier = (tier: 'phase' | 'task' | 'subtask') => {
    const wantPhaseCollapsed = tier === 'phase'
    const wantTaskCollapsed = tier !== 'subtask'
    phases.forEach(p => { if (p.collapsed !== wantPhaseCollapsed) onTogglePhase(p.id) })
    tasks.forEach(t => { if (t.collapsed !== wantTaskCollapsed) onToggleTask(t.id) })
    setTierMenuOpen(false)
  }

  // Drag-reorder for task rows — restricted to reordering within the same
  // phase (moving to a different phase is a reassignment, done from the
  // detail panel's Phase dropdown instead). Dropping on a row inserts the
  // dragged task immediately before it.
  const handleTaskDrop = (targetTask: ProjectTask) => {
    setTaskDropTargetId(null)
    const draggedId = draggedTaskId
    setDraggedTaskId(null)
    if (!draggedId || draggedId === targetTask.id) return
    const dragged = tasks.find(t => t.id === draggedId)
    if (!dragged || dragged.phase_id !== targetTask.phase_id) return
    const siblings = tasks
      .filter(t => t.phase_id === targetTask.phase_id)
      .sort((a, b) => a.display_order - b.display_order)
    const without = siblings.filter(t => t.id !== draggedId)
    const targetIndex = without.findIndex(t => t.id === targetTask.id)
    const reordered = [...without.slice(0, targetIndex), dragged, ...without.slice(targetIndex)]
    onReorderTasks(reordered.map(t => t.id))
  }

  const handleSubtaskDrop = (targetSubtask: ProjectSubtask) => {
    setSubtaskDropTargetId(null)
    const draggedId = draggedSubtaskId
    setDraggedSubtaskId(null)
    if (!draggedId || draggedId === targetSubtask.id) return
    const dragged = subtasks.find(s => s.id === draggedId)
    if (!dragged || dragged.task_id !== targetSubtask.task_id) return
    const siblings = subtasks
      .filter(s => s.task_id === targetSubtask.task_id)
      .sort((a, b) => a.display_order - b.display_order)
    const without = siblings.filter(s => s.id !== draggedId)
    const targetIndex = without.findIndex(s => s.id === targetSubtask.id)
    const reordered = [...without.slice(0, targetIndex), dragged, ...without.slice(targetIndex)]
    onReorderSubtasks(reordered.map(s => s.id))
  }

  const HEADER_H = zoom === 'day' ? 52 : 32

  const phaseOptions = phases.map(p => ({ id: p.id, title: p.title }))
  const taskOptions = tasks.map(t => {
    const phase = phases.find(p => p.id === t.phase_id)
    return { id: t.id, title: phase ? `${phase.title} / ${t.title}` : t.title }
  })

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Project timeline</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 text-[10px] text-text-tertiary">
            {(Object.keys(STATUS_STYLES) as TaskStatus[]).map(s => (
              <span key={s} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_STYLES[s].fill }} />
                {STATUS_STYLES[s].label}
              </span>
            ))}
            <span className="w-px h-3 bg-cell-border" />
            {/* Shape legend — status dots above explain color, this explains
                what the three row kinds actually look like on the canvas. */}
            <span className="flex items-center gap-1">
              <span className="flex items-center w-4 h-2.5">
                <span className="flex-1 h-[3px] rounded-full bg-gray-400" />
                <span className="w-1.5 h-2.5 bg-black rounded-[1px] flex-shrink-0" />
                <span className="flex-1 h-[3px] rounded-full bg-gray-400" />
              </span>
              Phase
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-2.5 rounded-sm bg-gray-400" />
              Task
            </span>
            <span className="flex items-center gap-1">
              <span
                className="w-4 h-2.5 rounded-sm bg-gray-400"
                style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.35) 0px, rgba(255,255,255,0.35) 1px, transparent 1px, transparent 3px)' }}
              />
              Subtask
            </span>
          </div>
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-full px-1 py-1">
            {(['day', 'week', 'month'] as ZoomLevel[]).map(z => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={cn(
                  'px-2.5 py-0.5 text-[11px] font-medium transition-all capitalize rounded-full',
                  z === zoom ? 'bg-black text-white shadow-sm' : 'text-text-secondary hover:text-foreground',
                )}
              >
                {z}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex border border-cell-border rounded-lg overflow-hidden flex-1 min-h-0 bg-white">
        {/* Left: hierarchy panel */}
        <div className="w-64 flex-shrink-0 border-r border-cell-border flex flex-col min-h-0">
          <div style={{ height: HEADER_H }} className="flex-shrink-0 border-b border-cell-border bg-[#f7f7f8] flex items-center justify-between px-3">
            <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Tasks</p>
            <div ref={tierMenuRef} className="relative">
              <button
                onClick={() => setTierMenuOpen(v => !v)}
                className="flex items-center gap-0.5 p-0.5 rounded text-text-tertiary hover:text-foreground hover:bg-hover transition-colors"
                title="Fold/unfold by tier"
              >
                <ChevronDown size={13} className={cn('transition-transform', tierMenuOpen && 'rotate-180')} />
              </button>
              {tierMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border border-cell-border py-1 z-50">
                  <button onClick={() => applyTier('phase')} className="w-full px-3 py-1.5 text-left text-[11px] text-foreground hover:bg-hover transition-colors">
                    Phases only
                  </button>
                  <button onClick={() => applyTier('task')} className="w-full px-3 py-1.5 text-left text-[11px] text-foreground hover:bg-hover transition-colors">
                    Phases + Tasks
                  </button>
                  <button onClick={() => applyTier('subtask')} className="w-full px-3 py-1.5 text-left text-[11px] text-foreground hover:bg-hover transition-colors">
                    All (+ Subtasks)
                  </button>
                </div>
              )}
            </div>
          </div>
          <div ref={leftScrollRef} onScroll={onLeftScroll} className="overflow-y-auto flex-1 min-h-0">
            {rows.map(row => {
              const shaded = row.phaseIndex % 2 === 1

              if (row.kind === 'phase') {
                const { phase, tasks: phaseTasks } = row
                return (
                  <div
                    key={`phase-${phase.id}`}
                    style={{ height: PHASE_ROW_H, backgroundColor: shaded ? PHASE_SHADE : '#fbfbfc' }}
                    className="group flex items-center gap-1 px-2 border-b border-cell-border"
                  >
                    <button onClick={() => onTogglePhase(phase.id)} className="flex-shrink-0 text-text-secondary">
                      {phase.collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                    </button>
                    {renamingPhase === phase.id ? (
                      <input
                        autoFocus
                        value={renameDraft}
                        onChange={(e) => setRenameDraft(e.target.value)}
                        onBlur={() => commitRename(phase.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename(phase.id)
                          if (e.key === 'Escape') setRenamingPhase(null)
                        }}
                        className="flex-1 min-w-0 text-xs font-semibold bg-white border border-apple-blue rounded px-1 py-0.5 outline-none"
                      />
                    ) : (
                      <span
                        onDoubleClick={() => { setRenamingPhase(phase.id); setRenameDraft(phase.title) }}
                        className="flex-1 min-w-0 text-xs font-semibold text-foreground truncate"
                        title={phase.title}
                      >
                        {phase.title}
                        <span className="ml-1 text-text-tertiary font-normal">({phaseTasks.length})</span>
                      </span>
                    )}
                    <button
                      onClick={() => { setAddingTaskFor(phase.id); setNewTaskTitle(''); setPendingTaskDates(null) }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-text-tertiary hover:text-apple-blue transition-opacity flex-shrink-0"
                      title="Add task"
                    >
                      <Plus size={12} />
                    </button>
                    {confirmDeletePhase === phase.id ? (
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button onClick={() => { onDeletePhase(phase.id); setConfirmDeletePhase(null) }} className="text-apple-red text-[10px] font-semibold px-1">Del</button>
                        <button onClick={() => setConfirmDeletePhase(null)} className="text-text-tertiary text-[10px] px-1">✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeletePhase(phase.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-text-tertiary hover:text-apple-red transition-opacity flex-shrink-0"
                        title="Delete phase"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                )
              }

              if (row.kind === 'task') {
                const { task, subtasks: taskSubtasks } = row
                const style = STATUS_STYLES[task.status]
                return (
                  <div
                    key={`task-${task.id}`}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDraggedTaskId(task.id) }}
                    onDragEnd={() => { setDraggedTaskId(null); setTaskDropTargetId(null) }}
                    onDragOver={(e) => {
                      if (!draggedTaskId || draggedTaskId === task.id) return
                      const dragged = tasks.find(t => t.id === draggedTaskId)
                      if (!dragged || dragged.phase_id !== task.phase_id) return
                      e.preventDefault()
                      setTaskDropTargetId(task.id)
                    }}
                    onDragLeave={() => { if (taskDropTargetId === task.id) setTaskDropTargetId(null) }}
                    onDrop={(e) => { e.preventDefault(); handleTaskDrop(task) }}
                    style={{ height: TASK_ROW_H, backgroundColor: shaded ? PHASE_SHADE : '#ffffff' }}
                    className={cn(
                      'group flex items-center gap-1 pl-5 pr-2 border-b border-cell-border hover:bg-hover transition-colors cursor-grab',
                      taskDropTargetId === task.id && 'border-t-2 border-t-apple-blue',
                      draggedTaskId === task.id && 'opacity-40',
                    )}
                  >
                    <button onClick={() => onToggleTask(task.id)} className="flex-shrink-0 text-text-secondary">
                      {task.collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    </button>
                    <button onClick={() => setSelectedTask(task)} className="flex items-center gap-1.5 flex-1 min-w-0 text-left">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: style.fill }} />
                      <span className="text-[12px] text-foreground truncate">{task.title}</span>
                      {taskSubtasks.length > 0 && <span className="text-[10px] text-text-tertiary flex-shrink-0">({taskSubtasks.length})</span>}
                    </button>
                    <button
                      onClick={() => { setAddingSubtaskFor(task.id); setNewSubtaskTitle(''); setPendingSubtaskDates(null) }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-text-tertiary hover:text-apple-blue transition-opacity flex-shrink-0"
                      title="Add subtask"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                )
              }

              const { subtask } = row
              const style = STATUS_STYLES[subtask.status]
              return (
                <button
                  key={`subtask-${subtask.id}`}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDraggedSubtaskId(subtask.id) }}
                  onDragEnd={() => { setDraggedSubtaskId(null); setSubtaskDropTargetId(null) }}
                  onDragOver={(e) => {
                    if (!draggedSubtaskId || draggedSubtaskId === subtask.id) return
                    const dragged = subtasks.find(s => s.id === draggedSubtaskId)
                    if (!dragged || dragged.task_id !== subtask.task_id) return
                    e.preventDefault()
                    setSubtaskDropTargetId(subtask.id)
                  }}
                  onDragLeave={() => { if (subtaskDropTargetId === subtask.id) setSubtaskDropTargetId(null) }}
                  onDrop={(e) => { e.preventDefault(); handleSubtaskDrop(subtask) }}
                  onClick={() => setSelectedSubtask(subtask)}
                  style={{ height: TASK_ROW_H, backgroundColor: shaded ? PHASE_SHADE : '#ffffff' }}
                  className={cn(
                    'w-full flex items-center gap-1.5 pl-12 pr-2 border-b border-cell-border hover:bg-hover transition-colors text-left cursor-grab',
                    subtaskDropTargetId === subtask.id && 'border-t-2 border-t-apple-blue',
                    draggedSubtaskId === subtask.id && 'opacity-40',
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: style.fill }} />
                  <span className="text-[12px] text-foreground truncate">{subtask.title}</span>
                </button>
              )
            })}
            {addingPhase ? (
              <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-cell-border">
                <input
                  autoFocus
                  value={newPhaseTitle}
                  onChange={(e) => setNewPhaseTitle(e.target.value)}
                  onBlur={commitAddPhase}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitAddPhase()
                    if (e.key === 'Escape') { setAddingPhase(false); setNewPhaseTitle(''); setPendingPhaseDates(null) }
                  }}
                  placeholder={
                    pendingPhaseDates
                      ? `New phase, ${format(parseISO(pendingPhaseDates.start), 'MMM d')}${pendingPhaseDates.start !== pendingPhaseDates.end ? ` – ${format(parseISO(pendingPhaseDates.end), 'MMM d')}` : ''}…`
                      : 'Phase name…'
                  }
                  className="flex-1 min-w-0 text-xs px-1.5 py-1 rounded-md border border-cell-border focus:outline-none focus:border-apple-blue bg-white"
                />
              </div>
            ) : (
              <button
                onClick={() => { setAddingPhase(true); setPendingPhaseDates(null) }}
                className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-text-tertiary hover:text-apple-blue transition-colors"
              >
                <Plus size={12} /> Add phase
              </button>
            )}
          </div>
          {/* See scrollbarHeight above — keeps this panel's visible
              (clientHeight) viewport the same size as the timeline panel's,
              which loses this much height to its own horizontal scrollbar. */}
          <div className="flex-shrink-0" style={{ height: scrollbarHeight }} aria-hidden="true" />
        </div>

        {/* Right: timeline */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div ref={headerScrollRef} className="overflow-hidden flex-shrink-0 border-b border-cell-border bg-[#f7f7f8] relative" style={{ height: HEADER_H }}>
            <div style={{ width: totalWidth, height: HEADER_H, position: 'relative' }}>
              {zoom === 'day' && monthGroupPositions && (
                <div className="relative border-b border-cell-border" style={{ height: HEADER_H / 2 }}>
                  {monthGroupPositions.map((g, i) => (
                    <div
                      key={i}
                      style={{ position: 'absolute', left: g.left, width: g.width, top: 0, bottom: 0 }}
                      className="flex items-center px-2 text-[11px] font-semibold text-foreground"
                    >
                      {g.label}
                    </div>
                  ))}
                  {/* Separator lines drawn as their own hairlines rather than each
                      cell's border-right — a box border shares the cell's width,
                      which under box-sizing can round to a different device pixel
                      than the plain hairline the body grid uses at the very same
                      x. Same technique both places means the same pixel both places. */}
                  {monthGroupPositions.map(g => (
                    <div
                      key={`sep-${g.label}-${g.left}`}
                      className="absolute top-0 bottom-0 pointer-events-none"
                      style={{ left: g.left, borderLeft: '1px solid var(--color-cell-border)' }}
                    />
                  ))}
                </div>
              )}
              <div
                className="relative"
                style={{ height: zoom === 'day' ? HEADER_H / 2 : HEADER_H }}
              >
                {columnPositions.map(c => (
                  <div
                    key={c.key}
                    style={{ position: 'absolute', left: c.left, width: c.width, top: 0, bottom: 0 }}
                    className="flex items-center justify-center text-[10px] text-text-secondary"
                  >
                    {c.label}
                  </div>
                ))}
                {columnPositions.map(c => (
                  <div
                    key={`sep-${c.key}`}
                    className="absolute top-0 bottom-0 pointer-events-none"
                    style={{ left: c.left, borderLeft: '1px solid var(--color-cell-border)' }}
                  />
                ))}
              </div>

              {/* Today marker — lives in the header only, so it never overlaps task bars below */}
              {todayLeft >= 0 && todayLeft <= totalWidth && (
                <div className="absolute inset-y-0 pointer-events-none z-10" style={{ left: todayLeft }}>
                  <div className="absolute inset-y-0 border-l-2 border-apple-red" />
                  <div className="absolute -top-px left-1 text-[9px] font-semibold text-apple-red whitespace-nowrap">Today</div>
                </div>
              )}
            </div>
          </div>

          <div ref={rightScrollRef} onScroll={onRightScroll} className="flex-1 min-h-0 overflow-auto relative">
            <div
              style={{ width: totalWidth, height: canvasHeight, position: 'relative' }}
              onMouseDown={handleCanvasMouseDown}
            >
              {/* Layer 1: row shading (phase stripe) — sits under the grid lines */}
              {rowLayouts.map(({ row, top, height }) => {
                const shaded = row.phaseIndex % 2 === 1
                const bg = row.kind === 'phase' ? (shaded ? PHASE_SHADE : '#fbfbfc') : (shaded ? PHASE_SHADE : '#ffffff')
                const key = row.kind === 'phase' ? row.phase.id : row.kind === 'task' ? row.task.id : row.subtask.id
                return (
                  <div
                    key={`bg-${row.kind}-${key}`}
                    className="absolute left-0 right-0"
                    style={{ top, height, backgroundColor: bg }}
                  />
                )
              })}

              {/* Layer 2: dotted grid lines — always drawn, regardless of whether tasks exist yet.
                  Uses the same columnPositions the header renders from, so columns and grid
                  lines can never drift apart from independent rounding. */}
              {columnPositions.map(c => (
                <div
                  key={`v-${c.key}`}
                  className="absolute top-0"
                  style={{ left: c.left, height: canvasHeight, borderLeft: '1px dotted #d5d5d8' }}
                />
              ))}
              {horizontalLines.map((lineTop, i) => (
                <div
                  key={`h-${i}`}
                  className="absolute left-0 right-0"
                  style={{ top: lineTop - 1, borderTop: '1px dotted #d5d5d8' }}
                />
              ))}

              {/* Layer 3: phase bands + task/subtask bars */}
              {rowLayouts.map(({ row, top, height: h }) => {
                if (row.kind === 'phase') {
                  const { phase, tasks: phaseTasks } = row
                  if (phaseTasks.length === 0) return null
                  const spanStart = phaseTasks.reduce((min, t) => t.start_date < min ? t.start_date : min, phaseTasks[0].start_date)
                  const spanEnd = phaseTasks.reduce((max, t) => t.end_date > max ? t.end_date : max, phaseTasks[0].end_date)
                  const left = differenceInCalendarDays(parseISO(spanStart), timelineStart) * pxPerDay
                  const width = (differenceInCalendarDays(parseISO(spanEnd), parseISO(spanStart)) + 1) * pxPerDay
                  const label = `Phase ${row.phaseIndex + 1}`
                  return (
                    <div
                      key={`band-${phase.id}`}
                      className="absolute pointer-events-none"
                      style={{ left, width, top, height: h }}
                      title={`${format(parseISO(spanStart), 'MMM d')} – ${format(parseISO(spanEnd), 'MMM d, yyyy')}`}
                    >
                      {/* Center line */}
                      <div
                        className="absolute rounded-full"
                        style={{ left: 0, right: 0, top: h / 2 - PHASE_LINE_H / 2, height: PHASE_LINE_H, backgroundColor: color.bg }}
                      />
                      {/* End caps — a vertical tick at each edge, same color as the line */}
                      <div
                        className="absolute"
                        style={{ left: 0, top: h / 2 - PHASE_TICK_H / 2, width: 2, height: PHASE_TICK_H, backgroundColor: color.bg }}
                      />
                      <div
                        className="absolute"
                        style={{ right: 0, top: h / 2 - PHASE_TICK_H / 2, width: 2, height: PHASE_TICK_H, backgroundColor: color.bg }}
                      />
                      {/* Center label naming the phase's order, same height
                          as the end ticks so all three line up. */}
                      <div
                        className="absolute flex items-center justify-center rounded px-1.5 text-white text-[10px] font-normal whitespace-nowrap"
                        style={{ left: '50%', transform: 'translateX(-50%)', top: h / 2 - PHASE_TICK_H / 2, height: PHASE_TICK_H, backgroundColor: color.bg }}
                      >
                        {label}
                      </div>
                    </div>
                  )
                }

                const item = row.kind === 'task' ? row.task : row.subtask
                const itemType = row.kind === 'task' ? 'task' as const : 'subtask' as const
                const isSubtask = row.kind === 'subtask'
                const style = STATUS_STYLES[item.status]
                const dragging = dragInfoRef.current?.itemId === item.id
                const effStart = dragging ? dragInfoRef.current!.draftStart : parseISO(item.start_date)
                const effEnd = dragging ? dragInfoRef.current!.draftEnd : parseISO(item.end_date)
                const left = differenceInCalendarDays(effStart, timelineStart) * pxPerDay
                const width = Math.max((differenceInCalendarDays(effEnd, effStart) + 1) * pxPerDay, 8)
                // Subtask bars use the same status coloring as task bars, just
                // thinner and lower-opacity — a lighter-weight visual for the
                // deepest tier, distinct from (not a copy of) tier-2 bars.
                const barHeight = isSubtask ? 10 : 16

                return (
                  <div
                    key={`bar-${item.id}`}
                    className="group/bar absolute rounded-md shadow-sm select-none"
                    style={{
                      left,
                      width,
                      top: top + h / 2 - barHeight / 2,
                      height: barHeight,
                      backgroundColor: style.fill,
                      // Diagonal stripes are the tier-3 tell — same status
                      // color as the task bar above it, but never mistakable
                      // for one at a glance.
                      backgroundImage: isSubtask
                        ? 'repeating-linear-gradient(45deg, rgba(255,255,255,0.35) 0px, rgba(255,255,255,0.35) 1.5px, transparent 1.5px, transparent 6px)'
                        : undefined,
                      opacity: STATUS_OPACITY[item.status] * (isSubtask ? 0.55 : 1),
                      cursor: dragging ? 'grabbing' : 'grab',
                    }}
                    onMouseDown={startDrag(item, itemType, 'move')}
                    onMouseEnter={(e) => { if (!dragInfoRef.current) setHover({ item, x: e.clientX, y: e.clientY }) }}
                    onMouseMove={(e) => { if (!dragInfoRef.current) setHover({ item, x: e.clientX, y: e.clientY }) }}
                    onMouseLeave={() => setHover(null)}
                  >
                    <div
                      onMouseDown={startDrag(item, itemType, 'start')}
                      className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize opacity-0 group-hover/bar:opacity-100 bg-black/15 rounded-l-md"
                    />
                    <div
                      onMouseDown={startDrag(item, itemType, 'end')}
                      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize opacity-0 group-hover/bar:opacity-100 bg-black/15 rounded-r-md"
                    />
                  </div>
                )
              })}

              {/* Create-drag ghost preview — reflects createDragInfoRef live via
                  the same setDragTick force-render trick the bar drag uses. */}
              {createDragInfoRef.current && (() => {
                const s = createDragInfoRef.current!
                const start = s.anchorDate < s.draftDate ? s.anchorDate : s.draftDate
                const end = s.anchorDate < s.draftDate ? s.draftDate : s.anchorDate
                const left = differenceInCalendarDays(start, timelineStart) * pxPerDay
                const width = Math.max((differenceInCalendarDays(end, start) + 1) * pxPerDay, pxPerDay)
                return (
                  <div
                    className="absolute rounded-md pointer-events-none border-2 border-apple-blue bg-apple-blue/20"
                    style={{ left, width, top: s.rowTop + s.rowHeight / 2 - 8, height: 16 }}
                  />
                )
              })()}
            </div>
          </div>
        </div>
      </div>

      {addingTaskFor && (
        <div className="flex items-center gap-1.5 mt-2 flex-shrink-0">
          <input
            autoFocus
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitAddTask(addingTaskFor)
              if (e.key === 'Escape') { setAddingTaskFor(null); setNewTaskTitle(''); setPendingTaskDates(null) }
            }}
            placeholder={
              pendingTaskDates
                ? `New task, ${format(parseISO(pendingTaskDates.start), 'MMM d')}${pendingTaskDates.start !== pendingTaskDates.end ? ` – ${format(parseISO(pendingTaskDates.end), 'MMM d')}` : ''}…`
                : `New task in "${phases.find(p => p.id === addingTaskFor)?.title}"…`
            }
            className="flex-1 min-w-0 text-xs px-2 py-1 rounded-md border border-cell-border focus:outline-none focus:ring-2 focus:ring-apple-blue/30 focus:border-apple-blue bg-white"
          />
          <button
            onClick={() => commitAddTask(addingTaskFor)}
            disabled={!newTaskTitle.trim()}
            className="text-xs px-2 py-1 rounded-md bg-apple-blue text-white font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            Add
          </button>
          <button
            onClick={() => { setAddingTaskFor(null); setNewTaskTitle(''); setPendingTaskDates(null) }}
            className="text-xs px-2 py-1 rounded-md text-text-secondary hover:bg-hover transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {addingSubtaskFor && (
        <div className="flex items-center gap-1.5 mt-2 flex-shrink-0">
          <input
            autoFocus
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitAddSubtask(addingSubtaskFor)
              if (e.key === 'Escape') { setAddingSubtaskFor(null); setNewSubtaskTitle(''); setPendingSubtaskDates(null) }
            }}
            placeholder={
              pendingSubtaskDates
                ? `New subtask, ${format(parseISO(pendingSubtaskDates.start), 'MMM d')}${pendingSubtaskDates.start !== pendingSubtaskDates.end ? ` – ${format(parseISO(pendingSubtaskDates.end), 'MMM d')}` : ''}…`
                : `New subtask in "${tasks.find(t => t.id === addingSubtaskFor)?.title}"…`
            }
            className="flex-1 min-w-0 text-xs px-2 py-1 rounded-md border border-cell-border focus:outline-none focus:ring-2 focus:ring-apple-blue/30 focus:border-apple-blue bg-white"
          />
          <button
            onClick={() => commitAddSubtask(addingSubtaskFor)}
            disabled={!newSubtaskTitle.trim()}
            className="text-xs px-2 py-1 rounded-md bg-apple-blue text-white font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            Add
          </button>
          <button
            onClick={() => { setAddingSubtaskFor(null); setNewSubtaskTitle(''); setPendingSubtaskDates(null) }}
            className="text-xs px-2 py-1 rounded-md text-text-secondary hover:bg-hover transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {hover && <ItemTooltip item={hover.item} x={hover.x} y={hover.y} />}

      {selectedTask && (
        <ItemDetailPanel
          item={selectedTask}
          parentLabel="Phase"
          parentValue={selectedTask.phase_id}
          parentOptions={phaseOptions}
          onSave={({ parentId, ...updates }) => onUpdateTask(selectedTask.id, { ...updates, phase_id: parentId })}
          onDelete={() => { onDeleteTask(selectedTask.id); setSelectedTask(null) }}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {selectedSubtask && (
        <ItemDetailPanel
          item={selectedSubtask}
          parentLabel="Task"
          parentValue={selectedSubtask.task_id}
          parentOptions={taskOptions}
          onSave={({ parentId, ...updates }) => onUpdateSubtask(selectedSubtask.id, { ...updates, task_id: parentId })}
          onDelete={() => { onDeleteSubtask(selectedSubtask.id); setSelectedSubtask(null) }}
          onClose={() => setSelectedSubtask(null)}
        />
      )}
    </div>
  )
}
