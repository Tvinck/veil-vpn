interface Props {
  className?: string
}

export const VeilLogo = ({ className = '' }: Props) => {
  return (
    <svg 
      className={`veil-logo-3d ${className}`}
      width="42" height="42" 
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e63950" />
          <stop offset="50%" stopColor="#ff007a" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        
        <linearGradient id="neonGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff4d6d" />
          <stop offset="100%" stopColor="#ff003c" />
        </linearGradient>
        
        <filter id="cyberGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 1. Animated Outer HUD Circle with dashes */}
      <circle 
        cx="50" 
        cy="50" 
        r="44" 
        fill="none" 
        stroke="url(#shieldGrad)" 
        strokeWidth="2.5" 
        strokeDasharray="14 10 4 10" 
        className="animate-logo-outer-hud" 
        filter="url(#cyberGlow)" 
        opacity="0.85"
      />

      {/* 2. Animated Inner HUD Radar Circle */}
      <circle 
        cx="50" 
        cy="50" 
        r="37" 
        fill="none" 
        stroke="rgba(255, 255, 255, 0.15)" 
        strokeWidth="1.2" 
        strokeDasharray="30 8" 
        className="animate-logo-inner-hud" 
      />

      {/* 3. Outer shield shell for 3D depth */}
      <polygon 
        points="50,18 78,32 78,64 50,82 22,64 22,32" 
        fill="rgba(8, 9, 20, 0.85)" 
        stroke="url(#shieldGrad)" 
        strokeWidth="1.5" 
        filter="url(#cyberGlow)"
      />

      {/* 4. Glowing core background */}
      <polygon 
        points="50,23 73,34 73,61 50,77 27,61 27,34" 
        fill="rgba(230, 57, 80, 0.05)" 
        stroke="rgba(255, 255, 255, 0.04)" 
        strokeWidth="1" 
      />

      {/* 5. Animated Vector V Inside Shield */}
      <path 
        d="M34 38 L50 66 L66 38" 
        fill="none" 
        stroke="#ffffff" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="animate-logo-v-glow"
      />
      <path 
        d="M34 38 L50 66 L66 38" 
        fill="none" 
        stroke="url(#neonGlow)" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />

      {/* 6. Glowing Tech dots */}
      <circle cx="50" cy="74" r="2.5" fill="#e63950" filter="url(#cyberGlow)" />
    </svg>
  )
}
