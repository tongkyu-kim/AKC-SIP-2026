"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { Button, inputClass } from "@/components/ui/Field";
import { createComment, deleteComment } from "@/lib/api";
import { COMMENT_TEAMS, teamOf, type Comment } from "@/lib/types";

const AUTHOR_KEY = "wkshp_comment_author";
const TEAM_KEY = "wkshp_comment_team";

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function CommentColumn({ team, comments }: { team: string; comments: Comment[] }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-lg bg-zinc-50 dark:bg-zinc-950/40">
      <div className="flex flex-shrink-0 items-center justify-between px-2.5 pt-2.5 pb-1.5">
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{team}</span>
        <span className="text-xs text-zinc-400">{comments.length}</span>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2 pt-0">
        {comments.length === 0 && <p className="py-4 text-center text-xs text-zinc-400">No comments yet.</p>}
        {comments.map((c) => (
          <div key={c.id} className="group rounded-lg bg-white px-2.5 py-2 text-sm shadow-sm dark:bg-zinc-800/60">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium text-zinc-800 dark:text-zinc-100">{c.author}</span>
              <button
                onClick={() => {
                  if (confirm("Delete this comment?")) deleteComment(c.id);
                }}
                className="flex-shrink-0 text-[10px] text-red-400 opacity-0 hover:text-red-600 group-hover:opacity-100"
              >
                Delete
              </button>
            </div>
            <p className="mt-0.5 whitespace-pre-wrap text-zinc-600 dark:text-zinc-300">{c.message}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
              <Clock size={11} />
              {formatTimestamp(c.created_at)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Same fixed footprint as ProjectGanttPopup (h-[90vh] w-[95vw] max-w-[1800px])
// — the two share the header's popup row, so they're sized to match rather
// than reusing the generic Modal (which sizes to content). Composer sits on
// the left; the feed itself is split into 4 team columns (AKC/KMAC/
// WEtheTEAM/Others) rather than one flat list.
export function CommentLog({ open, onClose, comments }: { open: boolean; onClose: () => void; comments: Comment[] }) {
  const [author, setAuthor] = useState("");
  const [team, setTeam] = useState<string>(COMMENT_TEAMS[0]);
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    // Must read localStorage post-mount (not in a lazy useState initializer) —
    // the server has no localStorage, so seeding state with it during the
    // initial render would produce a client/server hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuthor(localStorage.getItem(AUTHOR_KEY) ?? "");
    const savedTeam = localStorage.getItem(TEAM_KEY);
    if (savedTeam && COMMENT_TEAMS.includes(savedTeam)) setTeam(savedTeam);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const byTeam = useMemo(() => {
    const map = new Map<string, Comment[]>(COMMENT_TEAMS.map((t) => [t, []]));
    for (const c of comments) map.get(teamOf(c))?.push(c);
    return map;
  }, [comments]);

  const handlePost = async () => {
    const text = message.trim();
    if (!text) return;
    const name = author.trim() || "Anonymous";
    setPosting(true);
    try {
      localStorage.setItem(AUTHOR_KEY, name);
      localStorage.setItem(TEAM_KEY, team);
      await createComment(name, text, team);
      setMessage("");
    } finally {
      setPosting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative flex h-[90vh] w-[95vw] max-w-[1800px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-zinc-200 px-5 py-3.5 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Comment Log</h2>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex min-h-0 flex-1 gap-4 p-4">
          <div className="flex h-full w-64 flex-shrink-0 flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
            <input className={inputClass} placeholder="Your name / team" value={author} onChange={(e) => setAuthor(e.target.value)} />
            <select className={inputClass} value={team} onChange={(e) => setTeam(e.target.value)}>
              {COMMENT_TEAMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {/* flex-1 so the textarea fills all remaining height, pushing Post
                down to sit near the bottom of the panel instead of right
                under a short fixed-height box. */}
            <textarea
              className={`${inputClass} flex-1 resize-none`}
              placeholder="Leave a note for the team..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePost();
              }}
            />
            <Button variant="primary" className="w-full flex-shrink-0" onClick={handlePost} disabled={posting || !message.trim()}>
              {posting ? "Posting..." : "Post"}
            </Button>
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 gap-3">
            {COMMENT_TEAMS.map((t) => (
              <CommentColumn key={t} team={t} comments={byTeam.get(t) ?? []} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
