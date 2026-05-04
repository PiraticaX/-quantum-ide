import { useEffect, useRef } from 'react'

interface BlochSphereProps {
  x: number
  y: number
  z: number
  label: string
  size?: number
}

export function BlochSphere({ x, y, z, label, size = 90 }: BlochSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const s = size * dpr
    canvas.width = s
    canvas.height = s
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)

    const cx = size / 2, cy = size / 2, r = size * 0.42

    ctx.clearRect(0, 0, size, size)

    // Outer glow
    const grd = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.1)
    grd.addColorStop(0, 'rgba(79,140,255,0.0)')
    grd.addColorStop(1, 'rgba(79,140,255,0.04)')
    ctx.fillStyle = grd
    ctx.beginPath()
    ctx.arc(cx, cy, r * 1.1, 0, Math.PI * 2)
    ctx.fill()

    // Sphere outline
    ctx.strokeStyle = '#1E2A3A'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()

    // Equator ellipse
    ctx.strokeStyle = '#172030'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.ellipse(cx, cy, r, r * 0.32, 0, 0, Math.PI * 2)
    ctx.stroke()

    // Axis lines
    ctx.strokeStyle = '#172030'
    ctx.lineWidth = 0.8
    ctx.setLineDash([2, 3])
    ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke()
    ctx.setLineDash([])

    // Axis labels
    ctx.font = `${size * 0.095}px JetBrains Mono, monospace`
    ctx.fillStyle = '#3A4A5C'
    ctx.textAlign = 'center'
    ctx.fillText('+Z', cx, cy - r - 3)
    ctx.fillText('-Z', cx, cy + r + 10)
    ctx.textAlign = 'left'
    ctx.fillText('+X', cx + r + 2, cy + 3)

    // State vector arrow
    // Map Bloch (x,y,z) to canvas 2D projection
    // Using simple orthographic: x→right, z→up, y→depth (scaled)
    const arrowX = cx + x * r * 0.72 + y * r * 0.18
    const arrowY = cy - z * r + y * r * 0.1

    // Shadow/trail
    ctx.strokeStyle = 'rgba(79,140,255,0.12)'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(arrowX, arrowY); ctx.stroke()

    // Main arrow shaft
    const grad = ctx.createLinearGradient(cx, cy, arrowX, arrowY)
    grad.addColorStop(0, 'rgba(79,140,255,0.6)')
    grad.addColorStop(1, '#4F8CFF')
    ctx.strokeStyle = grad
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(arrowX, arrowY); ctx.stroke()

    // Arrowhead
    const angle = Math.atan2(arrowY - cy, arrowX - cx)
    const headLen = 6
    ctx.fillStyle = '#4F8CFF'
    ctx.beginPath()
    ctx.moveTo(arrowX, arrowY)
    ctx.lineTo(
      arrowX - headLen * Math.cos(angle - 0.4),
      arrowY - headLen * Math.sin(angle - 0.4)
    )
    ctx.lineTo(
      arrowX - headLen * Math.cos(angle + 0.4),
      arrowY - headLen * Math.sin(angle + 0.4)
    )
    ctx.closePath()
    ctx.fill()

    // Bloch vector endpoint dot
    ctx.beginPath()
    ctx.arc(arrowX, arrowY, 3.5, 0, Math.PI * 2)
    const dotGrad = ctx.createRadialGradient(arrowX, arrowY, 0, arrowX, arrowY, 3.5)
    dotGrad.addColorStop(0, '#FFFFFF')
    dotGrad.addColorStop(0.5, '#7CFFB2')
    dotGrad.addColorStop(1, 'rgba(124,255,178,0.3)')
    ctx.fillStyle = dotGrad
    ctx.fill()

    // Origin dot
    ctx.beginPath()
    ctx.arc(cx, cy, 2, 0, Math.PI * 2)
    ctx.fillStyle = '#243048'
    ctx.fill()

    // Coordinates display
    const mag = Math.sqrt(x * x + y * y + z * z)
    ctx.font = `${size * 0.088}px JetBrains Mono, monospace`
    ctx.fillStyle = '#3A4A5C'
    ctx.textAlign = 'center'
    ctx.fillText(`|r|=${mag.toFixed(2)}`, cx, size - 2)

  }, [x, y, z, size])

  return (
    <div style={{ textAlign: 'center' }}>
      <canvas ref={canvasRef} style={{ display: 'block', margin: '0 auto' }} />
      <div style={{
        fontSize: 10, color: '#6B7280', fontFamily: 'JetBrains Mono, monospace',
        marginTop: 3, fontWeight: 600
      }}>
        {label}
      </div>
      <div style={{ fontSize: 9, color: '#3A4A5C', fontFamily: 'JetBrains Mono, monospace', marginTop: 1 }}>
        ({x.toFixed(2)}, {z.toFixed(2)})
      </div>
    </div>
  )
}
