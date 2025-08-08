"use client"

import { useRef, useEffect, useState, useCallback } from "react"

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
  zIndex: number
  splitLevel?: number // Track how many times this has been split
}

export default function PillSplitter() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 })
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState<Point>({ x: 0, y: 0 })
  const [pills, setPills] = useState<Pill[]>([])
  const [draggedPill, setDraggedPill] = useState<Pill | null>(null)
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 })
  const [showSplitLines, setShowSplitLines] = useState(true)
  const [nextZIndex, setNextZIndex] = useState(1)
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
    // Find the topmost pill at this point (highest z-index)
    const pillsAtPoint = pills.filter(pill => 
      point.x >= pill.x && point.x <= pill.x + pill.width &&
      point.y >= pill.y && point.y <= pill.y + pill.height
    )
    
    return pillsAtPoint.reduce((topPill, pill) => 
      !topPill || pill.zIndex > topPill.zIndex ? pill : topPill
    , null as Pill | null)
  }, [pills])

  const splitPillsAtLines = useCallback((clickX: number, clickY: number) => {
    const newPills: Pill[] = []
    let zIndexCounter = 0

    pills.forEach(pill => {
      const pillLeft = pill.x
      const pillRight = pill.x + pill.width
      const pillTop = pill.y
      const pillBottom = pill.y + pill.height

      // Check if split lines intersect this pill
      const verticalIntersects = clickX >= pillLeft && clickX <= pillRight && 
                                clickY >= pillTop && clickY <= pillBottom
      const horizontalIntersects = clickY >= pillTop && clickY <= pillBottom && 
                                  clickX >= pillLeft && clickX <= pillRight

      // Check if the vertical line passes through the pill (not just at edges)
      const verticalPassesThrough = clickX > pillLeft && clickX < pillRight && 
                                   clickY >= pillTop && clickY <= pillBottom

      // Check if the horizontal line passes through the pill (not just at edges)  
      const horizontalPassesThrough = clickY > pillTop && clickY < pillBottom && 
                                     clickX >= pillLeft && clickX <= pillRight

      if (verticalPassesThrough && horizontalPassesThrough) {
        // Both lines pass through - split into 4 parts
        const leftWidth = clickX - pill.x
        const rightWidth = pill.width - leftWidth
        const topHeight = clickY - pill.y
        const bottomHeight = pill.height - topHeight

        const currentSplitLevel = (pill.splitLevel || 0) + 1
        let partsCreated = 0

        if (leftWidth >= 20 && topHeight >= 20) {
          newPills.push({
            ...pill,
            id: `${pill.id}-tl-${Date.now()}-${Math.random()}`,
            width: leftWidth,
            height: topHeight,
            zIndex: nextZIndex + zIndexCounter++,
            splitLevel: currentSplitLevel
          })
          partsCreated++
        }

        if (rightWidth >= 20 && topHeight >= 20) {
          newPills.push({
            ...pill,
            id: `${pill.id}-tr-${Date.now()}-${Math.random()}`,
            x: clickX,
            width: rightWidth,
            height: topHeight,
            zIndex: nextZIndex + zIndexCounter++,
            splitLevel: currentSplitLevel
          })
          partsCreated++
        }

        if (leftWidth >= 20 && bottomHeight >= 20) {
          newPills.push({
            ...pill,
            id: `${pill.id}-bl-${Date.now()}-${Math.random()}`,
            y: clickY,
            width: leftWidth,
            height: bottomHeight,
            zIndex: nextZIndex + zIndexCounter++,
            splitLevel: currentSplitLevel
          })
          partsCreated++
        }

        if (rightWidth >= 20 && bottomHeight >= 20) {
          newPills.push({
            ...pill,
            id: `${pill.id}-br-${Date.now()}-${Math.random()}`,
            x: clickX,
            y: clickY,
            width: rightWidth,
            height: bottomHeight,
            zIndex: nextZIndex + zIndexCounter++,
            splitLevel: currentSplitLevel
          })
          partsCreated++
        }

        if (partsCreated === 0) {
          newPills.push(pill)
        }
      } else if (verticalPassesThrough) {
        const leftWidth = clickX - pill.x
        const rightWidth = pill.width - leftWidth
        const currentSplitLevel = (pill.splitLevel || 0) + 1

        if (leftWidth >= 20 && rightWidth >= 20) {
   
          newPills.push({
            ...pill,
            id: `${pill.id}-l-${Date.now()}-${Math.random()}`,
            width: leftWidth,
            zIndex: nextZIndex + zIndexCounter++,
            splitLevel: currentSplitLevel
          })
          newPills.push({
            ...pill,
            id: `${pill.id}-r-${Date.now()}-${Math.random()}`,
            x: clickX,
            width: rightWidth,
            zIndex: nextZIndex + zIndexCounter++,
            splitLevel: currentSplitLevel
          })
        } else {
          newPills.push(pill)
        }
      } else if (horizontalPassesThrough) {
        const topHeight = clickY - pill.y
        const bottomHeight = pill.height - topHeight
        const currentSplitLevel = (pill.splitLevel || 0) + 1

        if (topHeight >= 20 && bottomHeight >= 20) {
       
          newPills.push({
            ...pill,
            id: `${pill.id}-t-${Date.now()}-${Math.random()}`,
            height: topHeight,
            zIndex: nextZIndex + zIndexCounter++,
            splitLevel: currentSplitLevel
          })
          newPills.push({
            ...pill,
            id: `${pill.id}-b-${Date.now()}-${Math.random()}`,
            y: clickY,
            height: bottomHeight,
            zIndex: nextZIndex + zIndexCounter++,
            splitLevel: currentSplitLevel
          })
        } else {
          newPills.push(pill)
        }
      } else {
        newPills.push(pill)
      }
    })

    setPills(newPills)
    setNextZIndex(prev => prev + zIndexCounter + 10) 
  }, [pills, nextZIndex])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseDown = (e: MouseEvent) => {
      const pos = getContainerCoordinates(e)
      const clickedPill = findPillAtPoint(pos)
      
      setHasDragged(false)
      
      if (clickedPill) {
        // Start dragging
        setDraggedPill(clickedPill)
        setDragOffset({
          x: pos.x - clickedPill.x,
          y: pos.y - clickedPill.y
        })
        
        setPills(prev => prev.map(pill => 
          pill.id === clickedPill.id 
            ? { ...pill, zIndex: nextZIndex }
            : pill
        ))
        setNextZIndex(prev => prev + 1)
      } else {
        // Start drawing new pill
        setIsDrawing(true)
        setStartPos(pos)
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      const pos = getContainerCoordinates(e)
      setMousePos(pos)

      // If we're dragging a pill, update its position and mark as dragged
      if (draggedPill) {
        setHasDragged(true)
        const newX = Math.max(0, pos.x - dragOffset.x)
        const newY = Math.max(0, pos.y - dragOffset.y)
        
        setPills(prev => prev.map(pill => 
          pill.id === draggedPill.id 
            ? { ...pill, x: newX, y: newY }
            : pill
        ))
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      const pos = getContainerCoordinates(e)
      
      if (isDrawing) {
        const width = Math.abs(pos.x - startPos.x)
        const height = Math.abs(pos.y - startPos.y)
        
        if (width >= 40 && height >= 40) {
          const newPill: Pill = {
            id: `pill-${Date.now()}-${Math.random()}`,
            x: Math.min(startPos.x, pos.x),
            y: Math.min(startPos.y, pos.y),
            width,
            height,
            color: getRandomColor(),
            zIndex: nextZIndex,
            splitLevel: 0
          }
          setPills(prev => [...prev, newPill])
          setNextZIndex(prev => prev + 1)
        }
        setIsDrawing(false)
      }
      
      setDraggedPill(null)
    }

    const handleClick = (e: MouseEvent) => {
      // Only split if we haven't dragged and we're not drawing
      if (!hasDragged && !isDrawing && !draggedPill) {
        const pos = getContainerCoordinates(e)
        splitPillsAtLines(pos.x, pos.y)
      }
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mousedown', handleMouseDown)
    container.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('click', handleClick)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mousedown', handleMouseDown)
      container.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('click', handleClick)
    }
  }, [getContainerCoordinates, isDrawing, startPos, findPillAtPoint, pills, splitPillsAtLines, draggedPill, dragOffset, nextZIndex, getRandomColor, hasDragged])

  const getBorderStyle = (pill: Pill) => {
    const splitLevel = pill.splitLevel || 0
    const borderColors = ['border-gray-800', 'border-blue-600', 'border-green-600', 'border-purple-600', 'border-red-600']
    const borderWidths = ['border-2', 'border-2', 'border-[1.5px]', 'border-[1px]', 'border-[0.5px]']
    
    return `${borderColors[Math.min(splitLevel, borderColors.length - 1)]} ${borderWidths[Math.min(splitLevel, borderWidths.length - 1)]}`
  }

  const getOpacity = (pill: Pill) => {
    const splitLevel = pill.splitLevel || 0
    return Math.max(0.6, 1 - (splitLevel * 0.1))
  }

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col">
       
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-crosshair"
        style={{ userSelect: 'none' }}
      >
        {/* Split Lines */}
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
            className={`absolute cursor-move ${getBorderStyle(pill)}`}
            style={{
              left: pill.x,
              top: pill.y,
              width: pill.width,
              height: pill.height,
              backgroundColor: pill.color,
              borderRadius: '20px',
              zIndex: pill.zIndex,
              opacity: getOpacity(pill)
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
