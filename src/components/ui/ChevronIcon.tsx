export function ChevronIcon({ open, className = "h-3.5 w-3.5" }: { open: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-150 ${open ? "rotate-180" : ""} ${className}`}
    >
      <path d="M2.5 4.5 6 8l3.5-3.5" />
    </svg>
  );
}
