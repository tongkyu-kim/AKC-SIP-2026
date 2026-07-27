"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchComments } from "@/lib/api";
import { supabase, supabaseConfigured } from "@/lib/supabase/client";
import type { Comment } from "@/lib/types";

export function useComments(initialComments: Comment[]) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = useCallback(async () => {
    try {
      const data = await fetchComments();
      setComments(data);
    } catch {
      // Initial data (or the next realtime event) will recover the view.
    }
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) return;

    const scheduleReload = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(reload, 250);
    };

    const channel = supabase.channel("comments-sync");
    channel.on("postgres_changes", { event: "*", schema: "public", table: "wkshp_comments" }, scheduleReload);
    channel.subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [reload]);

  return { comments };
}
