"use client";

import { useEffect, useState } from "react";
import { Button, inputClass } from "@/components/ui/Field";
import { createComment, deleteComment } from "@/lib/api";
import type { Comment } from "@/lib/types";

const AUTHOR_KEY = "wkshp_comment_author";

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function CommentLog({ comments }: { comments: Comment[] }) {
  const [author, setAuthor] = useState("");
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    // Must read localStorage post-mount (not in a lazy useState initializer) —
    // the server has no localStorage, so seeding state with it during the
    // initial render would produce a client/server hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuthor(localStorage.getItem(AUTHOR_KEY) ?? "");
  }, []);

  const handlePost = async () => {
    const text = message.trim();
    if (!text) return;
    const name = author.trim() || "Anonymous";
    setPosting(true);
    try {
      localStorage.setItem(AUTHOR_KEY, name);
      await createComment(name, text);
      setMessage("");
    } finally {
      setPosting(false);
    }
  };

  return (
    <section className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Comment Log</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Leave memos here for other teams working on this schedule.</p>
      </div>

      <div className="mb-3 space-y-2 rounded-lg border border-zinc-200 p-2.5 dark:border-zinc-700">
        <input className={inputClass} placeholder="Your name / team" value={author} onChange={(e) => setAuthor(e.target.value)} />
        <textarea
          className={`${inputClass} min-h-16`}
          placeholder="Leave a note for the team..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePost();
          }}
        />
        <Button variant="primary" className="w-full" onClick={handlePost} disabled={posting || !message.trim()}>
          {posting ? "Posting..." : "Post"}
        </Button>
      </div>

      <div className="space-y-2">
        {comments.length === 0 && <p className="py-4 text-center text-xs text-zinc-400">No comments yet.</p>}
        {comments.map((c) => (
          <div key={c.id} className="group rounded-lg bg-zinc-50 px-2.5 py-2 text-sm dark:bg-zinc-800/60">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium text-zinc-800 dark:text-zinc-100">{c.author}</span>
              <div className="flex flex-shrink-0 items-center gap-2">
                <span className="text-[10px] text-zinc-400">{formatTimestamp(c.created_at)}</span>
                <button
                  onClick={() => {
                    if (confirm("Delete this comment?")) deleteComment(c.id);
                  }}
                  className="text-[10px] text-red-400 opacity-0 hover:text-red-600 group-hover:opacity-100"
                >
                  Delete
                </button>
              </div>
            </div>
            <p className="mt-0.5 whitespace-pre-wrap text-zinc-600 dark:text-zinc-300">{c.message}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
