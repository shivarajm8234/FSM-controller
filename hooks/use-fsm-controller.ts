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
  const [currentState, setCurrentState] = useState<FSMState>("BOOT")
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
    temperatureThreshold: 40,
    humidityThreshold: 80,
    pm10Threshold: 50,
    pm25Threshold: 25,
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
    setCurrentState("BOOT")
    setSensorData({
      temperature: 22,
      humidity: 45,
      battery: 100,
      timestamp: Date.now(),
    })
    setPowerHistory([])
    setEventLog([])
    addEvent(null, "BOOT", "System reset - entering BOOT mode")
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

        // Simulate random errors (5% chance) for PROCESS and TRANSMIT states
        if (Math.random() < 0.05 && (prevState === "PROCESS" || prevState === "TRANSMIT")) {
          nextState = "ERROR"
          message = "Random fault detected"
        } else {
          switch (prevState) {
            case "BOOT":
              nextState = "SELF_TEST"
              message = "Boot sequence completed"
              break
            case "SELF_TEST":
              // Simulate self-test success (90%) or failure (10%)
              if (Math.random() < 0.9) {
                nextState = "SLEEP"
                message = "Self-test passed successfully"
              } else {
                nextState = "ERROR"
                message = "Self-test failed"
              }
              break
            case "SLEEP":
              nextState = "WAKE"
              message = "Wake timer triggered"
              break
            case "WAKE":
              nextState = "SENSE"
              message = "System activated"
              break
            case "SENSE":
              nextState = "PROCESS"
              message = "Data acquired, processing"
              break
            case "PROCESS":
              nextState = "TRANSMIT"
              message = "Data processed, ready to transmit"
              break
            case "TRANSMIT":
              // Simulate transmission success (85%) or failure (15%)
              if (Math.random() < 0.85) {
                nextState = "SLEEP"
                message = "Transmission successful"
              } else {
                nextState = "ERROR"
                message = "Transmission failed"
              }
              break
            case "ERROR":
              nextState = "REPAIR"
              message = "Entering repair mode"
              break
            case "REPAIR":
              nextState = "SLEEP"
              message = "Repair completed, entering sleep"
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
        case "BOOT":
          return 1000
        case "SELF_TEST":
          return 2000
        case "SLEEP":
          return config.sleepInterval * 1000
        case "WAKE":
          return 500
        case "SENSE":
          return 1500
        case "PROCESS":
          return 1000
        case "TRANSMIT":
          return 3000 // Increased from 2000ms to 3000ms for better MQTT transmission
        case "ERROR":
          return 1000
        case "REPAIR":
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
            if (p1) {
              const basePM10 = parseFloat(p1.value)
              // Add small realistic variation (±5%)
              const variation = (Math.random() - 0.5) * 0.1 * basePM10
              changes.pm10 = Math.max(0, basePM10 + variation)
            }
            if (p2) {
              const basePM25 = parseFloat(p2.value)
              // Add small realistic variation (±5%)
              const variation = (Math.random() - 0.5) * 0.1 * basePM25
              changes.pm25 = Math.max(0, basePM25 + variation)
            }
          }
        }

        // Process Temp/Hum Data
        if (bmeRes.ok) {
          const data = await bmeRes.json()
          if (Array.isArray(data) && data.length > 0) {
            const latest = data[0]
            const temp = latest.sensordatavalues.find((v: any) => v.value_type === "temperature")
            const hum = latest.sensordatavalues.find((v: any) => v.value_type === "humidity")
            if (temp) {
              const baseTemp = parseFloat(temp.value)
              // Add small realistic variation (±0.5°C)
              const variation = (Math.random() - 0.5) * 1.0
              changes.temperature = baseTemp + variation
            }
            if (hum) {
              const baseHum = parseFloat(hum.value)
              // Add small realistic variation (±2%)
              const variation = (Math.random() - 0.5) * 4.0
              changes.humidity = Math.max(0, Math.min(100, baseHum + variation))
            }
          }
        }

        setSensorData(prev => ({ ...prev, ...changes }))
        console.log("Sensor data updated with variation:", changes)

      } catch (error) {
        console.error("Failed to fetch sensor data:", error)
      }
    }

    // Fetch immediately when entering SENSE state
    if (currentState === "SENSE") {
      fetchRealData()
    }

    // In auto mode, fetch sensor data more frequently during active sensing states
    let sensorFetchInterval: NodeJS.Timeout | null = null
    if (isAutoMode && (currentState === "SENSE" || currentState === "PROCESS")) {
      console.log("Starting frequent sensor fetch in auto mode")
      // Fetch every 2 seconds during SENSE and PROCESS states in auto mode
      sensorFetchInterval = setInterval(fetchRealData, 2000)
    }

    const updateSensors = () => {
      setSensorData((prev) => {
        // Consider charging in low-power states: SLEEP, BOOT, SELF_TEST
        const isCharging = currentState === "SLEEP" || currentState === "BOOT" || currentState === "SELF_TEST"
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
      if (sensorFetchInterval) {
        clearInterval(sensorFetchInterval)
        console.log("Stopped frequent sensor fetch")
      }
    }
  }, [currentState, isAutoMode])

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
      console.log("Entering TRANSMIT state, preparing to send sensor data:", sensorData)
      
      // Add a small delay to ensure MQTT client is ready
      const transmitTimer = setTimeout(async () => {
        try {
          const success = await publishData("adld/sensor/data", sensorData)
          if (success) {
            console.log("✅ Data transmitted via MQTT successfully")
            addEvent("TRANSMIT", "SLEEP", "MQTT transmission completed")
          } else {
            console.warn("⚠️ MQTT transmission failed, but continuing state flow")
            addEvent("TRANSMIT", "SLEEP", "MQTT transmission failed, continuing")
          }
        } catch (error) {
          console.error("❌ MQTT transmission error:", error)
          addEvent("TRANSMIT", "SLEEP", "MQTT transmission error, continuing")
        }
      }, 500) // Wait 500ms before transmitting
      
      return () => clearTimeout(transmitTimer)
    }
  }, [currentState, sensorData, addEvent])

  const averagePower =
    powerHistory.length > 0
      ? powerHistory.reduce((sum, p) => sum + p.power, 0) / powerHistory.length
      : STATE_CONFIGS[currentState].power

  const isCharging = currentState === "SLEEP" || currentState === "BOOT" || currentState === "SELF_TEST"

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
