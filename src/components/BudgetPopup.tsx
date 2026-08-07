"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { useBudgetAllocations } from "@/hooks/useBudgetAllocations";
import {
  BUDGET_CATEGORIES,
  BUDGET_CATEGORY_LABEL,
  ORGANIZER_ORGS,
  budgetParticipantStatus,
  type BudgetAllocation,
  type BudgetCategory,
  type BudgetStatus,
  type Speaker,
} from "@/lib/types";

// Distinct tint per org so a glance at the matrix reads as a rough heatmap
// of who's covering what, without needing to read every cell's text.
const ORG_COLOR: Record<string, string> = {
  AKC: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
  KMAC: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  KOFICE: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  WEtheTEAM: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
};
const COVERED_NO_ORG = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300";
const NOT_COVERED = "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500";

type CellKey = string;
function cellKey(speakerId: string, category: BudgetCategory): CellKey {
  return `${speakerId}:${category}`;
}

function BudgetCellEditor({
  org,
  status,
  memo,
  onChange,
  onClose,
}: {
  org: string | null;
  status: BudgetStatus;
  memo: string | null;
  onChange: (patch: { org?: string | null; status?: BudgetStatus; memo?: string | null }) => void;
  onClose: () => void;
}) {
  const [memoDraft, setMemoDraft] = useState(memo ?? "");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [onClose]);

  const commitMemo = () => {
    const trimmed = memoDraft.trim();
    if (trimmed !== (memo ?? "")) onChange({ memo: trimmed || null });
  };

  return (
    <div
      ref={ref}
      className="absolute left-1/2 top-full z-50 mt-1 w-56 -translate-x-1/2 rounded-lg border border-zinc-200 bg-white p-3 text-left shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-2">
        <label className="mb-1 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Responsible org</label>
        <select
          className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          value={org ?? ""}
          onChange={(e) => {
            const nextOrg = e.target.value || null;
            // Picking an org is a strong signal it's actually covered -- default
            // status to O so assigning an org doesn't also need a second click.
            onChange({ org: nextOrg, status: nextOrg ? "O" : status });
          }}
        >
          <option value="">—</option>
          {ORGANIZER_ORGS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-2">
        <label className="mb-1 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Coverage</label>
        <div className="flex gap-1.5">
          <button
            onClick={() => onChange({ status: "O" })}
            className={`flex-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
              status === "O" ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            O
          </button>
          <button
            onClick={() => onChange({ status: "--" })}
            className={`flex-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
              status === "--" ? "bg-zinc-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            --
          </button>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Memo</label>
        <textarea
          className="min-h-14 w-full resize-none rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          value={memoDraft}
          onChange={(e) => setMemoDraft(e.target.value)}
          onBlur={commitMemo}
          placeholder='Optional, e.g. "Business class flight"'
        />
      </div>
    </div>
  );
}

function BudgetCell({
  speaker,
  category,
  allocation,
  editingKey,
  onToggleEditor,
  onChange,
}: {
  speaker: Speaker;
  category: BudgetCategory;
  allocation: BudgetAllocation | undefined;
  editingKey: CellKey | null;
  onToggleEditor: (key: CellKey | null) => void;
  onChange: (patch: { org?: string | null; status?: BudgetStatus; memo?: string | null }) => void;
}) {
  const key = cellKey(speaker.id, category);
  const org = allocation?.org ?? null;
  const status = allocation?.status ?? "--";
  const memo = allocation?.memo ?? null;
  const isEditing = editingKey === key;

  const colorClass = status === "O" ? (org ? (ORG_COLOR[org] ?? COVERED_NO_ORG) : COVERED_NO_ORG) : NOT_COVERED;

  return (
    <td className="relative px-1 py-1 text-center align-middle">
      <button
        onClick={() => onToggleEditor(isEditing ? null : key)}
        className={`inline-flex h-7 w-14 items-center justify-center gap-0.5 rounded-md text-xs font-semibold transition-colors ${colorClass} ${
          isEditing ? "ring-2 ring-sky-400" : ""
        }`}
      >
        {status}
        {memo && (
          <span title={memo} className="cursor-help text-[10px] leading-none">
            *
          </span>
        )}
      </button>
      {isEditing && <BudgetCellEditor org={org} status={status} memo={memo} onChange={onChange} onClose={() => onToggleEditor(null)} />}
    </td>
  );
}

export function BudgetPopup({ open, onClose, speakers }: { open: boolean; onClose: () => void; speakers: Speaker[] }) {
  const { allocations, loaded, error, setCell } = useBudgetAllocations(open);
  const [editingKey, setEditingKey] = useState<CellKey | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (editingKey) setEditingKey(null);
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, editingKey]);

  // Organizers (internal AKC/KMAC/WEtheTEAM/KOFICE staff) aren't part of
  // this matrix -- it's for people whose travel/logistics costs need a
  // responsible party assigned, not the org doing the assigning.
  const rows = useMemo(() => speakers.filter((s) => s.category !== "organizer").sort((a, b) => a.name.localeCompare(b.name)), [speakers]);

  const allocationMap = useMemo(() => {
    const map = new Map<CellKey, BudgetAllocation>();
    for (const a of allocations) map.set(cellKey(a.speaker_id, a.category), a);
    return map;
  }, [allocations]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative flex h-[90vh] w-[95vw] max-w-[1400px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-zinc-200 px-5 py-3.5 dark:border-zinc-800">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Budget Allocation</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Cost responsibility per participant, per expense category</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          {!loaded && !error && <p className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">Loading budget matrix…</p>}
          {error && <p className="py-2 text-center text-xs text-red-500">{error}</p>}
          {loaded && (
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-white dark:bg-zinc-900">
                <tr className="border-b border-zinc-200 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <th className="px-2 py-2">No.</th>
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Affiliation</th>
                  <th className="px-2 py-2">Status</th>
                  {BUDGET_CATEGORIES.map((cat) => (
                    <th key={cat} className="px-1 py-2 text-center">
                      {BUDGET_CATEGORY_LABEL[cat]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((speaker, i) => (
                  <tr key={speaker.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60">
                    <td className="px-2 py-1.5 text-xs text-zinc-400">{i + 1}</td>
                    <td className="px-2 py-1.5 font-medium text-zinc-900 dark:text-zinc-100">{speaker.name}</td>
                    <td className="max-w-[200px] truncate px-2 py-1.5 text-xs text-zinc-500 dark:text-zinc-400" title={speaker.title_org ?? undefined}>
                      {speaker.title_org || "—"}
                    </td>
                    <td className="px-2 py-1.5 text-xs text-zinc-500 dark:text-zinc-400">{budgetParticipantStatus(speaker.category)}</td>
                    {BUDGET_CATEGORIES.map((cat) => (
                      <BudgetCell
                        key={cat}
                        speaker={speaker}
                        category={cat}
                        allocation={allocationMap.get(cellKey(speaker.id, cat))}
                        editingKey={editingKey}
                        onToggleEditor={setEditingKey}
                        onChange={(patch) => setCell(speaker.id, cat, patch)}
                      />
                    ))}
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4 + BUDGET_CATEGORIES.length} className="py-8 text-center text-sm text-zinc-400">
                      No speakers, VIPs, or participants yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
