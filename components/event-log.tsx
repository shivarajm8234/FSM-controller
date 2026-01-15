"use client"

import { useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { type EventLogEntry, STATE_CONFIGS } from "@/lib/fsm-types"
import { Terminal, ChevronRight } from "lucide-react"

interface EventLogProps {
  events: EventLogEntry[]
}

export function EventLog({ events }: EventLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [events])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-xs font-mono text-muted-foreground tracking-wider">SYSTEM LOG</h3>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">{events.length} EVENTS</span>
      </div>

      <div className="p-2">
        <ScrollArea className="h-[180px]" ref={scrollRef}>
          <div className="space-y-0.5 p-2">
            <AnimatePresence initial={false}>
              {events.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-[11px] font-mono py-1 px-2 rounded hover:bg-secondary/50 transition-colors"
                >
                  <span className="text-muted-foreground/70 shrink-0">{formatTime(event.timestamp)}</span>
                  <span className="text-muted-foreground/50">│</span>
                  <div className="flex items-center gap-1 min-w-0">
                    {event.fromState && (
                      <>
                        <span className={STATE_CONFIGS[event.fromState].color}>{event.fromState}</span>
                        <ChevronRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                      </>
                    )}
                    <span className={STATE_CONFIGS[event.toState].color}>{event.toState}</span>
                  </div>
                  <span className="text-muted-foreground/60 truncate">{event.message}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
