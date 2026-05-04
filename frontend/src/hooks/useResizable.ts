import { useState, useCallback, useEffect } from 'react'

export function useResizable(
  initialLeft = 340,
  initialRight = 300,
  minLeft = 240,
  minRight = 220
) {
  const [leftWidth, setLeftWidth] = useState(initialLeft)
  const [rightWidth, setRightWidth] = useState(initialRight)

  const onDragLeft = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = leftWidth

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX
      setLeftWidth(Math.max(minLeft, Math.min(600, startW + delta)))
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [leftWidth, minLeft])

  const onDragRight = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = rightWidth

    const onMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX
      setRightWidth(Math.max(minRight, Math.min(500, startW + delta)))
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [rightWidth, minRight])

  return { leftWidth, rightWidth, onDragLeft, onDragRight }
}
