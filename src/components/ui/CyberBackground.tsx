import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  z: number
  color: string
  speedZ: number
  size: number
}

/**
 * CyberBackground - интерактивный полноэкранный холст на Canvas.
 * Отрисовывает космический фон со звездным дрейфом и градиентными туманностями,
 * которые плавно смещаются при движении мыши (эффект 3D-параллакса).
 * Используется в качестве глобальной подложки сайта.
 */
export const CyberBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = window.innerWidth
    let height = window.innerHeight

    /**
     * Обрабатывает изменение размеров окна, растягивая холст
     * и подстраивая коэффициент масштабирования под плотность пикселей экрана (devicePixelRatio).
     */
    const handleResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * window.devicePixelRatio
      canvas.height = height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    // ─── Инициализация 3D-частиц (звёзд) ───
    const particles: Particle[] = []
    const particleCount = 75
    // Палитра свечения: циановый, красный, фиолетовый и белый цвета
    const colors = [
      'rgba(0, 240, 255, ',  // Циановый
      'rgba(230, 57, 80, ',  // Фирменный красный
      'rgba(168, 85, 247, ', // Фиолетовый
      'rgba(255, 255, 255, ' // Белый
    ]

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        // Разбрасываем координаты в пространстве шире текущего экрана
        x: (Math.random() - 0.5) * width * 2.5,
        y: (Math.random() - 0.5) * height * 2.5,
        z: Math.random() * 800 + 100, // Глубина
        color: colors[Math.floor(Math.random() * colors.length)],
        speedZ: Math.random() * 0.15 + 0.05, // Скорость приближения к камере
        size: Math.random() * 1.5 + 0.5
      })
    }

    // Переменные для сглаживания движения мыши (инерция параллакса)
    let targetMouseX = 0
    let targetMouseY = 0
    let mouseX = 0
    let mouseY = 0

    const handleMouseMove = (e: MouseEvent) => {
      // Переводим координаты мыши в диапазон от -1 до 1 относительно центра экрана
      targetMouseX = (e.clientX - width / 2) / (width / 2)
      targetMouseY = (e.clientY - height / 2) / (height / 2)
    }

    window.addEventListener('mousemove', handleMouseMove)

    const perspective = 400

    /**
     * Основной цикл рендеринга анимации Canvas
     */
    const render = () => {
      // Линейная интерполяция (lerp) для пружинного движения мыши
      mouseX += (targetMouseX - mouseX) * 0.06
      mouseY += (targetMouseY - mouseY) * 0.06

      // Очистка и заливка базовым космическим темным цветом
      ctx.fillStyle = '#020205'
      ctx.fillRect(0, 0, width, height)

      // ─── 1. Отрисовка космических туманностей с параллаксом ───
      
      // Туманность 1: Красное свечение сверху справа
      const redX = width * 0.8 - mouseX * 80
      const redY = height * 0.2 - mouseY * 80
      const redGrad = ctx.createRadialGradient(redX, redY, 50, redX, redY, 400)
      redGrad.addColorStop(0, 'rgba(230, 57, 80, 0.09)')
      redGrad.addColorStop(0.5, 'rgba(230, 57, 80, 0.03)')
      redGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = redGrad
      ctx.fillRect(0, 0, width, height)

      // Туманность 2: Циановое свечение снизу слева
      const cyanX = width * 0.2 - mouseX * 110
      const cyanY = height * 0.8 - mouseY * 110
      const cyanGrad = ctx.createRadialGradient(cyanX, cyanY, 50, cyanX, cyanY, 500)
      cyanGrad.addColorStop(0, 'rgba(0, 240, 255, 0.08)')
      cyanGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.025)')
      cyanGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = cyanGrad
      ctx.fillRect(0, 0, width, height)

      // Туманность 3: Фиолетовое свечение по центру
      const violetX = width * 0.5 - mouseX * 50
      const violetY = height * 0.5 - mouseY * 50
      const violetGrad = ctx.createRadialGradient(violetX, violetY, 50, violetX, violetY, 350)
      violetGrad.addColorStop(0, 'rgba(168, 85, 247, 0.07)')
      violetGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.025)')
      violetGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = violetGrad
      ctx.fillRect(0, 0, width, height)

      // ─── 2. Рендеринг и проекция 3D-звёзд ───
      particles.forEach(p => {
        // Звезды движутся на нас (уменьшаем глубину Z)
        p.z -= p.speedZ
        // Если звезда пролетела экран, сбрасываем её назад в глубину
        if (p.z <= 0) {
          p.z = 800 + Math.random() * 200
          p.x = (Math.random() - 0.5) * width * 2.5
          p.y = (Math.random() - 0.5) * height * 2.5
        }

        // Проекция 3D в 2D с учетом параллакса мыши (ближние звезды сдвигаются сильнее)
        const parallaxFactorX = mouseX * (1000 - p.z) * 0.12
        const parallaxFactorY = mouseY * (1000 - p.z) * 0.12

        const scale = perspective / (perspective + p.z)
        const projX = (p.x - parallaxFactorX) * scale + width / 2
        const projY = (p.y - parallaxFactorY) * scale + height / 2

        // Рисуем звезду, если она попала в видимую область экрана
        if (projX >= 0 && projX <= width && projY >= 0 && projY <= height) {
          const depthRatio = (1000 - p.z) / 1000 // 0 (вдали) до 1 (вблизи)
          const alpha = depthRatio * 0.65
          const size = p.size * (0.8 + depthRatio * 1.5)

          ctx.fillStyle = `${p.color}${alpha})`
          ctx.beginPath()
          ctx.arc(projX, projY, size, 0, Math.PI * 2)
          ctx.fill()

          // Эффект мягкого свечения для ближних крупных звезд
          if (p.z < 300) {
            ctx.fillStyle = `${p.color}${alpha * 0.25})`
            ctx.beginPath()
            ctx.arc(projX, projY, size * 3, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        display: 'block'
      }}
    />
  )
}
