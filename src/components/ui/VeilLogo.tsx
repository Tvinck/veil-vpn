

export const VeilLogo = ({ className = '' }: { className?: string }) => {
  return (
    <svg 
      className={`veil-logo-3d ${className}`}
      width="46" height="46" 
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e63950" />
          <stop offset="100%" stopColor="#b41c30" />
        </linearGradient>
        <linearGradient id="neonGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff4d6d" />
          <stop offset="100%" stopColor="#ff003c" />
        </linearGradient>
        <filter id="cyberGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Outer Glow */}
      <path 
        d="M50 5 L90 25 L90 60 C90 80 75 92 50 98 C25 92 10 80 10 60 L10 25 Z" 
        fill="url(#shieldGrad)" 
        stroke="url(#neonGlow)" 
        strokeWidth="3"
        filter="url(#cyberGlow)"
        opacity="0.9"
      />
      {/* Inner Mask Overlay */}
      <path 
        d="M50 15 L80 30 L80 60 C80 75 65 85 50 90 C35 85 20 75 20 60 L20 30 Z" 
        fill="#050102"
        opacity="0.8"
      />
      {/* V Letter Design inside Shield */}
      <path 
        d="M32 35 L50 72 L68 35" 
        fill="none" 
        stroke="url(#neonGlow)" 
        strokeWidth="7" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="animate-logo-shield"
      />
      {/* Cyber Eyes / Dots */}
      <circle cx="41" cy="45" r="3.5" fill="#fff" className="animate-logo-eyes" />
      <circle cx="59" cy="45" r="3.5" fill="#fff" className="animate-logo-eyes" />
    </svg>
  )
}
