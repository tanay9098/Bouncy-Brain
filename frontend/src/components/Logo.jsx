const GRAD_ID_COUNTER = { n: 0 };

function useGradId() {
  return `jbg-${++GRAD_ID_COUNTER.n}`;
}

function JBIcon({ size = 32, variant = "color", gradId }) {
  const sw = size * 0.08;
  const r = size * 0.055;

  if (variant === "mono-dark") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="23" cy="23" r="5.5" fill="#111128"/>
        <path d="M 37 23 L 37 66 Q 37 80 20 80" stroke="#111128" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M 55 23 L 55 80" stroke="#111128" strokeWidth={sw} strokeLinecap="round"/>
        <path d="M 55 23 Q 78 23 78 38 Q 78 52 55 52" stroke="#111128" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M 55 52 Q 82 52 82 66 Q 82 80 55 80" stroke="#111128" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }

  if (variant === "mono-light") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="23" cy="23" r="5.5" fill="#ffffff"/>
        <path d="M 37 23 L 37 66 Q 37 80 20 80" stroke="#ffffff" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M 55 23 L 55 80" stroke="#ffffff" strokeWidth={sw} strokeLinecap="round"/>
        <path d="M 55 23 Q 78 23 78 38 Q 78 52 55 52" stroke="#ffffff" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M 55 52 Q 82 52 82 66 Q 82 80 55 80" stroke="#ffffff" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }

  const g = gradId;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id={g} x1="13" y1="17" x2="82" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7C3AED"/>
          <stop offset="42%" stopColor="#6366F1"/>
          <stop offset="100%" stopColor="#06B6D4"/>
        </linearGradient>
      </defs>
      <circle cx="23" cy="23" r="5.5" fill={`url(#${g})`}/>
      <path d="M 37 23 L 37 66 Q 37 80 20 80" stroke={`url(#${g})`} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 55 23 L 55 80" stroke={`url(#${g})`} strokeWidth={sw} strokeLinecap="round"/>
      <path d="M 55 23 Q 78 23 78 38 Q 78 52 55 52" stroke={`url(#${g})`} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 55 52 Q 82 52 82 66 Q 82 80 55 80" stroke={`url(#${g})`} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/**
 * JumpyBrain Logo component.
 *
 * variant: "icon" | "full" | "mono-light" | "mono-dark"
 * size: icon height in px (default 32)
 * showWordmark: whether to show "Jumpy Brain" text beside icon (default true for "full")
 */
export default function Logo({ variant = "icon", size = 32, className = "", style = {} }) {
  const gradId = `jbg-${size}-${variant}`;

  if (variant === "full") {
    return (
      <span
        className={`jb-logo-full ${className}`}
        style={{ display: "inline-flex", alignItems: "center", gap: size * 0.35, ...style }}
        role="img"
        aria-label="JumpyBrain"
      >
        <JBIcon size={size} variant="color" gradId={gradId} />
        <span style={{
          fontSize: size * 0.5,
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          color: "var(--text)",
        }}>
          <span style={{ color: "var(--text)" }}>Jumpy</span>
          <span style={{
            background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}> Brain</span>
        </span>
      </span>
    );
  }

  return (
    <span
      className={`jb-logo ${className}`}
      style={style}
      role="img"
      aria-label="JumpyBrain"
    >
      <JBIcon size={size} variant={variant} gradId={gradId} />
    </span>
  );
}
