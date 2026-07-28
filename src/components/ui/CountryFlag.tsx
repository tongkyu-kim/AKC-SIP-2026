// Simplified flag icons for the 11 ASEAN countries. Windows doesn't render
// Unicode flag emoji as pictures (Segoe UI Emoji shows the two-letter code
// instead), so avatars use these inline SVGs to stay correct cross-platform.

function Star({ cx, cy, r, fill }: { cx: number | string; cy: number | string; r: number | string; fill: string }) {
  cx = Number(cx);
  cy = Number(cy);
  r = Number(r);
  const points: string[] = [];
  for (let i = 0; i < 5; i++) {
    const outer = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const inner = outer + Math.PI / 5;
    points.push(`${cx + r * Math.cos(outer)},${cy + r * Math.sin(outer)}`);
    points.push(`${cx + r * 0.42 * Math.cos(inner)},${cy + r * 0.42 * Math.sin(inner)}`);
  }
  return <polygon points={points.join(" ")} fill={fill} />;
}

const FLAGS: Record<string, React.ReactNode> = {
  Brunei: (
    <>
      <rect width="30" height="20" fill="#FCD116" />
      <line x1="-2" y1="-1" x2="32" y2="19" stroke="#fff" strokeWidth="6" />
      <line x1="-2" y1="1" x2="32" y2="21" stroke="#000" strokeWidth="2.6" />
      <circle cx="15" cy="10" r="3.2" fill="#CE1126" />
    </>
  ),
  Cambodia: (
    <>
      <rect width="30" height="20" fill="#032EA1" />
      <rect y="5" width="30" height="10" fill="#E00025" />
      <rect x="10" y="7.5" width="2.5" height="5" fill="#fff" />
      <rect x="13.75" y="6.5" width="2.5" height="6" fill="#fff" />
      <rect x="17.5" y="7.5" width="2.5" height="5" fill="#fff" />
    </>
  ),
  Indonesia: (
    <>
      <rect width="30" height="10" fill="#CE1126" />
      <rect y="10" width="30" height="10" fill="#fff" />
    </>
  ),
  Laos: (
    <>
      <rect width="30" height="20" fill="#CE1126" />
      <rect y="5" width="30" height="10" fill="#002868" />
      <circle cx="15" cy="10" r="4" fill="#fff" />
    </>
  ),
  Malaysia: (
    <>
      <rect width="30" height="20" fill="#fff" />
      {Array.from({ length: 7 }).map((_, i) => (
        <rect key={i} y={(i * 40) / 14} width="30" height={20 / 14} fill="#CC0001" />
      ))}
      <rect width="16" height="11" fill="#010066" />
      <circle cx="7" cy="5.5" r="3.4" fill="#FFCC00" />
      <circle cx="8.3" cy="5.5" r="2.9" fill="#010066" />
      <Star cx="12" cy="5.5" r="2" fill="#FFCC00" />
    </>
  ),
  Myanmar: (
    <>
      <rect width="30" height="6.67" fill="#FECB00" />
      <rect y="6.67" width="30" height="6.67" fill="#34B233" />
      <rect y="13.33" width="30" height="6.67" fill="#EA2839" />
      <Star cx="15" cy="10" r="4" fill="#fff" />
    </>
  ),
  Philippines: (
    <>
      <rect width="30" height="10" fill="#0038A8" />
      <rect y="10" width="30" height="10" fill="#CE1126" />
      <polygon points="0,0 0,20 13,10" fill="#fff" />
      <circle cx="5" cy="10" r="2.4" fill="#FCD116" />
      <Star cx="9.5" cy="3" r="1.1" fill="#FCD116" />
      <Star cx="9.5" cy="17" r="1.1" fill="#FCD116" />
      <Star cx="2" cy="10" r="1.1" fill="#FCD116" />
    </>
  ),
  Singapore: (
    <>
      <rect width="30" height="10" fill="#EE2536" />
      <rect y="10" width="30" height="10" fill="#fff" />
      <circle cx="7" cy="5" r="3.2" fill="#fff" />
      <circle cx="8.3" cy="5" r="2.7" fill="#EE2536" />
      <Star cx="11.5" cy="3.2" r="0.9" fill="#fff" />
      <Star cx="13" cy="5" r="0.9" fill="#fff" />
      <Star cx="12.5" cy="7.2" r="0.9" fill="#fff" />
      <Star cx="10" cy="7.6" r="0.9" fill="#fff" />
      <Star cx="9" cy="5.5" r="0.9" fill="#fff" />
    </>
  ),
  Thailand: (
    <>
      <rect width="30" height="20" fill="#A51931" />
      <rect y="3" width="30" height="14" fill="#fff" />
      <rect y="6" width="30" height="8" fill="#2D2A4A" />
    </>
  ),
  "Timor-Leste": (
    <>
      <rect width="30" height="20" fill="#DC241F" />
      <polygon points="0,0 0,20 18,10" fill="#FFC726" />
      <polygon points="0,0 0,20 13,10" fill="#000" />
      <Star cx="5.5" cy="10" r="1.8" fill="#fff" />
    </>
  ),
  Vietnam: (
    <>
      <rect width="30" height="20" fill="#DA251D" />
      <Star cx="15" cy="10" r="5" fill="#FFFF00" />
    </>
  ),
};

export function CountryFlag({ country, className }: { country: string; className?: string }) {
  const flag = FLAGS[country];
  if (!flag) return null;
  return (
    <svg viewBox="0 0 30 20" className={className} preserveAspectRatio="xMidYMid slice" role="img" aria-label={`${country} flag`}>
      {flag}
    </svg>
  );
}
