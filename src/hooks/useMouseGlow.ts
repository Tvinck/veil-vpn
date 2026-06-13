import { useState, MouseEvent, CSSProperties } from 'react'

/**
 * Кастомный React-хук для реализации эффекта интерактивного свечения вслед за курсором мыши.
 * Возвращает обработчики событий мыши и CSS-переменные с текущими координатами курсора
 * относительно элемента. Используется для Vercel/Batvai-style неоновых карточек.
 * 
 * @returns {{
 *   handleMouseMove: (e: MouseEvent<HTMLElement>) => void,
 *   onMouseEnter: () => void,
 *   onMouseLeave: () => void,
 *   style: CSSProperties,
 *   isHovered: boolean
 * }}
 */
export function useMouseGlow() {
  // Локальное состояние для координат мыши относительно левого верхнего угла элемента
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  /**
   * Вычисляет координаты курсора относительно контейнера при движении мыши
   * и сохраняет их в состояние.
   */
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
    // Возвращаем объект стилей, содержащий CSS-переменные для использования в стилях (:before, :after в CSS)
    style: {
      '--mouse-x': `${coords.x}px`,
      '--mouse-y': `${coords.y}px`,
      position: 'relative'
    } as CSSProperties,
    isHovered
  }
}
