

export const WorldGlobe = () => {
  // Переведенные названия локаций
  const pins = [
    { x: 380, y: 160, name: 'США',       left: true  },
    { x: 440, y: 120, name: 'Великобритания', left: false },
    { x: 480, y: 150, name: 'Германия',  left: false },
    { x: 430, y: 190, name: 'Испания',   left: true  },
    { x: 530, y: 140, name: 'Швеция',    left: false },
    { x: 510, y: 180, name: 'Польша',    left: false },
    { x: 540, y: 220, name: 'Турция',    left: false },
    { x: 610, y: 160, name: 'Россия',    left: false },
    { x: 250, y: 220, name: 'Бразилия',  left: true  },
    { x: 680, y: 260, name: 'Япония',    left: false },
  ]

  const CX = 440, CY = 280, R = 240

  // Генерация точек для круглой сферы
  const allDots: { x: number; y: number }[] = []
  for (let row = 0; row <= 26; row++) {
    const y = CY - R + (row / 26) * R * 2
    const ratio = Math.sqrt(Math.max(0, 1 - ((y - CY) / R) ** 2))
    const w = R * ratio
    const numDots = Math.round(50 * ratio)
    for (let col = 0; col <= numDots; col++) {
      const x = CX - w + (col / Math.max(numDots, 1)) * w * 2
      allDots.push({ x, y })
    }
  }

  return (
    <svg viewBox="0 0 880 560" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: '860px', display: 'block' }}>
      <defs>
        <radialGradient id="gSurface" cx="42%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#270a12" />
          <stop offset="55%" stopColor="#100406" />
          <stop offset="100%" stopColor="#06020400" />
        </radialGradient>
        <radialGradient id="gBottomGlow" cx="50%" cy="95%" r="55%">
          <stop offset="0%" stopColor="#e63950" stopOpacity="0.85" />
          <stop offset="35%" stopColor="#e63950" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#e63950" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="gCenterGlow" cx="50%" cy="58%" r="48%">
          <stop offset="0%" stopColor="#e63950" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#e63950" stopOpacity="0" />
        </radialGradient>
        <clipPath id="cpGlobe">
          <circle cx={CX} cy={CY} r={R} />
        </clipPath>
        <filter id="fPinGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Globe base fill */}
      <circle cx={CX} cy={CY} r={R} fill="url(#gSurface)" />

      {/* Dot matrix */}
      <g clipPath="url(#cpGlobe)">
        {allDots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r="2"
            fill="#e63950"
            opacity={d.y > CY + 60 ? 0.6 : 0.25} />
        ))}
      </g>

      {/* Latitude grid lines (curved) */}
      <g clipPath="url(#cpGlobe)" stroke="#e63950" strokeWidth="0.7" fill="none" opacity="0.14">
        {[-180, -120, -60, 0, 60, 120, 180].map((dy, i) => {
          const y = CY + dy
          const ratio = Math.sqrt(Math.max(0, 1 - ((y - CY) / R) ** 2))
          return <ellipse key={i} cx={CX} cy={y} rx={R * ratio} ry={15 * ratio + 2} />
        })}
      </g>

      {/* Longitude grid lines (curved) */}
      <g clipPath="url(#cpGlobe)" stroke="#e63950" strokeWidth="0.7" fill="none" opacity="0.11">
        {[-180, -120, -60, 0, 60, 120, 180].map((dx, i) => {
          const scaleX = 1 - Math.abs(dx) / 240
          return <ellipse key={i} cx={CX + dx} cy={CY} rx={R * scaleX * 0.15 + 4} ry={R} />
        })}
      </g>

      {/* Bottom red glow */}
      <ellipse cx={CX} cy={540} rx={330} ry={145} fill="url(#gBottomGlow)" />
      {/* Center ambient */}
      <circle cx={CX} cy={CY} r={220} fill="url(#gCenterGlow)" />

      {/* Location Pins */}
      {pins.map((p, i) => {
        const textLen = p.name.length * 7.5
        const boxW = Math.max(70, textLen + 16)
        const boxH = 22
        const boxX = p.left ? p.x - boxW - 12 : p.x + 12
        const boxY = p.y - 28
        return (
          <g key={i} filter="url(#fPinGlow)">
            <circle cx={p.x} cy={p.y} r="14" fill="#e63950" opacity="0.15" />
            <circle cx={p.x} cy={p.y} r="7"  fill="#e63950" opacity="0.95" />
            <circle cx={p.x} cy={p.y} r="3" fill="#ff8fa3" />
            <rect x={boxX} y={boxY} width={boxW} height={boxH} rx="6"
              fill="rgba(8,4,6,0.95)" stroke="rgba(230,57,80,0.6)" strokeWidth="1" />
            <text x={boxX + boxW / 2} y={boxY + 14.5} textAnchor="middle"
              fill="white" fontSize="10.5" fontFamily="Inter, sans-serif" fontWeight="700">
              {p.name}
            </text>
            <line x1={p.x} y1={p.y - 7} x2={p.left ? p.x - 12 : p.x + 12} y2={boxY + boxH}
              stroke="#e63950" strokeWidth="1" opacity="0.6" />
          </g>
        )
      })}
    </svg>
  )
}
