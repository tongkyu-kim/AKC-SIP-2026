import { ScheduleBoard } from "@/components/ScheduleBoard";
import { fetchComments, fetchDashboard } from "@/lib/api";
import { supabaseConfigured } from "@/lib/supabase/client";
import type { Comment, DayWithSessions, Speaker } from "@/lib/types";

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
