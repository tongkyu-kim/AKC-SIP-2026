"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchBudgetAllocations, upsertBudgetAllocation } from "@/lib/api";
import { supabase, supabaseConfigured } from "@/lib/supabase/client";
import type { BudgetAllocation, BudgetCategory, BudgetStatus } from "@/lib/types";

// Loads + persists the budget allocation matrix (wkshp_budget_allocations).
// Same shape as useProjectGantt: only fetches/subscribes while `enabled`
// (the popup is open), realtime changes debounced into a single reload so
// several near-simultaneous edits (e.g. two people editing at once) don't
// each trigger their own refetch.
export function useBudgetAllocations(enabled: boolean) {
  const [allocations, setAllocations] = useState<BudgetAllocation[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = useCallback(async () => {
    try {
      const data = await fetchBudgetAllocations();
      setAllocations(data);
      setLoaded(true);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load the budget allocation matrix");
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [enabled, reload]);

  useEffect(() => {
    if (!enabled || !supabaseConfigured) return;
    const scheduleReload = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(reload, 250);
    };
    const channel = supabase.channel("budget-sync");
    channel.on("postgres_changes", { event: "*", schema: "public", table: "wkshp_budget_allocations" }, scheduleReload);
    channel.subscribe();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [enabled, reload]);

  // Optimistic local update, then persist -- reload() on failure to fall
  // back to server truth rather than leave a stale optimistic cell.
  const setCell = useCallback(
    (speakerId: string, category: BudgetCategory, patch: { org?: string | null; status?: BudgetStatus; memo?: string | null }) => {
      setAllocations((prev) => {
        const existing = prev.find((a) => a.speaker_id === speakerId && a.category === category);
        const next = {
          speaker_id: speakerId,
          category,
          org: patch.org !== undefined ? patch.org : (existing?.org ?? null),
          status: patch.status !== undefined ? patch.status : (existing?.status ?? "--"),
          memo: patch.memo !== undefined ? patch.memo : (existing?.memo ?? null),
        };
        upsertBudgetAllocation(next).catch(() => reload());
        if (existing) {
          return prev.map((a) => (a === existing ? { ...a, ...next } : a));
        }
        return [
          ...prev,
          {
            ...next,
            id: `pending-${speakerId}-${category}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
      });
    },
    [reload],
  );

  return { allocations, loaded, error, setCell };
}
