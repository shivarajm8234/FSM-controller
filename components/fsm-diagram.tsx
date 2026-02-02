"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { type FSMState, STATE_CONFIGS, VALID_TRANSITIONS } from "@/lib/fsm-types"
import { Moon, Sun, Activity, Wifi, AlertTriangle, Zap, Wrench, CheckCircle } from "lucide-react"

interface FSMDiagramProps {
  currentState: FSMState
  onStateClick: (state: FSMState) => void
}

const STATE_POSITIONS: Record<FSMState, { x: number; y: number }> = {
  BOOT: { x: 100, y: 120 },
  SELF_TEST: { x: 280, y: 120 },
  SLEEP: { x: 480, y: 120 },
  WAKE: { x: 680, y: 120 },
  SENSE: { x: 880, y: 120 },
  PROCESS: { x: 1080, y: 120 },
  TRANSMIT: { x: 1280, y: 120 },
  ERROR: { x: 750, y: 300 },
  REPAIR: { x: 980, y: 300 },
}

const STATE_ICONS: Record<FSMState, React.ReactNode> = {
  BOOT: <Zap className="w-6 h-6" />,
  SELF_TEST: <CheckCircle className="w-6 h-6" />,
  SLEEP: <Moon className="w-6 h-6" />,
  WAKE: <Sun className="w-6 h-6" />,
  SENSE: <Activity className="w-6 h-6" />,
  PROCESS: <Activity className="w-6 h-6" />,
  TRANSMIT: <Wifi className="w-6 h-6" />,
  ERROR: <AlertTriangle className="w-6 h-6" />,
  REPAIR: <Wrench className="w-6 h-6" />,
}

const HEXAGON_PATH = "M 0 -55 L 48 -27 L 48 27 L 0 55 L -48 27 L -48 -27 Z"

export function FSMDiagram({ currentState, onStateClick }: FSMDiagramProps) {
  /* ZOOM & PAN STATE */
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.ctrlKey || e.metaKey) {
       const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1
       setScale(s => Math.min(Math.max(s * scaleFactor, 0.5), 3))
    } else {
       // Panning with wheel if not zooming
       setPosition(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }))
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
     setIsDragging(true)
     setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Zoom controls
  const zoomIn = () => setScale(s => Math.min(s * 1.2, 3))
  const zoomOut = () => setScale(s => Math.max(s / 1.2, 0.5))
  const resetView = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const renderTransitionArrow = (from: FSMState, to: FSMState) => {
    const fromPos = STATE_POSITIONS[from]
    const toPos = STATE_POSITIONS[to]

    const dx = toPos.x - fromPos.x
    const dy = toPos.y - fromPos.y
    const len = Math.sqrt(dx * dx + dy * dy)

    const offsetStart = 60
    const offsetEnd = 65

    const startX = fromPos.x + (dx / len) * offsetStart
    const startY = fromPos.y + (dy / len) * offsetStart
    const endX = toPos.x - (dx / len) * offsetEnd
    const endY = toPos.y - (dy / len) * offsetEnd

    const isActive = currentState === from && VALID_TRANSITIONS[from].includes(to)

    const midX = (startX + endX) / 2
    const midY = (startY + endY) / 2
    const perpX = (-dy / len) * 25
    const perpY = (dx / len) * 25

    const controlX = midX + perpX
    const controlY = midY + perpY

    return (
      <g key={`${from}-${to}`}>
        <defs>
          <marker id={`arrow-${from}-${to}`} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill={isActive ? STATE_CONFIGS[to].hexColor : "#374151"} />
          </marker>
        </defs>
        <motion.path
          d={`M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`}
          fill="none"
          stroke={isActive ? STATE_CONFIGS[to].hexColor : "#374151"}
          strokeWidth={isActive ? 2 : 1}
          strokeDasharray={isActive ? "none" : "4,4"}
          markerEnd={`url(#arrow-${from}-${to})`}
          initial={{ pathLength: 0 }}
          animate={{
            pathLength: 1,
            strokeOpacity: isActive ? 1 : 0.3,
          }}
          transition={{ duration: 0.5 }}
        />
      </g>
    )
  }

  const allTransitions: [FSMState, FSMState][] = []
  Object.entries(VALID_TRANSITIONS).forEach(([from, toStates]) => {
    toStates.forEach((to) => {
      if (to === "ERROR") {
        const isLogicError = ["SELF_TEST", "PROCESS", "TRANSMIT"].includes(from)
        if (!isLogicError) return
      }
      
      allTransitions.push([from as FSMState, to])
    })
  })

  return (
    <div className="w-full h-full overflow-hidden relative bg-muted/5 group">
      {/* Controls Overlay */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={zoomIn} className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded text-foreground hover:bg-accent">+</button>
        <button onClick={resetView} className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded text-foreground hover:bg-accent">R</button>
        <button onClick={zoomOut} className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded text-foreground hover:bg-accent">-</button>
      </div>

      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1400 600"
        className={`w-full h-full ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          <filter id="glow-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="grid-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="url(#grid-grad)" strokeWidth="0.5" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />

        <g transform={`translate(${position.x}, ${position.y}) scale(${scale})`}>
          {allTransitions.map(([from, to]) => renderTransitionArrow(from, to))}

          {(Object.keys(STATE_POSITIONS) as FSMState[]).map((state) => {
            const pos = STATE_POSITIONS[state]
            const config = STATE_CONFIGS[state]
            const isActive = currentState === state
            const canTransition = VALID_TRANSITIONS[currentState].includes(state)

            return (
               <g
                  key={state}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={(e) => {
                    e.stopPropagation() // Prevent drag start when clicking node
                    if (canTransition) onStateClick(state)
                  }}
                  className={canTransition ? "cursor-pointer" : "cursor-default"}
                >
                  {/* Outer glow for active state */}
                  {isActive && (
                    <motion.path
                      d={HEXAGON_PATH}
                      fill="none"
                      stroke={config.hexColor}
                      strokeWidth="1"
                      opacity={0.4}
                      filter="url(#glow-filter)"
                      animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.2, 0.5, 0.2],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                    />
                  )}

                  {/* Hexagon Shape */}
                  <motion.path
                    d={HEXAGON_PATH}
                    fill={isActive ? `${config.hexColor}15` : "#111827"}
                    stroke={config.hexColor}
                    strokeWidth={isActive ? 2 : 1}
                    opacity={isActive ? 1 : 0.6}
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      opacity: isActive || canTransition ? 1 : 0.5,
                      stroke: isActive || canTransition ? config.hexColor : "gray",
                    }}
                    whileHover={canTransition ? { scale: 1.08, opacity: 1 } : {}}
                    transition={{ duration: 0.2 }}
                  />

                  {/* Inner content */}
                  <foreignObject x={-40} y={-40} width={80} height={80} style={{ pointerEvents: "none" }}>
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <div style={{ color: config.hexColor }}>{STATE_ICONS[state]}</div>
                      <span className="text-[12px] font-mono font-semibold tracking-wide" style={{ color: config.hexColor }}>
                        {state}
                      </span>
                    </div>
                  </foreignObject>

                  {/* Power label below */}
                  <text y={70} textAnchor="middle" className="text-[12px] fill-muted-foreground font-mono">
                    {config.power}mW
                  </text>

                  {/* Status indicator */}
                  {isActive && (
                    <motion.circle
                      cx={38}
                      cy={-45}
                      r={6}
                      fill={config.hexColor}
                      animate={{
                        opacity: [1, 0.4, 1],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Number.POSITIVE_INFINITY,
                      }}
                    />
                  )}
                </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}
