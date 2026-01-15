export type FSMState = "SLEEP" | "WAKE" | "SENSE" | "TRANSMIT" | "ERROR"

export interface StateConfig {
  name: FSMState
  power: number
  description: string
  color: string
  bgColor: string
  borderColor: string
  hexColor: string
}

export interface SensorData {
  temperature: number
  humidity: number
  battery: number
  pm10?: number
  pm25?: number
  timestamp: number
}

export interface PowerDataPoint {
  time: string
  power: number
  state: FSMState
}

export interface EventLogEntry {
  id: string
  timestamp: Date
  fromState: FSMState | null
  toState: FSMState
  message: string
}

export interface FSMConfig {
  sleepInterval: number
  senseThreshold: number
  transmitRetries: number
  errorRecoveryTime: number
}

export const STATE_CONFIGS: Record<FSMState, StateConfig> = {
  SLEEP: {
    name: "SLEEP",
    power: 0.1,
    description: "Ultra-low power standby mode",
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/50",
    hexColor: "#38bdf8",
  },
  WAKE: {
    name: "WAKE",
    power: 5,
    description: "System initialization sequence",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/50",
    hexColor: "#fbbf24",
  },
  SENSE: {
    name: "SENSE",
    power: 15,
    description: "Active sensor data acquisition",
    color: "text-teal-400",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/50",
    hexColor: "#2dd4bf",
  },
  TRANSMIT: {
    name: "TRANSMIT",
    power: 50,
    description: "RF data transmission active",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/50",
    hexColor: "#34d399",
  },
  ERROR: {
    name: "ERROR",
    power: 2,
    description: "Fault recovery procedure",
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/50",
    hexColor: "#fb7185",
  },
}

export const VALID_TRANSITIONS: Record<FSMState, FSMState[]> = {
  SLEEP: ["WAKE"],
  WAKE: ["SENSE", "ERROR", "SLEEP"],
  SENSE: ["TRANSMIT", "ERROR", "SLEEP"],
  TRANSMIT: ["SLEEP", "ERROR"],
  ERROR: ["SLEEP", "WAKE"],
}
