/** Ilustrovane ikonice za izbor proizvoda (čisti SVG, bez emoji znakova). */
export function DualSenseIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 72" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ds-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#c9d4f2" />
        </linearGradient>
      </defs>
      {/* telo kontrolera */}
      <path d="M12 46c-3.5 9-1 17 5 17 3.600 0 6-3.200 8.500-8h21c2.500 4.800 4.900 8 8.500 8 6 0 8.500-8 5-17l-4.500-16c-1.200-4.200-4.500-6.500-8.800-6.500H25.300c-4.300 0-7.600 2.300-8.800 6.500z"
        fill="url(#ds-body)" stroke="#8fa3d9" strokeWidth="1.2" />
      {/* tamna središnja traka (DualSense) */}
      <path d="M24 23.500h24c3 0 5 1.800 5.300 4.500-1.500 6-5 9.500-11.300 9.500h-12c-6.300 0-9.800-3.500-11.300-9.500.3-2.700 2.300-4.500 5.300-4.500z" fill="#1b2550" />
      {/* touchpad i svetleća traka */}
      <rect x="28" y="26" width="16" height="8.500" rx="2.500" fill="#3a4a8c" />
      <path d="M25 24.600c3.500-2.200 6.800-3 11-3s7.500.8 11 3" fill="none" stroke="#5aa2ff" strokeWidth="2" strokeLinecap="round" />
      {/* d-pad */}
      <path d="M20.500 32.500v-3.500h3v3.500h3.500v3h-3.500V39h-3v-3.500H17v-3z" fill="#1b2550" transform="translate(-0.5 3)" />
      {/* tasteri */}
      <g fill="none" strokeWidth="1.700" strokeLinecap="round" strokeLinejoin="round" transform="translate(0 1)">
        <path d="M52.500 29.500l2.200 3.800h-4.400z" stroke="#2bb58a" />
        <circle cx="58" cy="37.500" r="2.200" stroke="#e5546a" />
        <path d="M49.300 35.300l4 4m0-4l-4 4" stroke="#3b82f6" />
        <rect x="45.500" y="32.200" width="4" height="4" rx=".6" stroke="#d96bb0" transform="translate(-0.3 5.700)" />
      </g>
      {/* analogni štapići */}
      <circle cx="29" cy="46" r="5" fill="#1b2550" /><circle cx="29" cy="46" r="3" fill="#4b5fa8" />
      <circle cx="43" cy="46" r="5" fill="#1b2550" /><circle cx="43" cy="46" r="3" fill="#4b5fa8" />
    </svg>
  );
}

export function PsPlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 72" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="psp-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe27a" /><stop offset="1" stopColor="#f5a800" />
        </linearGradient>
      </defs>
      <path d="M28 6h16c2.200 0 4 1.800 4 4v18h18c2.200 0 4 1.800 4 4v8c0 2.200-1.800 4-4 4H48v18c0 2.200-1.800 4-4 4H28c-2.200 0-4-1.800-4-4V44H6c-2.200 0-4-1.800-4-4v-8c0-2.200 1.800-4 4-4h18V10c0-2.200 1.800-4 4-4z"
        fill="url(#psp-gold)" stroke="#c98100" strokeWidth="1" transform="translate(0 0) rotate(0 36 36)" />
      <g fill="none" stroke="#8a5600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity=".85">
        <path d="M36 14.500l3.600 6.200h-7.200z" />
        <rect x="11" y="32.500" width="7" height="7" rx="1" />
        <circle cx="58" cy="36" r="3.800" />
        <path d="M32.500 52.500l7 7m0-7l-7 7" />
      </g>
    </svg>
  );
}
