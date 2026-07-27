import { CATEGORY_COLOR, STATUS_DOT, type Speaker } from "@/lib/types";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ speaker, size = "sm" }: { speaker: Speaker; size?: "xs" | "sm" | "md" }) {
  const dims = { xs: "h-5 w-5 text-[9px]", sm: "h-7 w-7 text-[11px]", md: "h-16 w-16 text-lg" }[size];
  const ring = { xs: "ring-1", sm: "ring-2", md: "ring-2" }[size];

  return (
    <span
      className={`relative inline-flex flex-shrink-0 items-center justify-center rounded-full font-semibold text-white ${dims} ${CATEGORY_COLOR[speaker.category]}`}
      title={speaker.name}
    >
      {initials(speaker.name)}
      <span
        className={`absolute -bottom-0.5 -right-0.5 rounded-full ${ring} ring-white dark:ring-zinc-900 ${STATUS_DOT[speaker.status]} ${
          size === "md" ? "h-4 w-4" : "h-2.5 w-2.5"
        }`}
      />
    </span>
  );
}
