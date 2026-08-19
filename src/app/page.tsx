import { ScheduleBoard } from "@/components/ScheduleBoard";
import { fetchComments, fetchDashboard } from "@/lib/api";
import { supabaseConfigured } from "@/lib/supabase/client";
import type { Comment, DayWithSessions, Speaker } from "@/lib/types";

// This route has no dynamic segments or dynamic APIs, so without this it's
// eligible for Next's Full Route Cache -- it gets statically prerendered once
// (at build/deploy time) and that same frozen HTML, with whatever
// days/speakers existed at that moment baked in, is served to every visitor
// on every refresh until the next deploy. Since this dashboard is edited
// live (drag-and-drop status changes, deletes, etc. all write straight to
// Supabase), that made edits look like they silently reverted -- refreshing
// never actually re-ran fetchDashboard(). force-dynamic makes every request
// render fresh.
export const dynamic = "force-dynamic";

export default async function Home() {
  let initialDays: DayWithSessions[] = [];
  let initialSpeakers: Speaker[] = [];
  let initialComments: Comment[] = [];

  if (supabaseConfigured) {
    // Fetched independently: a not-yet-migrated wkshp_comments table (e.g. right
    // after adding the feature) shouldn't take the whole dashboard down.
    try {
      const data = await fetchDashboard();
      initialDays = data.days;
      initialSpeakers = data.speakers;
    } catch {
      // ScheduleBoard's client-side reload will surface the error once mounted.
    }
    try {
      initialComments = await fetchComments();
    } catch {
      // Comment log starts empty; its own realtime reload will pick it up once the table exists.
    }
  }

  return <ScheduleBoard initialDays={initialDays} initialSpeakers={initialSpeakers} initialComments={initialComments} />;
}
