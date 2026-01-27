"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import {
  type FSMState,
  type SensorData,
  type PowerDataPoint,
  type EventLogEntry,
  type FSMConfig,
  type TransmissionStats,
  STATE_CONFIGS,
  VALID_TRANSITIONS,
  type SensorDetail,
} from "@/lib/fsm-types"

import { publishData } from "@/lib/mqtt-client"

const generateId = () => Math.random().toString(36).substring(2, 9)

const calculateAQI = (pm25: number, pm10: number) => {
  // AQI calculation based on PM2.5 using US EPA standards
  // Formula: I = ((Ihi - Ilo) / (Chi - Clo)) * (C - Clo) + Ilo
  const calc = (c: number, clo: number, chi: number, ilo: number, ihi: number) => {
    return ((ihi - ilo) / (chi - clo)) * (c - clo) + ilo
  }

  let aqi = 0
  const c = Math.round(pm25 * 10) / 10 // Round to 1 decimal place

  if (c >= 0 && c <= 12.0) aqi = calc(c, 0, 12.0, 0, 50)
  else if (c >= 12.1 && c <= 35.4) aqi = calc(c, 12.1, 35.4, 51, 100)
  else if (c >= 35.5 && c <= 55.4) aqi = calc(c, 35.5, 55.4, 101, 150)
  else if (c >= 55.5 && c <= 150.4) aqi = calc(c, 55.5, 150.4, 151, 200)
  else if (c >= 150.5 && c <= 250.4) aqi = calc(c, 150.5, 250.4, 201, 300)
  else if (c >= 250.5 && c <= 500.4) aqi = calc(c, 250.5, 500.4, 301, 500)
  else aqi = 500 // hazardous+

  aqi = Math.round(aqi)

  let status: SensorData["aqiStatus"] = "Good"
  if (aqi > 50) status = "Moderate"
  if (aqi > 100) status = "Unhealthy for Sensitive Groups"
  if (aqi > 150) status = "Unhealthy"
  if (aqi > 200) status = "Very Unhealthy"
  if (aqi > 300) status = "Hazardous"

  return { aqi, status }
}

export function useFSMController() {
  const [currentState, setCurrentState] = useState<FSMState>("BOOT")
  const [isAutoMode, setIsAutoMode] = useState(false)
  const [sensorData, setSensorData] = useState<SensorData>({
    battery: 100,
    timestamp: Date.now(),
  })
  const [connectedSensors, setConnectedSensors] = useState<SensorDetail[]>([])
  const [sensorAddresses, setSensorAddresses] = useState<Record<string, string>>({})
  const [powerHistory, setPowerHistory] = useState<PowerDataPoint[]>([])
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([])
  const [config, setConfig] = useState<FSMConfig>({
    sleepInterval: 3,
    senseThreshold: 30,
    pm10Threshold: 50,
    pm25Threshold: 25,
    transmitRetries: 3,
    errorRecoveryTime: 2,
  })
  const [lastTxStats, setLastTxStats] = useState<TransmissionStats | null>(null)

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

  const sensorDataRef = useRef(sensorData)

  // Keep ref in sync with state to access latest data in timers without resetting them
  useEffect(() => {
    sensorDataRef.current = sensorData
  }, [sensorData])

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
        const currentBattery = sensorDataRef.current.battery

        // CRITICAL BATTERY CONSTRAINT
        // If battery is dead (0%), force system to sleep and stay there until charged
        if (currentBattery <= 0) {
           if (prevState !== "SLEEP") {
             nextState = "SLEEP"
             message = "Battery depleted (0%) - Forced shutdown to SLEEP"
           } else {
             // Already in SLEEP, stay there explicitly (prevent WAKE)
             // We can optionally log a message or just stay silent
             return prevState 
           }
        } 
        
        // Normal Cycle Logic (only if battery has charge)
        else {
            // Simulate random errors (5% chance) for PROCESS state
            if (Math.random() < 0.05 && (prevState === "PROCESS")) {
              nextState = "ERROR"
              message = "Random processing fault detected"
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
                  // POWER EFFICIENCY: Smart Power Gating
                  // If battery is critical (< 10%), skip the expensive TRANSMIT state
                  if (currentBattery < 10) {
                    nextState = "SLEEP"
                    message = "Battery critical (<10%) - Skipping TX to save power"
                  } else {
                    nextState = "TRANSMIT"
                    message = "Data processed, ready to transmit"
                  }
                  break
                case "TRANSMIT":
                  // Wait for MQTT callback to trigger transition
                  // If stuck for too long, watchdog will catch it in next effect or we can add a safety timeout here
                  // For now, we rely on the useEffect below to transition us
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
          // POWER EFFICIENCY: Adaptive Duty Cycling
          // Calculate dynamic sleep time based on environment and battery
          let dynamicSleep = config.sleepInterval

          // 1. Environmental Urgency: If Air Quality is bad (PM2.5 > 35), wake up more often
          if ((sensorDataRef.current.pm25 || 0) > 35) {
            dynamicSleep = dynamicSleep * 0.5 // Sleep 50% less
          }

          // 2. Resource Conservation: If Battery is low (< 20%), force deep sleep
          if (sensorDataRef.current.battery < 20) {
            dynamicSleep = dynamicSleep * 2.0 // Sleep 200% longer
          }

          return dynamicSleep * 1000
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
    const fetchLocationName = async (lat: string, lon: string, id: string) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`, {
          headers: {
            "User-Agent": "FSM-Controller-App/1.0"
          }
        })
        if (res.ok) {
          const data = await res.json()
          const locName = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "Unknown Location"
          setSensorAddresses(prev => ({ ...prev, [id]: locName }))
        }
      } catch (err) {
        console.error("Geocoding failed", err)
      }
    }

    const fetchRealData = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        
        // Fetch from the "rich" sensor we found (ID: 71641)
        const [richSensorRes] = await Promise.all([
          fetch("https://data.sensor.community/airrohr/v1/sensor/71641/", { signal: controller.signal })
        ])
        
        clearTimeout(timeoutId)
        
        const changes: Partial<SensorData> = { timestamp: Date.now() }
        const sensors: SensorDetail[] = []

        if (richSensorRes.ok) {
          const data = await richSensorRes.json()
          if (Array.isArray(data) && data.length > 0) {
            const latest = data[0]
            
            // Extract Sensor Details
            if (latest.sensor && latest.location) {
              const sId = latest.sensor.id.toString()
              
              // Trigger address fetch if not known
              if (!sensorAddresses[sId]) {
                 // Debounce/limit logic isn't strictly needed if we check state, 
                 // but better to check if we are already fetching (omitted for simplicity, state check handles duplicate triggering eventually)
                 // Actually, to avoid multiple calls, we should ideally use a ref to track pending requests, 
                 // but for this single sensor case, simple state check is okay-ish as long as it settles quickly.
                 // We will verify in next render cycle.
                 fetchLocationName(latest.location.latitude, latest.location.longitude, sId)
              }

              sensors.push({
                id: sId,
                type: latest.sensor.sensor_type.name,
                manufacturer: latest.sensor.sensor_type.manufacturer,
                latitude: latest.location.latitude,
                longitude: latest.location.longitude,
                country: latest.location.country,
                altitude: latest.location.altitude,
                indoor: latest.location.indoor === 1,
                lastSeen: latest.timestamp,
                locationName: sensorAddresses[sId]
              })
            }

            // Map all available parameters
            latest.sensordatavalues.forEach((v: any) => {
              const val = parseFloat(v.value)
              switch(v.value_type) {
                case "P1": changes.pm10 = val; break;
                case "P2": changes.pm25 = val; break;
                // Add mappings for other params if SensorData type supported them
                // For now we stick to the ones defined in types
              }
              // Temp/Humidity/Pressure if available
              if (v.value_type === "temperature") changes.temperature = val
              if (v.value_type === "humidity") changes.humidity = val
              if (v.value_type === "pressure") changes.pressure = val
            })
          }
        }
        
        if (sensors.length > 0) {
          setConnectedSensors(prev => {
             // Avoid duplicate updates if data hasn't changed meaningfully to prevent component re-renders
             // simple length check for now, can be improved
             if (prev.length === sensors.length && prev[0]?.lastSeen === sensors[0]?.lastSeen) return prev
             return sensors
          })
        }

        // Calculate AQI if we have PM data
        if (changes.pm25 !== undefined && changes.pm10 !== undefined) {
          const { aqi, status } = calculateAQI(changes.pm25, changes.pm10)
          changes.aqi = aqi
          changes.aqiStatus = status
          console.log(`Calculated AQI: ${aqi} (${status})`)
        }

        setSensorData(prev => ({ ...prev, ...changes }))
        console.log("Sensor data updated with variation:", changes)

      } catch (error: any) {
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
           console.warn("Sensor data fetch timed out")
        } else {
           console.error("Failed to fetch sensor data:", error)
        }
      }
    }

    // Fetch immediately when entering SENSE or BOOT state (to discover sensors early)
    if (currentState === "SENSE" || currentState === "BOOT") {
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
  }, [currentState, isAutoMode, sensorAddresses])

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
    // Publish Normal Data
    if (currentState === "TRANSMIT") {
      console.log("Entering TRANSMIT state, preparing to send sensor data:", sensorData)
      
      const transmitTimer = setTimeout(async () => {
        try {
          const startTime = Date.now()
          
          // Priority 1: Send critical data first (PM2.5, PM10, AQI)
          const criticalPayload = {
            pm25: sensorData.pm25,
            pm10: sensorData.pm10,
            aqi: sensorData.aqi,
            aqiStatus: sensorData.aqiStatus,
            timestamp: sensorData.timestamp,
            fsmState: currentState,
            type: "Air Pollution Monitor (Priority)",
            txStartTime: new Date(startTime).toISOString(), // Human readable format
          }
          
          await publishData("adld/sensor/pollution_data", criticalPayload)
          const criticalTime = Date.now()
          const criticalDuration = criticalTime - startTime
          console.log(`✅ Critical Data transmitted (Priority) in ${criticalDuration}ms`)

          // Priority 2: Full System Data
          const fullPayload = {
            ...sensorData,
            fsmState: currentState,
            systemStatus: "ONLINE",
            source: "Sensor.community (Open Source)",
            type: "Air Pollution Monitor",
            priorityTxTime: `${criticalDuration}ms`,
            preFullTxTime: `${Date.now() - startTime}ms`,
          }

          const success = await publishData("adld/sensor/pollution_data", fullPayload)
          const totalDuration = Date.now() - startTime
          
          if (success) {
            console.log(`✅ Data transmitted via MQTT successfully in ${totalDuration}ms`)
            setLastTxStats({
              criticalDuration,
              totalDuration,
              timestamp: Date.now()
            })
            transitionTo("SLEEP", `MQTT transmission completed (Critical: ${criticalDuration}ms, Total: ${totalDuration}ms)`)
          } else {
            console.warn("⚠️ MQTT transmission failed, but continuing state flow")
            transitionTo("ERROR", "MQTT transmission failed")
          }
        } catch (error) {
          console.error("❌ MQTT transmission error:", error)
          transitionTo("ERROR", "MQTT transmission critical error")
        }
      }, 500)
      
      return () => clearTimeout(transmitTimer)
    }

    // Publish Error Data
    if (currentState === "ERROR") {
      console.log("Entering ERROR state, publishing fault info")
      
      const errorTimer = setTimeout(async () => {
        try {
          // Find the last error message from the log
          const lastErrorEvent = eventLog.slice().reverse().find(e => e.toState === "ERROR")
          const reason = lastErrorEvent ? lastErrorEvent.message : "Unknown System Fault"

          await publishData("adld/sensor/pollution_data", {
            ...sensorData,
            fsmState: currentState,
            systemStatus: "FAULT",
            errorMessage: reason,
            source: "Sensor.community (Open Source)",
            type: "Air Pollution Monitor"
          })
          console.log("✅ Error status transmitted via MQTT")
        } catch (error) {
           console.error("Failed to publish error status", error)
        }
      }, 100)
      return () => clearTimeout(errorTimer)
    }

  }, [currentState, sensorData, addEvent, eventLog, transitionTo])

  const averagePower =
    powerHistory.length > 0
      ? powerHistory.reduce((sum, p) => sum + p.power, 0) / powerHistory.length
      : STATE_CONFIGS[currentState].power

  const isCharging = currentState === "SLEEP" || currentState === "BOOT" || currentState === "SELF_TEST"

  const triggerFault = useCallback(() => {
    transitionTo("ERROR", "Manual fault triggered via control panel")
  }, [transitionTo])

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
    triggerFault,
    setConfig: (updates: Partial<FSMConfig>) => setConfig((prev) => ({ ...prev, ...updates })),
    connectedSensors,
    lastTxStats, // Expose the new stats
  }
}
