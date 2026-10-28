/**
 * The TechLab mark: an angled `</>` monogram inside a rounded gradient tile.
 * Inlined as SVG so it needs no extra network request and inherits the theme.
 */
export function Logo({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} role="img" aria-label="TechLab">
      <defs>
        <linearGradient id="techlab-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4da3ff" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#techlab-logo)" />
      <path
        d="M15.5 12.5 9 20l6.5 7.5M24.5 12.5 31 20l-6.5 7.5M22.5 9.5 17.5 30.5"
        fill="none"
        stroke="#04101f"
        strokeWidth="2.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
