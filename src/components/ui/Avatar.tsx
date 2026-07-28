import { CATEGORY_COLOR, STATUS_DOT, type Speaker } from "@/lib/types";
import { CountryFlag } from "@/components/ui/CountryFlag";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ speaker, size = "sm" }: { speaker: Speaker; size?: "xs" | "sm" | "md" }) {
  const dims = { xs: "h-5 w-5 text-[9px]", sm: "h-7 w-7 text-[11px]", md: "h-16 w-16 text-lg" }[size];
  const ring = { xs: "ring-1", sm: "ring-2", md: "ring-2" }[size];
  const starSize = { xs: "text-[10px]", sm: "text-sm", md: "text-2xl" }[size];

  const showFlag = (speaker.category === "participant" || speaker.category === "vip") && !!speaker.country;

  return (
    // Outer wrapper has no overflow-hidden of its own — the VIP star sits on
    // it (not on the clipped circle below) so its negative offset is never
    // cropped by the circle's own overflow-hidden mask.
    <span className="relative inline-flex flex-shrink-0" title={speaker.name}>
      <span
        className={`relative flex items-center justify-center overflow-hidden rounded-full font-semibold text-white ${dims} ${
          showFlag ? "bg-zinc-100 dark:bg-zinc-800" : CATEGORY_COLOR[speaker.category]
        }`}
      >
        {showFlag ? <CountryFlag country={speaker.country!} className="h-full w-full" /> : initials(speaker.name)}
        {/* Organizers skip the booking-status workflow entirely, so no status dot for them. */}
        {speaker.category !== "organizer" && (
          <span
            className={`absolute -bottom-0.5 -right-0.5 rounded-full ${ring} ring-white dark:ring-zinc-900 ${STATUS_DOT[speaker.status]} ${
              size === "md" ? "h-4 w-4" : "h-2.5 w-2.5"
            }`}
          />
        )}
      </span>
      {speaker.category === "vip" && (
        <span className={`absolute -left-1.5 -top-1.5 leading-none text-black drop-shadow-[0_0_1px_rgba(255,255,255,0.9)] ${starSize}`} aria-label="VIP">
          ★
        </span>
      )}
    </span>
  );
}
