import { useState, MouseEvent, CSSProperties } from 'react'

export function useMouseGlow() {
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  return {
    handleMouseMove,
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
    style: {
      '--mouse-x': `${coords.x}px`,
      '--mouse-y': `${coords.y}px`,
      position: 'relative'
    } as CSSProperties,
    isHovered
  }
}
