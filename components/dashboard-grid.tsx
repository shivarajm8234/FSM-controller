"use client"

import { useState, ReactNode, useEffect, useRef } from "react"
import { Responsive, type Layout } from "react-grid-layout"
import { motion } from "framer-motion"
import { GripVertical } from "lucide-react"

// Import styles
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"

// Fix for broken RGL types in ESM
const ResponsiveGrid = Responsive as any

type Layouts = Record<string, any[]>

interface DashboardGridProps {
  children: {
    controls: ReactNode
    logs: ReactNode
    fsm: ReactNode
    pollution: ReactNode
    sensors: ReactNode
    power: ReactNode
    map: ReactNode
  }
  visibleSections?: Record<string, boolean>
}

// Default layout configuration
const defaultLayouts: Layouts = {
  lg: [
    { i: "controls", x: 0, y: 0, w: 3, h: 4 },
    { i: "logs", x: 0, y: 4, w: 3, h: 4 },
    { i: "fsm", x: 3, y: 0, w: 6, h: 6 },
    { i: "pollution", x: 3, y: 6, w: 6, h: 2 },
    { i: "sensors", x: 9, y: 0, w: 3, h: 3 },
    { i: "map", x: 9, y: 3, w: 3, h: 3 },
    { i: "power", x: 9, y: 6, w: 3, h: 2 },
  ],
  md: [
    { i: "fsm", x: 0, y: 0, w: 6, h: 5 },
    { i: "controls", x: 6, y: 0, w: 2, h: 4 },
    { i: "sensors", x: 8, y: 0, w: 2, h: 4 },
    { i: "logs", x: 0, y: 5, w: 4, h: 3 },
    { i: "pollution", x: 4, y: 5, w: 4, h: 3 },
    { i: "power", x: 8, y: 5, w: 2, h: 3 },
    { i: "map", x: 0, y: 8, w: 10, h: 3 },
  ],
  sm: [
    { i: "fsm", x: 0, y: 0, w: 6, h: 4 },
    { i: "controls", x: 0, y: 4, w: 3, h: 4 },
    { i: "sensors", x: 3, y: 4, w: 3, h: 4 },
    { i: "pollution", x: 0, y: 8, w: 6, h: 3 },
    { i: "power", x: 0, y: 11, w: 6, h: 3 },
    { i: "map", x: 0, y: 14, w: 6, h: 3 },
    { i: "logs", x: 0, y: 17, w: 6, h: 4 },
  ]
}

export function DashboardGrid({ children, visibleSections = {} }: DashboardGridProps) {
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

  const isVisible = (key: string) => visibleSections[key] !== false

  return (
    <div className="flex-1 min-h-0 bg-background/50 overflow-auto" ref={containerRef}>
      <ResponsiveGrid
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        width={width} // Pass the measured width
        draggableHandle=".drag-handle"
        margin={[12, 12]}
        isBounded={true}
        onLayoutChange={(currentLayout: any, allLayouts: any) => {
          setLayouts(allLayouts)
        }}
      >
        {isVisible("controls") && (
          <div key="controls" className="bg-background border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
            <div className="h-6 bg-muted/40 border-b border-border flex items-center px-2 cursor-grab active:cursor-grabbing drag-handle hover:bg-muted/60 transition-colors">
              <GripVertical className="w-3 h-3 text-muted-foreground mr-2" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase">Control Panel</span>
            </div>
            <div className="flex-1 overflow-auto p-1">
              <div className="h-full">{children.controls}</div>
            </div>
          </div>
        )}

        {isVisible("logs") && (
          <div key="logs" className="bg-background border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
             <div className="h-6 bg-muted/40 border-b border-border flex items-center px-2 cursor-grab active:cursor-grabbing drag-handle hover:bg-muted/60 transition-colors">
              <GripVertical className="w-3 h-3 text-muted-foreground mr-2" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase">System Logs</span>
            </div>
            <div className="flex-1 overflow-auto bg-card">
               <div className="h-full">{children.logs}</div>
            </div>
          </div>
        )}

        {isVisible("fsm") && (
          <div key="fsm" className="bg-background border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
            <div className="h-6 bg-muted/40 border-b border-border flex items-center px-2 cursor-grab active:cursor-grabbing drag-handle hover:bg-muted/60 transition-colors">
              <GripVertical className="w-3 h-3 text-muted-foreground mr-2" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase">State Visualization</span>
            </div>
            <div className="flex-1 overflow-hidden relative flex flex-col">
               <div className="flex-1 min-h-0">{children.fsm}</div>
            </div>
          </div>
        )}

        {isVisible("pollution") && (
          <div key="pollution" className="bg-background border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
            <div className="h-6 bg-muted/40 border-b border-border flex items-center px-2 cursor-grab active:cursor-grabbing drag-handle hover:bg-muted/60 transition-colors">
              <GripVertical className="w-3 h-3 text-muted-foreground mr-2" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase">Pollution Trends</span>
            </div>
            <div className="flex-1 overflow-hidden">
               <div className="h-full">{children.pollution}</div>
            </div>
          </div>
        )}

        {isVisible("sensors") && (
          <div key="sensors" className="bg-background border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
            <div className="h-6 bg-muted/40 border-b border-border flex items-center px-2 cursor-grab active:cursor-grabbing drag-handle hover:bg-muted/60 transition-colors">
              <GripVertical className="w-3 h-3 text-muted-foreground mr-2" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase">Sensor Data</span>
            </div>
            <div className="flex-1 overflow-auto p-1">
               {children.sensors}
            </div>
          </div>
        )}

        {isVisible("power") && (
          <div key="power" className="bg-background border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
            <div className="h-6 bg-muted/40 border-b border-border flex items-center px-2 cursor-grab active:cursor-grabbing drag-handle hover:bg-muted/60 transition-colors">
              <GripVertical className="w-3 h-3 text-muted-foreground mr-2" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase">Power Consumption</span>
            </div>
            <div className="flex-1 overflow-hidden">
               <div className="h-full">{children.power}</div>
            </div>
          </div>
        )}

        {isVisible("map") && (
          <div key="map" className="bg-background border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
            <div className="h-6 bg-muted/40 border-b border-border flex items-center px-2 cursor-grab active:cursor-grabbing drag-handle hover:bg-muted/60 transition-colors">
              <GripVertical className="w-3 h-3 text-muted-foreground mr-2" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase">Geolocation</span>
            </div>
            <div className="flex-1 overflow-hidden relative">
               <div className="absolute inset-0">{children.map}</div>
            </div>
          </div>
        )}

      </ResponsiveGrid>
    </div>
  )
}
