/**
 * VEIL — Custom SVG Icon System
 * ═══════════════════════════════
 * Уникальные иконки, не встречающиеся ни в одном другом VPN.
 * Каждая иконка оптимизирована для 24×24 viewBox.
 */

// ═══ VEIL Shield Logo (кастомная) ═══
export function VeilLogo({ size = 28, color = 'currentColor', glow = false, ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" {...p}>
      {glow && (
        <defs>
          <filter id="glow-logo">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
      )}
      <g filter={glow ? 'url(#glow-logo)' : undefined}>
        {/* Outer shield */}
        <path d="M16 2L4 8v8c0 6.6 5.1 12.8 12 14 6.9-1.2 12-7.4 12-14V8L16 2z" 
          stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Inner keyhole */}
        <circle cx="16" cy="13" r="3.5" stroke={color} strokeWidth="1.6" fill="none" />
        <path d="M16 16.5v4.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        {/* Lock shine */}
        <path d="M12.5 9.5l1.5 1.5" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      </g>
    </svg>
  );
}

// ═══ Encrypted Tunnel (custom animation-ready) ═══
export function TunnelIcon({ size = 22, color = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      {/* Tunnel rings */}
      <ellipse cx="12" cy="12" rx="10" ry="8" stroke={color} strokeWidth="1.4" opacity="0.2" />
      <ellipse cx="12" cy="12" rx="7" ry="5.5" stroke={color} strokeWidth="1.4" opacity="0.4" />
      <ellipse cx="12" cy="12" rx="4" ry="3" stroke={color} strokeWidth="1.4" opacity="0.7" />
      {/* Data stream arrow */}
      <path d="M12 7v10M9 14l3 3 3-3" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ═══ Stealth Eye (DPI evasion) ═══
export function StealthIcon({ size = 22, color = 'currentColor', active = false, ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      {active ? (
        <>
          {/* Invisible — crossed eye */}
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
          <line x1="1" y1="1" x2="23" y2="23" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
        </>
      ) : (
        <>
          {/* Visible eye */}
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="1.6" />
          <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.6" />
        </>
      )}
    </svg>
  );
}

// ═══ Signal Strength (кастомные бары) ═══
export function SignalBars({ level = 3, size = 18, color = 'var(--green)', ...p }) {
  const bars = [
    { x: 1, h: 6, opacity: level >= 1 ? 1 : 0.2 },
    { x: 6, h: 10, opacity: level >= 2 ? 1 : 0.2 },
    { x: 11, h: 14, opacity: level >= 3 ? 1 : 0.2 },
    { x: 16, h: 18, opacity: level >= 4 ? 1 : 0.2 },
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 22 20" fill="none" {...p}>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={20 - b.h} width="3.5" height={b.h} rx="1.5" fill={color} opacity={b.opacity} />
      ))}
    </svg>
  );
}

// ═══ Encrypted Lock (animated) ═══
export function EncryptedLock({ size = 32, locked = true, color = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" {...p}>
      <defs>
        <linearGradient id="lock-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      {/* Lock body */}
      <rect x="8" y="14" width="16" height="13" rx="3" stroke="url(#lock-grad)" strokeWidth="1.8" fill="none" />
      {/* Shackle */}
      <path 
        d={locked ? "M11 14v-4a5 5 0 0 1 10 0v4" : "M11 14v-4a5 5 0 0 1 10 0v0"} 
        stroke="url(#lock-grad)" strokeWidth="1.8" strokeLinecap="round" fill="none" 
      />
      {/* Keyhole */}
      <circle cx="16" cy="20" r="1.8" fill={color} opacity="0.6" />
      <line x1="16" y1="21.5" x2="16" y2="24" stroke={color} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

// ═══ Orbit Loader (connecting animation) ═══
export function OrbitLoader({ size = 48, color = 'var(--accent)', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 50 50" fill="none" {...p}>
      <circle cx="25" cy="25" r="20" stroke={color} strokeWidth="1.5" opacity="0.15" />
      <circle cx="25" cy="25" r="20" stroke={color} strokeWidth="2.5" strokeDasharray="31.4 94.2" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" values="0 25 25;360 25 25" dur="1.2s" repeatCount="indefinite" />
      </circle>
      <circle cx="25" cy="25" r="12" stroke={color} strokeWidth="1.5" strokeDasharray="18.9 56.5" strokeLinecap="round" opacity="0.5">
        <animateTransform attributeName="transform" type="rotate" values="360 25 25;0 25 25" dur="1.8s" repeatCount="indefinite" />
      </circle>
      <circle cx="25" cy="5" r="2.5" fill={color}>
        <animateTransform attributeName="transform" type="rotate" values="0 25 25;360 25 25" dur="1.2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

// ═══ Data Flow (traffic indicator) ═══
export function DataFlow({ size = 20, direction = 'down', color = 'var(--green)', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      {direction === 'down' ? (
        <>
          <path d="M12 3v14M7 13l5 5 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="5" y1="21" x2="19" y2="21" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        </>
      ) : (
        <>
          <path d="M12 21V7M7 11l5-5 5 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="5" y1="3" x2="19" y2="3" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        </>
      )}
    </svg>
  );
}

// ═══ Fingerprint (browser fingerprint icon) ═══
export function FingerprintIcon({ size = 20, color = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M2 12.5C2 7.25 6.25 3 11.5 3a9.5 9.5 0 0 1 9.5 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      <path d="M5 12.5C5 8.91 7.91 6 11.5 6A6.5 6.5 0 0 1 18 11" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path d="M8 12.5a3.5 3.5 0 0 1 7 0v2" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <path d="M11.5 12.5v5.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 17c0 2.5 1.5 4 3.5 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <path d="M15 14.5c0 3-1 5-3.5 6.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

// ═══ Globe Encrypted (modified globe with lock) ═══
export function GlobeEncrypted({ size = 22, color = 'currentColor', ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.4" opacity="0.3" />
      <ellipse cx="12" cy="12" rx="4" ry="10" stroke={color} strokeWidth="1.4" opacity="0.5" />
      <path d="M2 12h20" stroke={color} strokeWidth="1.2" opacity="0.3" />
      <path d="M4 7h16M4 17h16" stroke={color} strokeWidth="1" opacity="0.2" />
      {/* Mini lock overlay */}
      <rect x="15" y="15" width="7" height="5.5" rx="1.5" fill="var(--bg-primary)" stroke={color} strokeWidth="1.2" />
      <path d="M17 15v-1.5a1.5 1.5 0 0 1 3 0V15" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="18.5" cy="18" r="0.7" fill={color} />
    </svg>
  );
}

// ═══ Speedometer gauge ═══
export function SpeedGauge({ size = 20, value = 0.5, color = 'var(--green)', ...p }) {
  const angle = -135 + (value * 270); // -135 to 135 degrees
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
      {/* Arc background */}
      <path d="M4.93 19.07A10 10 0 0 1 2 12a10 10 0 0 1 10-10 10 10 0 0 1 10 10c0 2.76-1.12 5.26-2.93 7.07" 
        stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.15" />
      {/* Tick marks */}
      <circle cx="12" cy="12" r="1.5" fill={color} opacity="0.7" />
      {/* Needle */}
      <line 
        x1="12" y1="12" 
        x2={12 + 7 * Math.cos((angle * Math.PI) / 180)} 
        y2={12 + 7 * Math.sin((angle * Math.PI) / 180)} 
        stroke={color} strokeWidth="2" strokeLinecap="round" 
      />
    </svg>
  );
}
