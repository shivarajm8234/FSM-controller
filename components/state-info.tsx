"use client"


import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { type FSMState, STATE_CONFIGS } from "@/lib/fsm-types"
import { Zap, Clock, Cpu } from "lucide-react"

interface StateInfoProps {
  currentState: FSMState
}

export function StateInfo({ currentState }: StateInfoProps) {
  const config = STATE_CONFIGS[currentState]
  const [time, setTime] = useState<string>("")

  useEffect(() => {
    const updateTime = () => setTime(new Date().toLocaleTimeString("en-US", { hour12: false }))
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-4">
      <motion.div
        key={currentState}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between gap-6"
      >
        {/* State indicator */}
        <div className="flex items-center gap-4">
          <div className={`relative p-3 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
            <Cpu className={`w-5 h-5 ${config.color}`} />
            <motion.div
              className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${config.color.replace("text-", "bg-")}`}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [1, 0.6, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-mono font-bold text-lg tracking-tight ${config.color}`}>{currentState}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-secondary text-muted-foreground">
                ACTIVE
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${config.color}`} />
            <div className="text-right">
              <span className={`font-mono text-xl font-bold ${config.color}`}>{config.power}</span>
              <span className="text-xs text-muted-foreground ml-1">mW</span>
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div className="text-right">
              <span className="font-mono text-sm text-foreground">
                {time}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
