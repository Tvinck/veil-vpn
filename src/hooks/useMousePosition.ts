import { useState, useEffect, RefObject } from 'react'

/**
 * Кастомный React-хук для отслеживания относительной позиции курсора мыши (useMousePosition).
 * 
 * Вычисляет координаты мыши (x, y) относительно левого верхнего угла целевого HTML-элемента,
 * используя getBoundingClientRect(). Это позволяет корректно применять локальные графические эффекты
 * (например, наклоны карточек, локальные блики).
 * 
 * @param {RefObject<HTMLElement>} ref - Ссылка на отслеживаемый HTML-элемент
 * @returns {{x: number, y: number}} Относительные координаты мыши
 */
export function useMousePosition(ref: RefObject<HTMLElement>) {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      setPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }

    const element = ref.current
    if (element) {
      element.addEventListener('mousemove', handleMouseMove)
    }

    return () => {
      if (element) {
        element.removeEventListener('mousemove', handleMouseMove)
      }
    }
  }, [ref])

  return position
}
