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

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <header className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-blue-700 to-sky-600">
        <div
          aria-hidden
          className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_35%),radial-gradient(circle_at_80%_0%,white,transparent_30%)]"
        />
        <div className="relative mx-auto w-full max-w-[2600px] px-4 py-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">ASEAN-Korea Sustainable Innovation Program</p>
              <h1 className="mt-1 truncate text-xl font-bold leading-tight text-white sm:text-2xl">
                Cross-Border AI Governance for Sustainable Development and Creative Culture
              </h1>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
              October 7–10 · Gyeongju, Korea
            </div>
          </div>
        </div>
      </header>
      <ScheduleBoard initialDays={initialDays} initialSpeakers={initialSpeakers} initialComments={initialComments} />
    </div>
  );
}
