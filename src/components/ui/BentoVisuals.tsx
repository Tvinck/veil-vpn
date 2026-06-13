import { useEffect, useRef } from 'react'

// ─── CARD 1 VISUAL: 3D WAVE / RIBBON ───
export const BentoWave = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let reqId: number
    let width = 0
    let height = 0

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      width = parent.clientWidth
      height = parent.clientHeight
      canvas.width = width * window.devicePixelRatio
      canvas.height = height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resize()
    window.addEventListener('resize', resize)

    let time = 0

    const render = () => {
      ctx.clearRect(0, 0, width, height)
      time += 0.03

      // Draw 3 waving 3D neon ribbons
      const ribbonsCount = 3
      const perspective = 300

      for (let r = 0; r < ribbonsCount; r++) {
        const strandOffset = r * (Math.PI / 1.5)
        const points: { x: number; y: number; z: number }[] = []

        // Generate points along the waving ribbon
        const steps = 40
        for (let i = 0; i <= steps; i++) {
          const t = i / steps
          const x = t * (width + 100) - 50
          const angle = t * Math.PI * 2.8 + time + strandOffset
          const y = Math.sin(angle) * 32 + height * 0.55
          const z = Math.cos(angle) * 32

          points.push({ x, y, z })
        }

        // Project and draw ribbon points as soft glowing spheres
        points.forEach(p => {
          const scale = perspective / (perspective + p.z)
          const size = (r === 0 ? 9 : r === 1 ? 7 : 5) * scale
          const opacity = Math.max(0.05, Math.min(0.65, (p.z + 50) / 100))

          // Draw neon purple-red gradient circle
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 2.5)
          if (r === 0) {
            grad.addColorStop(0, `rgba(230, 57, 80, ${opacity * 0.95})`) // Red
            grad.addColorStop(0.4, `rgba(168, 85, 247, ${opacity * 0.45})`) // Purple
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
          } else {
            grad.addColorStop(0, `rgba(0, 240, 255, ${opacity * 0.9})`) // Cyan
            grad.addColorStop(0.5, `rgba(168, 85, 247, ${opacity * 0.3})`) // Purple
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
          }

          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(p.x, p.y, size * 2.5, 0, Math.PI * 2)
          ctx.fill()

          // Specular highlight core
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.45})`
          ctx.beginPath()
          ctx.arc(p.x - size * 0.25, p.y - size * 0.25, size * 0.35, 0, Math.PI * 2)
          ctx.fill()
        })
      }

      reqId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(reqId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  )
}

// ─── CARD 2 VISUAL: 3D GLASS STAR / CROSS (Photo 1) ───
export const BentoGlassStar = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tiltRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = 220
    const height = 220
    canvas.width = width * window.devicePixelRatio
    canvas.height = height * window.devicePixelRatio
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    let reqId: number
    let time = 0

    // Setup mouse hover tracking on parent card
    const parent = canvas.closest('.sec-feature-card')
    const handleMouseMove = (e: Event) => {
      const mouseEvent = e as MouseEvent
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const x = mouseEvent.clientX - rect.left - rect.width / 2
      const y = mouseEvent.clientY - rect.top - rect.height / 2
      tiltRef.current.x = -y * 0.0035 // Tilt X pitch
      tiltRef.current.y = x * 0.0035 // Tilt Y yaw
    }

    const handleMouseLeave = () => {
      tiltRef.current.x = 0
      tiltRef.current.y = 0
    }

    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove)
      parent.addEventListener('mouseleave', handleMouseLeave)
    }

    // Generate 3D coordinates representing the 4-pointed cross legs
    const generateCrossPoints = () => {
      const pts: { x: number; y: number; z: number; r: number }[] = []
      const steps = 45

      const directions = [
        { dx: 1, dy: 0, dz: 0 },  // Right leg
        { dx: -1, dy: 0, dz: 0 }, // Left leg
        { dx: 0, dy: 1, dz: 0 },  // Bottom leg
        { dx: 0, dy: -1, dz: 0 }  // Top leg
      ]

      directions.forEach(dir => {
        for (let i = 0; i <= steps; i++) {
          const t = i / steps
          const dist = t * 45 // Length of leg
          
          // Organic cosine taper (flared at center, tapering at tip)
          const radius = 10 + 15 * Math.cos(t * Math.PI / 2)

          pts.push({
            x: dir.dx * dist,
            y: dir.dy * dist,
            z: dir.dz * dist,
            r: radius
          })
        }
      })

      // Add central sphere point
      pts.push({ x: 0, y: 0, z: 0, r: 25 })

      return pts
    }

    const crossPoints = generateCrossPoints()
    let currentTiltX = 0
    let currentTiltY = 0

    const render = () => {
      ctx.clearRect(0, 0, width, height)
      time += 0.012

      // Interpolate interactive hover tilt values
      currentTiltX += (tiltRef.current.x - currentTiltX) * 0.08
      currentTiltY += (tiltRef.current.y - currentTiltY) * 0.08

      // Slow idle rotation + hover tilts
      const rotX = Math.sin(time * 0.6) * 0.15 + currentTiltX + 0.15
      const rotY = time + currentTiltY
      const rotZ = Math.cos(time * 0.4) * 0.1 + currentTiltY * 0.5

      const cosX = Math.cos(rotX), sinX = Math.sin(rotX)
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY)
      const cosZ = Math.cos(rotZ), sinZ = Math.sin(rotZ)

      const perspective = 350
      const centerX = width / 2
      const centerY = height / 2

      // Project and sort cross spheres back-to-front
      const projected = crossPoints.map(p => {
        // Rotate Z
        let x1 = p.x * cosZ - p.y * sinZ
        let y1 = p.y * cosZ + p.x * sinZ
        let z1 = p.z

        // Rotate Y
        let x2 = x1 * cosY - z1 * sinY
        let z2 = z1 * cosY + x1 * sinY
        let y2 = y1

        // Rotate X
        let y3 = y2 * cosX - z2 * sinX
        let z3 = z2 * cosX + y2 * sinX

        const scale = perspective / (perspective + z3)
        const projX = x2 * scale + centerX
        const projY = y3 * scale + centerY
        const projR = p.r * scale

        return { x: projX, y: projY, z: z3, r: projR }
      }).sort((a, b) => b.z - a.z)

      // Render glass spheres with refraction highlight styling
      projected.forEach(p => {
        // Outer neon glow shadow
        ctx.shadowBlur = 12
        ctx.shadowColor = 'rgba(168, 85, 247, 0.45)' // Purple shadow

        const radial = ctx.createRadialGradient(
          p.x - p.r * 0.25, 
          p.y - p.r * 0.25, 
          0, 
          p.x, 
          p.y, 
          p.r
        )
        // Specular highlight center
        radial.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
        // Chrome refraction colors: light cyan -> pink -> purple
        radial.addColorStop(0.18, 'rgba(0, 240, 255, 0.7)')
        radial.addColorStop(0.45, 'rgba(230, 57, 80, 0.55)')
        radial.addColorStop(0.85, 'rgba(168, 85, 247, 0.35)')
        radial.addColorStop(1, 'rgba(10, 10, 20, 0.1)')

        ctx.fillStyle = radial
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.shadowBlur = 0 // reset shadow

        // Inner rim stroke to define glass thickness
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)'
        ctx.lineWidth = 0.8
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r - 0.5, 0, Math.PI * 2)
        ctx.stroke()

        // Tiny specular glare dot
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
        ctx.beginPath()
        ctx.arc(p.x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.15, 0, Math.PI * 2)
        ctx.fill()
      })

      reqId = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (parent) {
        parent.removeEventListener('mousemove', handleMouseMove)
        parent.removeEventListener('mouseleave', handleMouseLeave)
      }
      cancelAnimationFrame(reqId)
    }
  }, [])

  return (
    <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  )
}

// ─── CARD 3 VISUAL: 3D ROTATING GEAR ───
export const BentoGear = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let reqId: number
    let width = 0
    let height = 0

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      width = parent.clientWidth
      height = parent.clientHeight
      canvas.width = width * window.devicePixelRatio
      canvas.height = height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resize()
    window.addEventListener('resize', resize)

    let time = 0

    // Setup 3D Gear Model geometry
    const gearSegments = 160
    const teethCount = 7
    
    const render = () => {
      ctx.clearRect(0, 0, width, height)
      time += 0.009

      const gearRot = time
      const cosRot = Math.cos(gearRot), sinRot = Math.sin(gearRot)

      // Isometric view angles
      const pitch = 0.8 // tilt X forward
      const yaw = 0.5   // tilt Y sideward
      const cosP = Math.cos(pitch), sinP = Math.sin(pitch)
      const cosY = Math.cos(yaw), sinY = Math.sin(yaw)

      const perspective = 300
      const centerX = width * 0.68 // Position gear in right-bottom quadrant of card
      const centerY = height * 0.62

      // Draw gear in extruded Z slices (back to front) to give volumetric thickness
      const thickness = 28
      const layersCount = 12

      for (let l = 0; l < layersCount; l++) {
        // Z layer offset
        const zOffset = -thickness / 2 + (l / (layersCount - 1)) * thickness
        const depthRatio = l / (layersCount - 1) // 0 to 1

        const points: { x: number; y: number }[] = []

        for (let i = 0; i < gearSegments; i++) {
          const a = (i / gearSegments) * Math.PI * 2
          
          // Gear tooth radius formula (trapezoidal teeth)
          const toothFactor = Math.sin(a * teethCount)
          const rBase = 58
          const toothHeight = 12
          const r = rBase + toothHeight * Math.max(-0.4, Math.min(0.8, toothFactor * 4))

          // 3D coordinates relative to gear center
          const lx = r * Math.cos(a)
          const ly = r * Math.sin(a)
          const lz = zOffset

          // Rotate gear on its own Z-axis
          const xRot = lx * cosRot - ly * sinRot
          const yRot = ly * cosRot + lx * sinRot
          const zRot = lz

          // Rotate Pitch (X-axis)
          const xP = xRot
          const yP = yRot * cosP - zRot * sinP
          const zP = zRot * cosP + yRot * sinP

          // Rotate Yaw (Y-axis)
          const xY = xP * cosY - zP * sinY
          const zFinal = zP * cosY + xP * sinY
          const yFinal = yP

          // Perspective project
          const scale = perspective / (perspective + zFinal)
          const px = xY * scale + centerX
          const py = yFinal * scale + centerY

          points.push({ x: px, y: py })
        }

        // Draw gear slice outline
        ctx.beginPath()
        points.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y)
          else ctx.lineTo(p.x, p.y)
        })
        ctx.closePath()

        // Coloring: back slices are dark crimson shadow, front slices are bright crimson glow
        const rColor = Math.floor(100 + depthRatio * 130)
        const gColor = Math.floor(10 + depthRatio * 47)
        const bColor = Math.floor(25 + depthRatio * 55)
        const alpha = 0.05 + depthRatio * 0.35

        ctx.fillStyle = `rgba(${rColor}, ${gColor}, ${bColor}, ${alpha})`
        ctx.fill()

        ctx.strokeStyle = `rgba(230, 57, 80, ${0.03 + depthRatio * 0.15})`
        ctx.lineWidth = 1.0
        ctx.stroke()
      }

      reqId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(reqId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  )
}

// ─── CTA BANNER VISUAL: 3D WIREFRAME TORUS MESH ───
export const BentoTorus = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tiltRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let reqId: number
    let width = 0
    let height = 0

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      width = parent.clientWidth
      height = parent.clientHeight
      canvas.width = width * window.devicePixelRatio
      canvas.height = height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resize()
    window.addEventListener('resize', resize)

    // Setup mouse hover tracking on parent CTA banner
    const parent = canvas.closest('.sec-cta-banner')
    const handleMouseMove = (e: Event) => {
      const mouseEvent = e as MouseEvent
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const x = mouseEvent.clientX - rect.left - rect.width / 2
      const y = mouseEvent.clientY - rect.top - rect.height / 2
      tiltRef.current.x = -y * 0.002 // Pitch
      tiltRef.current.y = x * 0.002  // Yaw
    }

    const handleMouseLeave = () => {
      tiltRef.current.x = 0
      tiltRef.current.y = 0
    }

    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove)
      parent.addEventListener('mouseleave', handleMouseLeave)
    }

    let time = 0
    const R = 68  // Major radius
    const r = 25  // Minor radius
    const thetaSteps = 24
    const phiSteps = 12

    let currentTiltX = 0
    let currentTiltY = 0

    const render = () => {
      ctx.clearRect(0, 0, width, height)
      time += 0.008

      // Interpolate tilts
      currentTiltX += (tiltRef.current.x - currentTiltX) * 0.07
      currentTiltY += (tiltRef.current.y - currentTiltY) * 0.07

      const rotX = time * 0.4 + currentTiltX
      const rotY = time * 0.6 + currentTiltY
      const rotZ = time * 0.2

      const cosX = Math.cos(rotX), sinX = Math.sin(rotX)
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY)
      const cosZ = Math.cos(rotZ), sinZ = Math.sin(rotZ)

      const perspective = 300
      const centerX = width * 0.76 // Align torus to right side of CTA banner
      const centerY = height * 0.50

      // Helper to rotate 3D point
      const rotate = (pt: { x: number; y: number; z: number }) => {
        // Z-axis rotation
        let x1 = pt.x * cosZ - pt.y * sinZ
        let y1 = pt.y * cosZ + pt.x * sinZ
        let z1 = pt.z

        // Y-axis rotation
        let x2 = x1 * cosY - z1 * sinY
        let z2 = z1 * cosY + x1 * sinY
        let y2 = y1

        // X-axis rotation
        let y3 = y2 * cosX - z2 * sinX
        let z3 = z2 * cosX + y2 * sinX

        return { x: x2, y: y3, z: z3 }
      }

      // Generate grid of points on the Torus
      const mesh: { x: number; y: number; z: number }[][] = []
      for (let t = 0; t < thetaSteps; t++) {
        const theta = (t / thetaSteps) * Math.PI * 2
        const ring: { x: number; y: number; z: number }[] = []
        for (let p = 0; p < phiSteps; p++) {
          const phi = (p / phiSteps) * Math.PI * 2
          
          const x = (R + r * Math.cos(phi)) * Math.cos(theta)
          const y = (R + r * Math.cos(phi)) * Math.sin(theta)
          const z = r * Math.sin(phi)

          ring.push(rotate({ x, y, z }))
        }
        mesh.push(ring)
      }

      // Project points to 2D
      const projMesh = mesh.map(ring => 
        ring.map(pt => {
          const scale = perspective / (perspective + pt.z)
          const px = pt.x * scale + centerX
          const py = pt.y * scale + centerY
          return { x: px, y: py, z: pt.z }
        })
      )

      // Draw wireframe segments with depth shading
      // 1. Draw longitudinal lines connecting phi points
      for (let t = 0; t < thetaSteps; t++) {
        const nextT = (t + 1) % thetaSteps
        for (let p = 0; p < phiSteps; p++) {
          const nextP = (p + 1) % phiSteps

          const p1 = projMesh[t][p]
          const p2 = projMesh[nextT][p] // connection along major circle
          const p3 = projMesh[t][nextP] // connection along minor circle

          const avgZ1 = (p1.z + p2.z) / 2
          const isBack1 = avgZ1 > 0
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.lineWidth = isBack1 ? 0.6 : 1.1
          // Red-cyan wireframe gradient feel
          ctx.strokeStyle = isBack1 
            ? 'rgba(230, 57, 80, 0.05)' 
            : 'rgba(0, 240, 255, 0.16)'
          ctx.stroke()

          const avgZ2 = (p1.z + p3.z) / 2
          const isBack2 = avgZ2 > 0
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p3.x, p3.y)
          ctx.lineWidth = isBack2 ? 0.6 : 1.1
          ctx.strokeStyle = isBack2 
            ? 'rgba(230, 57, 80, 0.05)' 
            : 'rgba(168, 85, 247, 0.16)'
          ctx.stroke()
        }
      }

      reqId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', resize)
      if (parent) {
        parent.removeEventListener('mousemove', handleMouseMove)
        parent.removeEventListener('mouseleave', handleMouseLeave)
      }
      cancelAnimationFrame(reqId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  )
}

