import { useEffect, useRef, useState } from 'react'

interface Pin {
  lat: number
  lon: number
  name: string
  x: number
  y: number
  z: number
}

/**
 * Компонент интерактивного 3D-глобуса, отображающего сетевую связность.
 * 
 * Использованные математические концепции:
 * 1. Распределение точек на сфере по Фибоначчи (Fibonacci Sphere):
 *    Обеспечивает равномерное распределение N точек на единичной сфере.
 *    Угол phi вычисляется через инверсию косинуса линейного распределения:
 *    \(\phi_i = \arccos(-1 + \frac{2i}{N})\)
 *    Золотой угол theta вычисляется с помощью золотого сечения для минимизации перекрытий:
 *    \(\theta_i = \sqrt{N \cdot \pi} \cdot \phi_i\)
 * 
 * 2. Перевод из сферических координат в декартовы:
 *    Широта (lat) и долгота (lon) переводятся в 3D координаты (x, y, z) на единичной сфере:
 *    \(x = \cos(lat) \cdot \sin(lon)\)
 *    \(y = -\sin(lat)\)
 *    \(z = \cos(lat) \cdot \cos(lon)\)
 * 
 * 3. 3D-вращение вокруг осей X и Y с использованием тригонометрических матриц поворота:
 *    \(x_{rotated} = x \cdot \cos(y) - z \cdot \sin(y)\)
 *    \(z_{temp} = z \cdot \cos(y) + x \cdot \sin(y)\)
 *    \(y_{rotated} = y \cdot \cos(x) - z_{temp} \cdot \sin(x)\)
 * 
 * 4. Перспективная проекция:
 *    3D координаты проецируются на 2D экран с учетом глубины Z (перспектива):
 *    \(scale = \frac{perspective}{perspective + z}\)
 *    \(screenX = x \cdot scale \cdot radius + width / 2\)
 *    \(screenY = y \cdot scale \cdot radius + height / 2\)
 */
export const WorldGlobe = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [projectedPins, setProjectedPins] = useState<any[]>([])

  // Совместные ссылки на параметры вращения для плавного рендеринга и обработки перетаскивания
  const rotationRef = useRef({ x: 0.25, y: 0 })
  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    velocityX: 0,
    velocityY: 0,
    lastX: 0,
    lastY: 0
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Динамические параметры размера холста
    let width = 500
    let height = 500

    // Функция авто-масштабирования Canvas под размеры родительского контейнера (адаптивность)
    const updateSize = () => {
      if (containerRef.current && canvas) {
        const rect = containerRef.current.getBoundingClientRect()
        // Ограничиваем диаметр глобуса в пределах от 280px до 500px для мобильных устройств
        const currentSize = Math.max(280, Math.min(500, rect.width || 500))
        width = currentSize
        height = currentSize
        
        canvas.width = width * window.devicePixelRatio
        canvas.height = height * window.devicePixelRatio
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        
        ctx.resetTransform()
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)

    // IntersectionObserver для приостановки рендеринга, когда элемент скрыт из виду (оптимизация CPU/GPU)
    let isVisible = true
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting
      })
    }, { threshold: 0.05 })

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    // Генерация точек каркаса глобуса с помощью решетки Фибоначчи
    const dots: { x: number; y: number; z: number }[] = []
    const dotCount = 450
    for (let i = 0; i < dotCount; i++) {
      // phi регулирует сдвиг от полюса к полюсу (Z-координата)
      const phi = Math.acos(-1 + (2 * i) / dotCount)
      // theta закручивает спираль вокруг оси Y по золотому сечению
      const theta = Math.sqrt(dotCount * Math.PI) * phi
      dots.push({
        x: Math.cos(theta) * Math.sin(phi),
        y: Math.sin(theta) * Math.sin(phi),
        z: Math.cos(phi)
      })
    }

    // Coordinates of location pins on a unit sphere (lat, lon converted to Cartesian)
    const rawPins: Pin[] = [
      { lat: 0.65, lon: -1.66, name: 'США' },
      { lat: 0.96, lon: -0.05, name: 'Великобритания' },
      { lat: 0.89, lon: 0.16, name: 'Германия' },
      { lat: 0.70, lon: -0.05, name: 'Испания' },
      { lat: 1.05, lon: 0.26, name: 'Швеция' },
      { lat: 0.91, lon: 0.35, name: 'Польша' },
      { lat: 0.68, lon: 0.61, name: 'Турция' },
      { lat: 0.96, lon: 0.65, name: 'Россия' },
      { lat: -0.24, lon: -0.89, name: 'Бразилия' },
      { lat: 0.63, lon: 2.41, name: 'Япония' }
    ].map(p => {
      const x = Math.cos(p.lat) * Math.sin(p.lon)
      const y = -Math.sin(p.lat)
      const z = Math.cos(p.lat) * Math.cos(p.lon)
      return { name: p.name, x, y, z, lat: p.lat, lon: p.lon }
    })

    // Russia node for connection arches
    const russiaPin = rawPins.find(p => p.name === 'Россия')!
    const targetPins = rawPins.filter(p => p.name !== 'Россия' && p.name !== 'Бразилия' && p.name !== 'Япония')

    // Generate latitude & longitude grid rings
    // 5 latitude rings at constant z
    const gridLatitudeZ = [-0.6, -0.3, 0, 0.3, 0.6]
    const gridLongitudeAngles = [0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3]

    // Precalculate points for latitude rings
    const latitudeRings: { x: number; y: number; z: number }[][] = gridLatitudeZ.map(zVal => {
      const r = Math.sqrt(1 - zVal * zVal)
      const ringPoints: { x: number; y: number; z: number }[] = []
      const steps = 60
      for (let i = 0; i <= steps; i++) {
        const theta = (i / steps) * Math.PI * 2
        ringPoints.push({
          x: r * Math.cos(theta),
          y: r * Math.sin(theta),
          z: zVal
        })
      }
      return ringPoints
    })

    // Precalculate points for longitude rings
    const longitudeRings: { x: number; y: number; z: number }[][] = gridLongitudeAngles.map(ang => {
      const ringPoints: { x: number; y: number; z: number }[] = []
      const steps = 60
      for (let i = 0; i <= steps; i++) {
        const phi = (i / steps) * Math.PI * 2
        ringPoints.push({
          x: Math.sin(phi) * Math.sin(ang),
          y: Math.cos(phi),
          z: Math.sin(phi) * Math.cos(ang)
        })
      }
      return ringPoints
    })

    let pulseTime = 0
    let reqId: number

    const render = () => {
      // Если глобус скрыт, пропускаем расчет физики и перерисовку
      if (!isVisible) {
        reqId = requestAnimationFrame(render)
        return
      }
      ctx.clearRect(0, 0, width, height)

      // Apply drag velocities & friction
      const drag = dragRef.current
      const rotation = rotationRef.current

      if (drag.isDragging) {
        drag.velocityX = 0
        drag.velocityY = 0
      } else {
        // Friction / Damping
        drag.velocityX *= 0.95
        drag.velocityY *= 0.95

        // Add auto-rotation drag friction and natural slow spin
        rotation.y += drag.velocityX + 0.0018
        rotation.x += drag.velocityY
        // Keep pitch X rotation within logical bounds (-65deg to 65deg)
        rotation.x = Math.max(-1.1, Math.min(1.1, rotation.x))
      }

      const rotY = rotation.y
      const rotX = rotation.x

      const cosY = Math.cos(rotY), sinY = Math.sin(rotY)
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX)

      const radius = (width / 500) * 175 // Пропорциональное изменение радиуса при изменении размеров canvas
      const perspective = 500

      // Helper function to rotate 3D point
      const rotatePoint = (pt: { x: number; y: number; z: number }) => {
        // Y rotation
        const x1 = pt.x * cosY - pt.z * sinY
        const z1 = pt.z * cosY + pt.x * sinY
        // X rotation
        const y2 = pt.y * cosX - z1 * sinX
        const z2 = z1 * cosX + pt.y * sinX
        return { x: x1, y: y2, z: z2 }
      }

      // Helper function to project rotated 3D point
      const projectPoint = (rotated: { x: number; y: number; z: number }) => {
        const scale = perspective / (perspective + rotated.z)
        const x = rotated.x * scale * radius + width / 2
        const y = rotated.y * scale * radius + height / 2
        return { x, y, scale }
      }

      // ─── 1. SHADED OUTER ATMOSPHERE GLOW ───
      // We draw a gorgeous outer neon halo
      const outerGlow = ctx.createRadialGradient(width / 2, height / 2, radius * 0.9, width / 2, height / 2, radius * 1.25)
      outerGlow.addColorStop(0, 'rgba(230, 57, 80, 0.15)')
      outerGlow.addColorStop(0.3, 'rgba(230, 57, 80, 0.06)')
      outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = outerGlow
      ctx.beginPath()
      ctx.arc(width / 2, height / 2, radius * 1.3, 0, Math.PI * 2)
      ctx.fill()

      // ─── 2. HOLOGRAPHIC 3D GRID LINES (BACK SEGMENTS FIRST) ───
      // We divide grid lines into small segments and draw them.
      // If a segment's rotated Z > 0, it's drawn with high transparency (back side).
      // If rotated Z <= 0, it's drawn brighter (front side).
      const drawGridRing = (points: { x: number; y: number; z: number }[]) => {
        for (let i = 0; i < points.length - 1; i++) {
          const pt1 = rotatePoint(points[i])
          const pt2 = rotatePoint(points[i + 1])
          const proj1 = projectPoint(pt1)
          const proj2 = projectPoint(pt2)

          const avgZ = (pt1.z + pt2.z) / 2
          const isBack = avgZ > 0.05

          ctx.beginPath()
          ctx.moveTo(proj1.x, proj1.y)
          ctx.lineTo(proj2.x, proj2.y)
          ctx.lineWidth = isBack ? 0.75 : 1.25
          ctx.strokeStyle = isBack
            ? 'rgba(230, 57, 80, 0.03)'
            : 'rgba(0, 240, 255, 0.08)' // Cyan front lines, red back lines
          ctx.stroke()
        }
      }

      latitudeRings.forEach(drawGridRing)
      longitudeRings.forEach(drawGridRing)

      // ─── 3. SPHERE FIBONACCI DOT MATRIX ───
      // Sort and project dots
      const rotatedDots = dots.map(d => rotatePoint(d)).sort((a, b) => b.z - a.z)

      rotatedDots.forEach(d => {
        const proj = projectPoint(d)
        const opacityRatio = (d.z + 1.2) / 2.2 // 0 (back) to 1 (front)
        const size = 1.0 + opacityRatio * 1.5

        // Draw dots
        ctx.fillStyle = d.z > 0
          ? `rgba(230, 57, 80, ${0.05 + opacityRatio * 0.15})` // Dim red back dots
          : `rgba(230, 57, 80, ${0.12 + opacityRatio * 0.55})` // Bright front dots
        ctx.beginPath()
        ctx.arc(proj.x, proj.y, size, 0, Math.PI * 2)
        ctx.fill()
      })

      // ─── 4. РАСЧЕТ И ОТРИСОВКА 3D-ДУГ СВЯЗЕЙ СЕТИ ───
      // Дуги рисуются в виде квадратичных кривых Безье в 3D пространстве:
      // B(t) = (1-t)^2 * P0 + 2*(1-t)*t * P1 + t^2 * P2, где t от 0 до 1.
      // P0 - точка старта (Россия), P2 - точка назначения (сервер), P1 - вершина дуги (apex).
      pulseTime += 0.007
      
      targetPins.forEach((target, idx) => {
        const start = russiaPin
        const end = target

        // Находим среднюю векторную точку между стартом и концом для вычисления направления изгиба
        const midX = (start.x + end.x) / 2
        const midY = (start.y + end.y) / 2
        const midZ = (start.z + end.z) / 2
        const len = Math.sqrt(midX*midX + midY*midY + midZ*midZ)
        
        // Высота дуги (умножается на нормированный вектор середины, чтобы поднять дугу над поверхностью глобуса)
        const apexHeight = 1.38
        const apex = {
          x: (midX / len) * apexHeight,
          y: (midY / len) * apexHeight,
          z: (midZ / len) * apexHeight
        }

        // Вычисление точек дуги по квадратичной формуле Безье
        const steps = 30
        const curvePoints: { x: number; y: number; z: number }[] = []
        for (let i = 0; i <= steps; i++) {
          const t = i / steps
          const x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * apex.x + t * t * end.x
          const y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * apex.y + t * t * end.y
          const z = (1 - t) * (1 - t) * start.z + 2 * (1 - t) * t * apex.z + t * t * end.z
          curvePoints.push({ x, y, z })
        }

        // Отрисовка сегментов кривой Безье с интерполяцией прозрачности по глубине
        for (let i = 0; i < curvePoints.length - 1; i++) {
          const pt1 = rotatePoint(curvePoints[i])
          const pt2 = rotatePoint(curvePoints[i + 1])
          const proj1 = projectPoint(pt1)
          const proj2 = projectPoint(pt2)

          const avgZ = (pt1.z + pt2.z) / 2
          
          // Fade out segments on the backside of the sphere
          if (avgZ <= 0.22) {
            const depthOpacity = Math.max(0, 1 - (avgZ + 0.3) * 1.5)
            ctx.beginPath()
            ctx.moveTo(proj1.x, proj1.y)
            ctx.lineTo(proj2.x, proj2.y)
            ctx.lineWidth = 1.2
            
            // Neon cyan connection lines
            ctx.strokeStyle = `rgba(0, 240, 255, ${0.35 * depthOpacity})`
            ctx.stroke()
          }
        }

        // Draw animated traveling photon packet
        const tPulse = (pulseTime + idx * 0.23) % 1.0
        // Find position along curve
        const x = (1 - tPulse) * (1 - tPulse) * start.x + 2 * (1 - tPulse) * tPulse * apex.x + tPulse * tPulse * end.x
        const y = (1 - tPulse) * (1 - tPulse) * start.y + 2 * (1 - tPulse) * tPulse * apex.y + tPulse * tPulse * end.y
        const z = (1 - tPulse) * (1 - tPulse) * start.z + 2 * (1 - tPulse) * tPulse * apex.z + tPulse * tPulse * end.z
        
        const rotPulse = rotatePoint({ x, y, z })
        if (rotPulse.z <= 0.18) {
          const projPulse = projectPoint(rotPulse)
          const pulseOpacity = Math.max(0, 1 - (rotPulse.z + 0.3) * 1.5)

          ctx.shadowBlur = 8
          ctx.shadowColor = '#00f0ff'
          ctx.fillStyle = `rgba(255, 255, 255, ${pulseOpacity})`
          ctx.beginPath()
          ctx.arc(projPulse.x, projPulse.y, 3.5, 0, Math.PI * 2)
          ctx.fill()
          
          ctx.fillStyle = `rgba(0, 240, 255, ${0.4 * pulseOpacity})`
          ctx.beginPath()
          ctx.arc(projPulse.x, projPulse.y, 8, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0 // reset shadow
        }
      })

      // ─── 5. 3D GLOWING LOCATION BEACONS & MARKS ───
      const tempPins: any[] = []

      rawPins.forEach(p => {
        const rotBase = rotatePoint(p)
        
        // Draw coordinate spike rising vertically from the sphere surface
        const beaconHeight = 1.15
        const spikeEnd = {
          x: p.x * beaconHeight,
          y: p.y * beaconHeight,
          z: p.z * beaconHeight
        }
        const rotEnd = rotatePoint(spikeEnd)

        const projBase = projectPoint(rotBase)
        const projEnd = projectPoint(rotEnd)

        // Draw pin only if visible on the front sphere half
        if (rotBase.z <= 0.22) {
          const depthOpacity = Math.max(0, 1 - (rotBase.z + 0.3) * 1.5)

          // Draw the spike line (Russia has red spike, others cyan)
          const isRussia = p.name === 'Россия'
          const neonColor = isRussia ? '230, 57, 80' : '0, 240, 255'

          const spikeGrad = ctx.createLinearGradient(projBase.x, projBase.y, projEnd.x, projEnd.y)
          spikeGrad.addColorStop(0, `rgba(${neonColor}, 0)`)
          spikeGrad.addColorStop(0.7, `rgba(${neonColor}, ${0.5 * depthOpacity})`)
          spikeGrad.addColorStop(1, `rgba(255, 255, 255, ${0.85 * depthOpacity})`)

          ctx.beginPath()
          ctx.moveTo(projBase.x, projBase.y)
          ctx.lineTo(projEnd.x, projEnd.y)
          ctx.lineWidth = 1.5
          ctx.strokeStyle = spikeGrad
          ctx.stroke()

          // Draw the neon point on the sphere surface
          ctx.shadowBlur = 10
          ctx.shadowColor = isRussia ? '#e63950' : '#00f0ff'
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(projBase.x, projBase.y, 2.5, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0

          // Draw the glowing rings at the top of the spike
          ctx.fillStyle = `rgba(${neonColor}, ${0.45 * depthOpacity})`
          ctx.beginPath()
          ctx.arc(projEnd.x, projEnd.y, 5, 0, Math.PI * 2)
          ctx.fill()
          
          ctx.strokeStyle = `rgba(${neonColor}, ${0.8 * depthOpacity})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(projEnd.x, projEnd.y, 2, 0, Math.PI * 2)
          ctx.stroke()

          // Save coordinates for HTML text tags overlay
          tempPins.push({
            name: p.name,
            x: projEnd.x,
            y: projEnd.y,
            opacity: depthOpacity,
            isRussia
          })
        }
      })

      // ─── 6. SPHERICAL SHADING GRADIENT OVERLAY ───
      // Overlay dark lighting inside the circle to create actual 3D shadows on the sphere body
      const shadowGrad = ctx.createRadialGradient(
        width / 2 - radius * 0.2, 
        height / 2 - radius * 0.2, 
        radius * 0.4, 
        width / 2, 
        height / 2, 
        radius
      )
      shadowGrad.addColorStop(0, 'rgba(3, 3, 7, 0.0)')
      shadowGrad.addColorStop(0.65, 'rgba(3, 3, 7, 0.25)')
      shadowGrad.addColorStop(1, 'rgba(3, 3, 7, 0.75)') // Dark shadow on sphere horizon edges
      
      ctx.fillStyle = shadowGrad
      ctx.beginPath()
      ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2)
      ctx.fill()

      setProjectedPins(tempPins)
      reqId = requestAnimationFrame(render)
    }

    render()
    return () => {
      cancelAnimationFrame(reqId)
      window.removeEventListener('resize', updateSize)
      observer.disconnect()
    }
  }, [])

  // Drag interaction events
  const handleMouseDown = (e: React.MouseEvent) => {
    dragRef.current.isDragging = true
    dragRef.current.startX = e.clientX
    dragRef.current.startY = e.clientY
    dragRef.current.lastX = e.clientX
    dragRef.current.lastY = e.clientY
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const drag = dragRef.current
    if (!drag.isDragging) return

    const dx = e.clientX - drag.lastX
    const dy = e.clientY - drag.lastY

    rotationRef.current.y += dx * 0.0055
    rotationRef.current.x += dy * 0.0055

    drag.velocityX = dx * 0.0055
    drag.velocityY = dy * 0.0055

    drag.lastX = e.clientX
    drag.lastY = e.clientY
  }

  const handleMouseUpOrLeave = () => {
    dragRef.current.isDragging = false
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return
    const touch = e.touches[0]
    dragRef.current.isDragging = true
    dragRef.current.startX = touch.clientX
    dragRef.current.startY = touch.clientY
    dragRef.current.lastX = touch.clientX
    dragRef.current.lastY = touch.clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const drag = dragRef.current
    if (!drag.isDragging || e.touches.length === 0) return

    const touch = e.touches[0]
    const dx = touch.clientX - drag.lastX
    const dy = touch.clientY - drag.lastY

    rotationRef.current.y += dx * 0.0065
    rotationRef.current.x += dy * 0.0065

    drag.velocityX = dx * 0.0065
    drag.velocityY = dy * 0.0065

    drag.lastX = touch.clientX
    drag.lastY = touch.clientY
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUpOrLeave}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '500px',
        aspectRatio: '1/1',
        margin: '0 auto',
        userSelect: 'none',
        cursor: dragRef.current.isDragging ? 'grabbing' : 'grab'
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />

      {/* Floating Glassmorphic HTML Labels */}
      {projectedPins.map((pin, idx) => {
        const centerX = canvasRef.current ? canvasRef.current.clientWidth / 2 : 250
        const leftSide = pin.x < centerX
        const boxX = leftSide ? pin.x - 145 : pin.x + 18
        const boxY = pin.y - 15

        // Custom borders and glows for tags
        const tagBorderColor = pin.isRussia 
          ? 'rgba(230, 57, 80, 0.7)' 
          : 'rgba(0, 240, 255, 0.45)'

        const tagShadow = pin.isRussia
          ? '0 6px 20px rgba(0,0,0,0.65), 0 0 12px rgba(230,57,80,0.25)'
          : '0 6px 20px rgba(0,0,0,0.65), 0 0 12px rgba(0,240,255,0.15)'

        const tagColor = pin.isRussia ? '#ff4a6b' : '#00f0ff'

        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: `${boxX}px`,
              top: `${boxY}px`,
              opacity: pin.opacity,
              transition: 'opacity 0.12s ease',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              zIndex: 10,
              width: '130px',
              justifyContent: leftSide ? 'flex-end' : 'flex-start'
            }}
          >
            {leftSide ? (
              <>
                <div
                  style={{
                    padding: '5px 12px',
                    background: 'rgba(5, 6, 12, 0.82)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: `1.5px solid ${tagBorderColor}`,
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.78rem',
                    fontWeight: 900,
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap',
                    boxShadow: tagShadow,
                    fontFamily: 'var(--font-sans)',
                    order: 1
                  }}
                >
                  <span style={{ color: tagColor, marginRight: '4px' }}>●</span>
                  {pin.name}
                </div>
                <div
                  style={{
                    width: '14px',
                    height: '1.5px',
                    background: `linear-gradient(to right, ${tagBorderColor}, transparent)`,
                    order: 2,
                    flexShrink: 0
                  }}
                />
              </>
            ) : (
              <>
                <div
                  style={{
                    width: '14px',
                    height: '1.5px',
                    background: `linear-gradient(to left, ${tagBorderColor}, transparent)`,
                    order: 1,
                    flexShrink: 0
                  }}
                />
                <div
                  style={{
                    padding: '5px 12px',
                    background: 'rgba(5, 6, 12, 0.82)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: `1.5px solid ${tagBorderColor}`,
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.78rem',
                    fontWeight: 900,
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap',
                    boxShadow: tagShadow,
                    fontFamily: 'var(--font-sans)',
                    order: 2
                  }}
                >
                  <span style={{ color: tagColor, marginRight: '4px' }}>●</span>
                  {pin.name}
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
