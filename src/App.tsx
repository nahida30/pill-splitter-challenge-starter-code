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
  splitLevel?: number
}

export default function PillSplitter() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 })
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState<Point>({ x: 0, y: 0 })
  const [pills, setPills] = useState<Pill[]>([])
  const [nextZIndex, setNextZIndex] = useState(1)

  const [draggedPill, setDraggedPill] = useState<Pill | null>(null)
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 })
  const [showSplitLines, setShowSplitLines] = useState(true)
  const [hasDragged, setHasDragged] = useState(false)


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

  const findPillAtPoint = useCallback((point: Point): Pill | null => {
    const pillsAtPoint = pills.filter(pill => 
      point.x >= pill.x && point.x <= pill.x + pill.width && point.y >= pill.y && point.y <= pill.y + pill.height
    )

    return pillsAtPoint.reduce ((topPill, pill) => 
      !topPill || pill.zIndex > topPill.zIndex ? pill : topPill, null as Pill | null)
  }, [pills])
    const splitPillsAtLines = useCallback((clickX: number, clickY: number) => {
    const newPills: Pill[] = []

    pills.forEach(pill => {
      const pillLeft = pill.x
      const pillRight = pill.x + pill.width
      const pillTop = pill.y
      const pillBottom = pill.y + pill.height

      // Check if split lines intersect this pill
      const verticalIntersects = clickX > pillLeft && clickX < pillRight && 
                                clickY >= pillTop && clickY <= pillBottom
      const horizontalIntersects = clickY > pillTop && clickY < pillBottom && 
                                  clickX >= pillLeft && clickX <= pillRight

      if (verticalIntersects && horizontalIntersects) {
        // Both lines intersect - split into 4 parts
        const leftWidth = clickX - pill.x
        const rightWidth = pill.width - leftWidth
        const topHeight = clickY - pill.y
        const bottomHeight = pill.height - topHeight

        const currentSplitLevel = (pill.splitLevel || 0) + 1

        // Top-left part
        if (leftWidth >= 20 && topHeight >= 20) {
          newPills.push({
            ...pill,
            id: `${pill.id}-tl-${Date.now()}`,
            width: leftWidth,
            height: topHeight,
            zIndex: nextZIndex + newPills.length,
            splitLevel: currentSplitLevel
          })
        }

        // Top-right part
        if (rightWidth >= 20 && topHeight >= 20) {
          newPills.push({
            ...pill,
            id: `${pill.id}-tr-${Date.now()}`,
            x: clickX,
            width: rightWidth,
            height: topHeight,
            zIndex: nextZIndex + newPills.length,
            splitLevel: currentSplitLevel
          })
        }

        // Bottom-left part
        if (leftWidth >= 20 && bottomHeight >= 20) {
          newPills.push({
            ...pill,
            id: `${pill.id}-bl-${Date.now()}`,
            y: clickY,
            width: leftWidth,
            height: bottomHeight,
            zIndex: nextZIndex + newPills.length,
            splitLevel: currentSplitLevel
          })
        }

        // Bottom-right part
        if (rightWidth >= 20 && bottomHeight >= 20) {
          newPills.push({
            ...pill,
            id: `${pill.id}-br-${Date.now()}`,
            x: clickX,
            y: clickY,
            width: rightWidth,
            height: bottomHeight,
            zIndex: nextZIndex + newPills.length,
            splitLevel: currentSplitLevel
          })
        }

        // If no parts could be created (pill too small), just move the original
        if (newPills.filter(p => p.id.startsWith(pill.id)).length === 0) {
          newPills.push({
            ...pill,
            id: `${pill.id}-moved-${Date.now()}`,
            x: pill.x + (Math.random() - 0.5) * 20,
            y: pill.y + (Math.random() - 0.5) * 20,
            zIndex: nextZIndex + newPills.length,
            splitLevel: currentSplitLevel
          })
        }
      } else if (verticalIntersects) {
        // Only vertical line intersects - split into 2 parts (left/right)
        const leftWidth = clickX - pill.x
        const rightWidth = pill.width - leftWidth
        const currentSplitLevel = (pill.splitLevel || 0) + 1

        if (leftWidth >= 20 && rightWidth >= 20) {
          // Both parts are big enough
          newPills.push({
            ...pill,
            id: `${pill.id}-l-${Date.now()}`,
            width: leftWidth,
            zIndex: nextZIndex + newPills.length,
            splitLevel: currentSplitLevel
          })
          newPills.push({
            ...pill,
            id: `${pill.id}-r-${Date.now()}`,
            x: clickX,
            width: rightWidth,
            zIndex: nextZIndex + newPills.length,
            splitLevel: currentSplitLevel
          })
        } else {
          // Too small to split, move to one side
          const moveLeft = leftWidth < rightWidth
          newPills.push({
            ...pill,
            id: `${pill.id}-moved-${Date.now()}`,
            x: moveLeft ? pill.x - 10 : pill.x + 10,
            zIndex: nextZIndex + newPills.length,
            splitLevel: currentSplitLevel
          })
        }
      } else if (horizontalIntersects) {
        const topHeight = clickY - pill.y
        const bottomHeight = pill.height - topHeight
        const currentSplitLevel = (pill.splitLevel || 0) + 1

        if (topHeight >= 20 && bottomHeight >= 20) {
          // Both parts are big enough
          newPills.push({
            ...pill,
            id: `${pill.id}-t-${Date.now()}`,
            height: topHeight,
            zIndex: nextZIndex + newPills.length,
            splitLevel: currentSplitLevel
          })
          newPills.push({
            ...pill,
            id: `${pill.id}-b-${Date.now()}`,
            y: clickY,
            height: bottomHeight,
            zIndex: nextZIndex + newPills.length,
            splitLevel: currentSplitLevel
          })
        } else {
          // Too small to split, move to one side
          const moveUp = topHeight < bottomHeight
          newPills.push({
            ...pill,
            id: `${pill.id}-moved-${Date.now()}`,
            y: moveUp ? pill.y - 10 : pill.y + 10,
            zIndex: nextZIndex + newPills.length,
            splitLevel: currentSplitLevel
          })
        }
      } else {
        newPills.push(pill)
      }
    })

    setPills(newPills)
    setNextZIndex(prev => prev + 20) 
  }, [pills, nextZIndex])

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
            // isSplitPart: false
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
         {showSplitLines && (
          <>
            <div 
              className="absolute bg-gray-400 pointer-events-none z-50"
              style={{
                left: mousePos.x - 0.5,
                top: 0,
                width: 1,
                height: '100%',
                opacity: 0.7
              }}
            />
            <div 
              className="absolute bg-gray-400 pointer-events-none z-50"
              style={{
                left: 0,
                top: mousePos.y - 0.5,
                width: '100%',
                height: 1,
                opacity: 0.7
              }}
            />
          </>
        )}
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
    </div>
  )
}
