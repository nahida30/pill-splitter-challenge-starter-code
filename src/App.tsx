"use client"

import { useRef, useEffect, useState, useCallback } from 'react'
import './index.css'

interface Point {
  x: number
  y: number
}

interface Pill {
  id: string
  x: number
  y: number
  width: number
  height: number
  color: string
  isDragging?: boolean
  zIndex: number
  isSplitPart?: boolean
}

export default function PillSplitter() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 })
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState<Point>({ x: 0, y: 0 })
  const [pills, setPills] = useState<Pill[]>([])
  const [nextZIndex, setNextZIndex] = useState(1)

  const getContainerCoordinates = useCallback((e: MouseEvent): Point => {
    const container = containerRef.current
    if (!container) return { x: 0, y: 0 }
    const rect = container.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }, [])

  const getRandomColor = useCallback(() => {
    const colors = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
      '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
      '#10ac84', '#ee5a24', '#0abde3', '#3867d6', '#8854d0'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseMove = (e: MouseEvent) => {
      const pos = getContainerCoordinates(e)
      setMousePos(pos)
    }

    const handleMouseDown = (e: MouseEvent) => {
      const pos = getContainerCoordinates(e)
      setIsDrawing(true)
      setStartPos(pos)
    }

    const handleMouseUp = (e: MouseEvent) => {
      const pos = getContainerCoordinates(e)

      if (isDrawing) {
        const width = Math.abs(pos.x - startPos.x)
        const height = Math.abs(pos.y - startPos.y)

        if (width >= 40 && height >= 40) {
          const newPill: Pill = {
            id: `pill-${Date.now()}`,
            x: Math.min(startPos.x, pos.x),
            y: Math.min(startPos.y, pos.y),
            width,
            height,
            color: getRandomColor(),
            zIndex: nextZIndex,
            isSplitPart: false
          }
          setPills(prev => [...prev, newPill])
          setNextZIndex(prev => prev + 1)
        }
        setIsDrawing(false)
      }
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mousedown', handleMouseDown)
    container.addEventListener('mouseup', handleMouseUp)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mousedown', handleMouseDown)
      container.removeEventListener('mouseup', handleMouseUp)
    }
  }, [getContainerCoordinates, isDrawing, startPos, nextZIndex, getRandomColor])

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col">
     

      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-crosshair"
        style={{ userSelect: 'none' }}
      >
        {/* Pills */}
        {pills.map(pill => (
          <div
            key={pill.id}
            className="absolute border-2 border-gray-800"
            style={{
              left: pill.x,
              top: pill.y,
              width: pill.width,
              height: pill.height,
              backgroundColor: pill.color,
              borderRadius: '20px',
              zIndex: pill.zIndex
            }}
          />
        ))}

        {/* Drawing Preview */}
        {isDrawing && (
          <div
            className="absolute border-2 border-dashed border-gray-600 pointer-events-none"
            style={{
              left: Math.min(startPos.x, mousePos.x),
              top: Math.min(startPos.y, mousePos.y),
              width: Math.abs(mousePos.x - startPos.x),
              height: Math.abs(mousePos.y - startPos.y),
              borderRadius: '20px',
              backgroundColor: 'rgba(0, 0, 0, 0.1)'
            }}
          />
        )}
      </div>

      <div className="bg-gray-100 p-2 text-xs text-gray-500 border-t">
        Mouse: ({mousePos.x.toFixed(0)}, {mousePos.y.toFixed(0)}) | 
        Pills: {pills.length} |
        {isDrawing && ' Drawing new pill...'}
      </div>
    </div>
  )
}
