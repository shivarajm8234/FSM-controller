"use client"

import { motion } from "framer-motion"
import type { SensorData } from "@/lib/fsm-types"
import { Thermometer, Droplets, Battery, BatteryCharging, Signal, Wind } from "lucide-react"

interface SensorDisplayProps {
  data: SensorData
  isCharging: boolean
}

export function SensorDisplay({ data, isCharging }: SensorDisplayProps) {
  const getBatteryColor = (level: number) => {
    if (level > 60) return "text-emerald-400"
    if (level > 30) return "text-amber-400"
    return "text-rose-400"
  }

  const getBatteryBg = (level: number) => {
    if (level > 60) return "bg-emerald-400"
    if (level > 30) return "bg-amber-400"
    return "bg-rose-400"
  }

  const getTemperatureColor = (temp: number) => {
    if (temp < 15) return "text-sky-400"
    if (temp > 35) return "text-rose-400"
    return "text-teal-400"
  }

  const metrics = [
    {
      icon: <Thermometer className={`w-4 h-4 ${getTemperatureColor(data.temperature)}`} />,
      label: "TEMP",
      value: data.temperature.toFixed(1),
      unit: "°C",
      progress: (data.temperature / 50) * 100,
      color: getTemperatureColor(data.temperature),
    },
    {
      icon: <Droplets className="w-4 h-4 text-sky-400" />,
      label: "HUMIDITY",
      value: data.humidity.toFixed(1),
      unit: "%",
      progress: data.humidity,
      color: "text-sky-400",
    },
    {
      icon: isCharging ? (
        <BatteryCharging className="w-4 h-4 text-emerald-400" />
      ) : (
        <Battery className={`w-4 h-4 ${getBatteryColor(data.battery)}`} />
      ),
      label: isCharging ? "CHARGING" : "BATTERY",
      value: data.battery.toFixed(1),
      unit: "%",
      progress: data.battery,
      color: getBatteryColor(data.battery),
      progressColor: getBatteryBg(data.battery),
    },
    ...(data.pm10 !== undefined
      ? [
          {
            icon: <Wind className="w-4 h-4 text-gray-400" />,
            label: "PM10",
            value: data.pm10.toFixed(1),
            unit: "µg/m³",
            progress: Math.min(100, (data.pm10 / 50) * 100), // Assuming 50 is a high value
            color: "text-gray-400",
          },
        ]
      : []),
    ...(data.pm25 !== undefined
      ? [
          {
            icon: <Wind className="w-4 h-4 text-slate-400" />,
            label: "PM2.5",
            value: data.pm25.toFixed(1),
            unit: "µg/m³",
            progress: Math.min(100, (data.pm25 / 25) * 100), // Assuming 25 is a high value
            color: "text-slate-400",
          },
        ]
      : []),
  ]

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-mono text-muted-foreground tracking-wider">TELEMETRY</h3>
        <div className="flex items-center gap-1.5">
          <Signal className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] font-mono text-emerald-400">LIVE</span>
        </div>
      </div>

      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {metric.icon}
                <span className="text-[10px] font-mono text-muted-foreground tracking-wider">{metric.label}</span>
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className={`font-mono font-bold text-sm ${metric.color}`}>{metric.value}</span>
                <span className="text-[10px] text-muted-foreground">{metric.unit}</span>
              </div>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${metric.progressColor || metric.color.replace("text-", "bg-")}`}
                initial={{ width: 0 }}
                animate={{ width: `${metric.progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
