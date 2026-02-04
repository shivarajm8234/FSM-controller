"use client"

import { useState, ReactNode, useEffect, useRef } from "react"
import { Responsive, type Layout } from "react-grid-layout"
import { GripVertical } from "lucide-react"

// Import styles
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"

// Fix for broken RGL types in ESM
const ResponsiveGrid = Responsive as any

type Layouts = Record<string, any[]>

interface MicrogreensGridProps {
  widgets: {
    impact: ReactNode
    environment: ReactNode
    intelligence: ReactNode
    library: ReactNode
    fsm: ReactNode
    garden: ReactNode
  }
}

// Default layout configuration mimicking the original static layout
const defaultLayouts: Layouts = {
  lg: [
    { i: "impact", x: 0, y: 0, w: 3, h: 8 },
    { i: "environment", x: 0, y: 8, w: 3, h: 6 },
    { i: "intelligence", x: 0, y: 14, w: 3, h: 6 },
    { i: "library", x: 0, y: 20, w: 3, h: 8 },
    { i: "fsm", x: 3, y: 0, w: 9, h: 8 },
    { i: "garden", x: 3, y: 8, w: 9, h: 12 },
  ],
  md: [
    { i: "impact", x: 0, y: 0, w: 5, h: 8 },
    { i: "environment", x: 5, y: 0, w: 5, h: 8 },
    { i: "fsm", x: 0, y: 8, w: 10, h: 8 },
    { i: "garden", x: 0, y: 16, w: 10, h: 12 },
    { i: "intelligence", x: 0, y: 28, w: 5, h: 8 },
    { i: "library", x: 5, y: 28, w: 5, h: 8 },
  ],
  sm: [
    { i: "impact", x: 0, y: 0, w: 6, h: 8 },
    { i: "environment", x: 0, y: 8, w: 6, h: 8 },
    { i: "fsm", x: 0, y: 16, w: 6, h: 8 },
    { i: "garden", x: 0, y: 24, w: 6, h: 12 },
    { i: "intelligence", x: 0, y: 36, w: 6, h: 8 },
    { i: "library", x: 0, y: 44, w: 6, h: 8 },
  ]
}

export function MicrogreensGrid({ widgets }: MicrogreensGridProps) {
  const [layouts, setLayouts] = useState<Layouts>(defaultLayouts)
  const [width, setWidth] = useState(1200)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width)
      }
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="flex-1 min-h-0 bg-background/50 overflow-auto" ref={containerRef}>
      <ResponsiveGrid
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30}
        width={width}
        draggableHandle=".drag-handle"
        margin={[12, 12]}
        isBounded={true}
        onLayoutChange={(currentLayout: any, allLayouts: any) => {
          setLayouts(allLayouts)
        }}
      >
        <div key="impact" className="bg-card border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
          <div className="h-6 bg-muted/40 border-b border-border flex items-center px-2 cursor-grab active:cursor-grabbing drag-handle hover:bg-muted/60 transition-colors">
             <GripVertical className="w-3 h-3 text-muted-foreground mr-2" />
             <span className="text-[10px] font-mono text-muted-foreground uppercase">Impact Analysis</span>
          </div>
          <div className="flex-1 overflow-auto bg-card">
              <div className="h-full">{widgets.impact}</div>
          </div>
        </div>

        <div key="environment" className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden flex flex-col hover:border-emerald-500/30 transition-colors">
          <div className="px-3 py-2 border-b border-border/50 bg-muted/20 flex justify-between items-center handle cursor-move">
             <span className="text-[10px] font-mono text-muted-foreground uppercase">Environment</span>
          </div>
          <div className="flex-1 overflow-auto bg-card">
              <div className="h-full">{widgets.environment}</div>
          </div>
        </div>

        <div key="intelligence" className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden flex flex-col hover:border-emerald-500/30 transition-colors">
          <div className="px-3 py-2 border-b border-border/50 bg-muted/20 flex justify-between items-center handle cursor-move">
             <span className="text-[10px] font-mono text-muted-foreground uppercase">Active Intelligence</span>
          </div>
          <div className="flex-1 overflow-auto bg-card">
              <div className="h-full">{widgets.intelligence}</div>
          </div>
        </div>
        
        <div key="library" className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden flex flex-col hover:border-emerald-500/30 transition-colors">
            <div className="px-3 py-2 border-b border-border/50 bg-muted/20 flex justify-between items-center handle cursor-move">
             <span className="text-[10px] font-mono text-muted-foreground uppercase">Crop Library</span>
          </div>
          <div className="flex-1 overflow-auto bg-card">
              <div className="h-full">{widgets.library}</div>
          </div>
        </div>

        <div key="fsm" className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden flex flex-col hover:border-emerald-500/30 transition-colors">
            <div className="px-3 py-2 border-b border-border/50 bg-muted/20 flex justify-between items-center handle cursor-move">
             <span className="text-[10px] font-mono text-muted-foreground uppercase">FSM Controller</span>
          </div>
          <div className="flex-1 overflow-hidden relative">
              <div className="absolute inset-0">{widgets.fsm}</div>
          </div>
        </div>

        <div key="garden" className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden flex flex-col hover:border-emerald-500/30 transition-colors">
            <div className="px-3 py-2 border-b border-border/50 bg-muted/20 flex justify-between items-center handle cursor-move">
             <span className="text-[10px] font-mono text-muted-foreground uppercase">My Smart Garden</span>
          </div>
          <div className="flex-1 overflow-auto bg-card p-2">
              <div className="h-full">{widgets.garden}</div>
          </div>
        </div>

      </ResponsiveGrid>
    </div>
  )
}
