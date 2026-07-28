import { STATUS_LABEL, STATUS_STYLE, type SpeakerStatus } from "@/lib/types";

export function StatusBadge({ status, label, className = "" }: { status: SpeakerStatus; label?: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[status]} ${className}`}
    >
      {label ?? STATUS_LABEL[status]}
    </span>
  );
}
