export function GripIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 20" fill="currentColor" className={className}>
      {[2, 6, 10, 14, 18].flatMap((cy) =>
        [3, 9].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.4" />),
      )}
    </svg>
  );
}
