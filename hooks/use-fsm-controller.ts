"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import {
  type FSMState,
  type SensorData,
  type PowerDataPoint,
  type EventLogEntry,
  type FSMConfig,
  STATE_CONFIGS,
  VALID_TRANSITIONS,
} from "@/lib/fsm-types"

import { publishData } from "@/lib/mqtt-client"

const generateId = () => Math.random().toString(36).substring(2, 9)

export function useFSMController() {
  const [currentState, setCurrentState] = useState<FSMState>("SLEEP")
  const [isAutoMode, setIsAutoMode] = useState(false)
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 22,
    humidity: 45,
    battery: 100,
    timestamp: Date.now(),
  })
  const [powerHistory, setPowerHistory] = useState<PowerDataPoint[]>([])
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([])
  const [config, setConfig] = useState<FSMConfig>({
    sleepInterval: 3,
    senseThreshold: 30,
    transmitRetries: 3,
    errorRecoveryTime: 2,
  })

  const stateTimerRef = useRef<NodeJS.Timeout | null>(null)
  const sensorTimerRef = useRef<NodeJS.Timeout | null>(null)
  const powerTimerRef = useRef<NodeJS.Timeout | null>(null)

  const addEvent = useCallback((fromState: FSMState | null, toState: FSMState, message: string) => {
    setEventLog((prev) => [
      ...prev.slice(-49),
      {
        id: generateId(),
        timestamp: new Date(),
        fromState,
        toState,
        message,
      },
    ])
  }, [])

  const transitionTo = useCallback(
    (newState: FSMState, message = "") => {
      setCurrentState((prev) => {
        if (VALID_TRANSITIONS[prev].includes(newState)) {
          addEvent(prev, newState, message || `Transitioning to ${newState}`)
          return newState
        }
        return prev
      })
    },
    [addEvent],
  )

  const reset = useCallback(() => {
    setCurrentState("SLEEP")
    setSensorData({
      temperature: 22,
      humidity: 45,
      battery: 100,
      timestamp: Date.now(),
    })
    setPowerHistory([])
    setEventLog([])
    addEvent(null, "SLEEP", "System reset - entering SLEEP mode")
  }, [addEvent])

  // Auto mode state machine logic
  useEffect(() => {
    if (!isAutoMode) {
      if (stateTimerRef.current) {
        clearTimeout(stateTimerRef.current)
      }
      return
    }

    const runAutoTransition = () => {
      setCurrentState((prevState) => {
        let nextState: FSMState = prevState
        let message = ""

        // Simulate random errors (5% chance)
        if (Math.random() < 0.05 && prevState !== "ERROR" && prevState !== "SLEEP") {
          nextState = "ERROR"
          message = "Random fault detected"
        } else {
          switch (prevState) {
            case "SLEEP":
              nextState = "WAKE"
              message = "Wake timer triggered"
              break
            case "WAKE":
              nextState = "SENSE"
              message = "System initialized"
              break
            case "SENSE":
              nextState = "TRANSMIT"
              message = "Data acquired, ready to transmit"
              break
            case "TRANSMIT":
              nextState = "SLEEP"
              message = "Transmission complete"
              break
            case "ERROR":
              nextState = "SLEEP"
              message = "Error recovered, entering sleep"
              break
          }
        }

        if (nextState !== prevState) {
          addEvent(prevState, nextState, message)
        }
        return nextState
      })
    }

    const getDelay = () => {
      switch (currentState) {
        case "SLEEP":
          return config.sleepInterval * 1000
        case "WAKE":
          return 1000
        case "SENSE":
          return 1500
        case "TRANSMIT":
          return 2000
        case "ERROR":
          return config.errorRecoveryTime * 1000
        default:
          return 2000
      }
    }

    stateTimerRef.current = setTimeout(runAutoTransition, getDelay())

    return () => {
      if (stateTimerRef.current) {
        clearTimeout(stateTimerRef.current)
      }
    }
  }, [currentState, isAutoMode, config, addEvent])

  // Sensor data simulation & fetching
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        // Fetch from both sensors in parallel
        const [pmRes, bmeRes] = await Promise.all([
          fetch("https://data.sensor.community/airrohr/v1/sensor/61982/", { signal: controller.signal }),
          fetch("https://data.sensor.community/airrohr/v1/sensor/61983/", { signal: controller.signal })
        ])
        
        clearTimeout(timeoutId)
        
        const changes: Partial<SensorData> = { timestamp: Date.now() }

        // Process PM Data
        if (pmRes.ok) {
          const data = await pmRes.json()
          if (Array.isArray(data) && data.length > 0) {
            const latest = data[0]
            const p1 = latest.sensordatavalues.find((v: any) => v.value_type === "P1")
            const p2 = latest.sensordatavalues.find((v: any) => v.value_type === "P2")
            if (p1) changes.pm10 = parseFloat(p1.value)
            if (p2) changes.pm25 = parseFloat(p2.value)
          }
        }

        // Process Temp/Hum Data
        if (bmeRes.ok) {
          const data = await bmeRes.json()
          if (Array.isArray(data) && data.length > 0) {
            const latest = data[0]
            const temp = latest.sensordatavalues.find((v: any) => v.value_type === "temperature")
            const hum = latest.sensordatavalues.find((v: any) => v.value_type === "humidity")
            if (temp) changes.temperature = parseFloat(temp.value)
            if (hum) changes.humidity = parseFloat(hum.value)
          }
        }

        setSensorData(prev => ({ ...prev, ...changes }))

      } catch (error) {
        console.error("Failed to fetch sensor data:", error)
      }
    }

    // Fetch immediately when entering SENSE state
    if (currentState === "SENSE") {
      fetchRealData()
    }

    const updateSensors = () => {
      setSensorData((prev) => {
        const isCharging = currentState === "SLEEP"
        const powerDrain = STATE_CONFIGS[currentState].power / 100

        // Only simulate battery changes. 
        // Temp/Hum/PM are now real data (persisted from fetch) or initial defaults.
        return {
          ...prev,
          battery: isCharging ? Math.min(100, prev.battery + 0.5) : Math.max(0, prev.battery - powerDrain),
          timestamp: Date.now(),
        }
      })
    }

    sensorTimerRef.current = setInterval(updateSensors, 500)
    return () => {
      if (sensorTimerRef.current) {
        clearInterval(sensorTimerRef.current)
      }
    }
  }, [currentState])

  // Power history tracking
  useEffect(() => {
    const addPowerDataPoint = () => {
      const now = new Date()
      const timeStr = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })

      setPowerHistory((prev) => [
        ...prev.slice(-59),
        {
          time: timeStr,
          power: STATE_CONFIGS[currentState].power,
          state: currentState,
        },
      ])
    }

    addPowerDataPoint()
    powerTimerRef.current = setInterval(addPowerDataPoint, 1000)

    return () => {
      if (powerTimerRef.current) {
        clearInterval(powerTimerRef.current)
      }
    }
  }, [currentState])

  // MQTT Transmission
  useEffect(() => {
    if (currentState === "TRANSMIT") {
      const success = publishData("adld/sensor/data", sensorData)
      if (success) {
        // Optional: Add an event log or toast if needed, but the UI already shows "TRANSMIT" state
        console.log("Data transmitted via MQTT")
      }
    }
  }, [currentState, sensorData])

  const averagePower =
    powerHistory.length > 0
      ? powerHistory.reduce((sum, p) => sum + p.power, 0) / powerHistory.length
      : STATE_CONFIGS[currentState].power

  const isCharging = currentState === "SLEEP"

  return {
    currentState,
    isAutoMode,
    sensorData,
    powerHistory,
    eventLog,
    config,
    averagePower,
    isCharging,
    setIsAutoMode,
    transitionTo,
    reset,
    setConfig: (updates: Partial<FSMConfig>) => setConfig((prev) => ({ ...prev, ...updates })),
  }
}
