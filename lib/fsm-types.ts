export type FSMState = "BOOT" | "SELF_TEST" | "SLEEP" | "WAKE" | "SENSE" | "PROCESS" | "TRANSMIT" | "ERROR" | "REPAIR"

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
  temperatureThreshold: number
  humidityThreshold: number
  pm10Threshold: number
  pm25Threshold: number
  transmitRetries: number
  errorRecoveryTime: number
}

export const STATE_CONFIGS: Record<FSMState, StateConfig> = {
  BOOT: {
    name: "BOOT",
    power: 10,
    description: "System initialization and startup",
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/50",
    hexColor: "#9ca3af",
  },
  SELF_TEST: {
    name: "SELF_TEST",
    power: 8,
    description: "Hardware and software diagnostics",
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/50",
    hexColor: "#9ca3af",
  },
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
    description: "System activation from sleep",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/50",
    hexColor: "#34d399",
  },
  SENSE: {
    name: "SENSE",
    power: 15,
    description: "Active sensor data acquisition",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/50",
    hexColor: "#34d399",
  },
  PROCESS: {
    name: "PROCESS",
    power: 20,
    description: "Data processing and validation",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/50",
    hexColor: "#34d399",
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
    description: "Fault detection and recovery",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/50",
    hexColor: "#fb7185",
  },
  REPAIR: {
    name: "REPAIR",
    power: 3,
    description: "System recovery and maintenance",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/50",
    hexColor: "#fbbf24",
  },
}

export const VALID_TRANSITIONS: Record<FSMState, FSMState[]> = {
  BOOT: ["SELF_TEST"],
  SELF_TEST: ["SLEEP", "ERROR"],
  SLEEP: ["WAKE"],
  WAKE: ["SENSE"],
  SENSE: ["PROCESS"],
  PROCESS: ["TRANSMIT", "ERROR"],
  TRANSMIT: ["SLEEP", "ERROR"],
  ERROR: ["REPAIR"],
  REPAIR: ["SLEEP"],
}
