import { useEffect, useRef } from 'react'

interface ProbHistogramProps {
  counts: Record<string, number>
  shots: number
}

export function ProbHistogram({ counts, shots }: ProbHistogramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const entries = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)

    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth || 260
    const H = 120
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.height = `${H}px`
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, W, H)

    if (entries.length === 0) return

    const maxCount = Math.max(...entries.map(e => e[1]))
    const barW = Math.min(32, (W - 20) / entries.length - 4)
    const totalW = entries.length * (barW + 4) - 4
    const startX = (W - totalW) / 2
    const chartH = H - 32
    const chartTop = 6

    entries.forEach(([state, count], i) => {
      const pct = count / shots
      const barH = Math.max(2, pct * chartH)
      const bx = startX + i * (barW + 4)
      const by = chartTop + chartH - barH

      // Bar background
      ctx.fillStyle = 'rgba(79,140,255,0.06)'
      ctx.fillRect(bx, chartTop, barW, chartH)

      // Bar fill gradient
      const grad = ctx.createLinearGradient(bx, by + barH, bx, by)
      grad.addColorStop(0, 'rgba(79,140,255,0.4)')
      grad.addColorStop(1, 'rgba(124,255,178,0.8)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.roundRect(bx, by, barW, barH, [3, 3, 0, 0])
      ctx.fill()

      // Bar top glow
      ctx.fillStyle = 'rgba(124,255,178,0.3)'
      ctx.fillRect(bx, by, barW, 2)

      // Percentage label above bar
      ctx.fillStyle = '#9AA4B2'
      ctx.font = '9px JetBrains Mono, monospace'
      ctx.textAlign = 'center'
      const pctStr = (pct * 100).toFixed(0) + '%'
      ctx.fillText(pctStr, bx + barW / 2, Math.max(chartTop + 10, by - 3))

      // State label below
      ctx.fillStyle = count === maxCount ? '#7CFFB2' : '#6B7280'
      ctx.font = `${barW < 24 ? 8 : 9}px JetBrains Mono, monospace`
      ctx.textAlign = 'center'
      ctx.fillText(state.length > 4 ? state.slice(-4) : state, bx + barW / 2, H - 4)
    })
  }, [counts, shots])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', display: 'block' }}
    />
  )
}
