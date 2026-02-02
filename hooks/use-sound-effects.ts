"use client"

import { useEffect, useRef } from "react"
import { type FSMState } from "@/lib/fsm-types"

// Sound context singleton to avoid recreating it
let audioContext: AudioContext | null = null

const getAudioContext = () => {
  if (typeof window === "undefined") return null
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext
}

const playTone = (freq: number, type: OscillatorType, duration: number) => {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === "suspended") ctx.resume()

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime)
  
  gain.gain.setValueAtTime(0.1, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start()
  osc.stop(ctx.currentTime + duration)
}

export function useSoundEffects(currentState: FSMState, isEnabled: boolean = true) {
  const prevStateRef = useRef<FSMState>(currentState)

  useEffect(() => {
    if (!isEnabled) return
    if (currentState === prevStateRef.current) return

    // Sound mapping logic
    switch (currentState) {
      case "TRANSMIT":
        // High pitch chirp for data transmission
        playTone(1200, "sine", 0.1)
        setTimeout(() => playTone(1800, "sine", 0.1), 100)
        break
      case "ERROR":
        // Low buzzing for error
        playTone(150, "sawtooth", 0.4)
        break
      case "WAKE":
        // Rising tone
        playTone(400, "triangle", 0.2)
        break
      case "SLEEP":
        // Lowering tone
        playTone(200, "sine", 0.4)
        break
      case "SENSE":
        // Gentle blip
        playTone(600, "sine", 0.05)
        break
      case "REPAIR":
        // Mechanical noise sequence
        playTone(300, "square", 0.1)
        setTimeout(() => playTone(300, "square", 0.1), 200)
        break
    }

    prevStateRef.current = currentState
  }, [currentState, isEnabled])
}
