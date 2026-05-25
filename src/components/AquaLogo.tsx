/** Logo vectorial siempre visible (no depende de archivos externos). */
export function AquaLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 48"
      className={`h-10 w-auto sm:h-11 ${className}`}
      role="img"
      aria-label="AQUA"
    >
      <defs>
        <linearGradient id="aquaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="20" fill="url(#aquaGrad)" />
      <path
        d="M12 28c4-8 8-12 12-12s8 4 12 12"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <text
        x="52"
        y="32"
        fill="#0f766e"
        fontFamily="system-ui, Segoe UI, sans-serif"
        fontSize="26"
        fontWeight="700"
        letterSpacing="2"
      >
        AQUA
      </text>
    </svg>
  );
}
