"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchDashboard } from "@/lib/api";
import { supabase, supabaseConfigured } from "@/lib/supabase/client";
import type { DayWithSessions, Speaker } from "@/lib/types";

const WATCHED_TABLES = ["wkshp_days", "wkshp_sessions", "wkshp_subsessions", "wkshp_subsession_speakers", "wkshp_speakers"] as const;

export function useDashboardData(initialDays: DayWithSessions[], initialSpeakers: Speaker[]) {
  const [days, setDays] = useState<DayWithSessions[]>(initialDays);
  const [speakers, setSpeakers] = useState<Speaker[]>(initialSpeakers);
  const [error, setError] = useState<string | null>(
    supabaseConfigured ? null : "Supabase is not configured yet — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = useCallback(async () => {
    try {
      const { days, speakers } = await fetchDashboard();
      setDays(days);
      setSpeakers(speakers);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard data");
    }
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) return;

    const scheduleReload = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(reload, 250);
    };

    // The server-rendered initialDays/initialSpeakers can already be stale
    // by the time this mounts (a route-cached page, a write that landed in
    // the gap between SSR and hydration, another tab's edit) and the
    // postgres_changes subscription below only reacts to *future* writes --
    // it never self-corrects a snapshot that was wrong to begin with. Schedule
    // one reload up front (via the same debounced path as everything else)
    // so every mount starts from live data.
    scheduleReload();

    const channel = supabase.channel("dashboard-sync");
    for (const table of WATCHED_TABLES) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, scheduleReload);
    }
    channel.subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [reload]);

  return { days, speakers, loading: false, error, reload, setDays, setSpeakers };
}
