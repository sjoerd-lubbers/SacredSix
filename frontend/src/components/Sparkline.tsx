"use client"

import { useEffect, useRef } from "react"

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  strokeWidth?: number
  fillOpacity?: number
  className?: string
}

export function Sparkline({
  data,
  width = 100,
  height = 30,
  color = "#22c55e", // Green color by default
  strokeWidth = 1.5,
  fillOpacity = 0.2,
  className = ""
}: SparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data.length) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Find min and max values
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1 // Avoid division by zero

    // Calculate scaling factors
    const xScale = width / (data.length - 1 || 1) // Avoid division by zero
    const yScale = height / range

    // Start path
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = strokeWidth
    ctx.lineJoin = "round"

    // Draw line
    data.forEach((value, index) => {
      const x = index * xScale
      const y = height - ((value - min) * yScale)
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Fill area under the line
    if (fillOpacity > 0) {
      ctx.lineTo(width, height)
      ctx.lineTo(0, height)
      ctx.closePath()
      ctx.fillStyle = `${color}${Math.round(fillOpacity * 255).toString(16).padStart(2, '0')}`
      ctx.fill()
    }
  }, [data, width, height, color, strokeWidth, fillOpacity])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
    />
  )
}
