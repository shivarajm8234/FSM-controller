"use client"

import { motion } from "framer-motion"
import type { SensorData, SensorDetail, TransmissionStats } from "@/lib/fsm-types"
import { Battery, BatteryCharging, Signal, Wind, Gauge, ShieldCheck, AlertTriangle, AlertOctagon, Wifi, Info, MapPin, Factory, Calendar, Clock, ArrowUpRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface SensorDisplayProps {
  data: SensorData
  isCharging: boolean
  sensors?: SensorDetail[]
  lastTxStats?: TransmissionStats | null
}

export function SensorDisplay({ data, isCharging, sensors = [], lastTxStats }: SensorDisplayProps) {
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

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return "text-emerald-400" // Good
    if (aqi <= 100) return "text-yellow-400" // Moderate
    if (aqi <= 150) return "text-orange-400" // Unhealthy for Sensitive
    if (aqi <= 200) return "text-red-400" // Unhealthy
    if (aqi <= 300) return "text-purple-400" // Very Unhealthy
    return "text-rose-900" // Hazardous
  }

  const getAQIIcon = (aqi: number) => {
    if (aqi <= 50) return <ShieldCheck className="w-4 h-4 text-emerald-400" />
    if (aqi <= 150) return <AlertTriangle className={`w-4 h-4 ${getAQIColor(aqi)}`} />
    return <AlertOctagon className={`w-4 h-4 ${getAQIColor(aqi)}`} />
  }

  const metrics = [
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
            progress: Math.min(100, (data.pm25 / 25) * 100),
            color: "text-slate-400",
          },
        ]
      : []),
    ...(data.pressure !== undefined
      ? [
          {
            icon: <Gauge className="w-4 h-4 text-indigo-400" />,
            label: "PRESSURE",
            value: (data.pressure / 100).toFixed(2), // Convert Pa to hPa if needed, or keep as is. Usually they send Pa. Let's check typical values.
            // BME280 usually sends Pa. e.g. 100000. 1000 hPa. 
            // The value I saw in curl was "100844.23". That is Pa. 
            // 1 hPa = 100 Pa. So 100844 / 100 = 1008.44 hPa.
            // Let's display hPa.
            unit: " hPa", 
            progress: 75, // constant for now or relative to standard atm
            color: "text-indigo-400",
          },
        ]
        : []),
    ...(data.aqi !== undefined
      ? [
          {
            icon: getAQIIcon(data.aqi),
            label: "AIR QUALITY",
            value: data.aqi.toString(),
            unit: " AQI",
            progress: Math.min(100, (data.aqi / 300) * 100),
            color: getAQIColor(data.aqi),
            progressColor: getAQIColor(data.aqi).replace("text-", "bg-"),
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

      {/* Network / Transmission Stats */}
      {lastTxStats && (
        <div className="mt-6 border-t border-border pt-4">
           <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono text-muted-foreground tracking-wider">TRANSMISSION LATENCY</h3>
            <div className="flex items-center gap-1.5">
              <ArrowUpRight className="w-3 h-3 text-sky-400" />
              <span className="text-[10px] font-mono text-sky-400">LAST TX</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-secondary/50 rounded border border-border/50">
               <span className="text-[10px] font-mono text-muted-foreground block mb-1">CRITICAL</span>
               <div className="flex items-baseline gap-1">
                 <span className="font-mono text-lg font-bold text-foreground">{lastTxStats.criticalDuration}</span>
                 <span className="text-[10px] text-muted-foreground">ms</span>
               </div>
            </div>
            <div className="p-2 bg-secondary/50 rounded border border-border/50">
               <span className="text-[10px] font-mono text-muted-foreground block mb-1">TOTAL</span>
               <div className="flex items-baseline gap-1">
                 <span className="font-mono text-lg font-bold text-foreground">{lastTxStats.totalDuration}</span>
                 <span className="text-[10px] text-muted-foreground">ms</span>
               </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 border-t border-border pt-4">
         <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono text-muted-foreground tracking-wider">CONNECTED SENSORS</h3>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-mono text-emerald-400">ONLINE</span>
          </div>
        </div>
        <div className="space-y-2">
          {sensors.length > 0 ? (
            sensors.map((sensor) => (
              <Dialog key={sensor.id}>
                <DialogTrigger asChild>
                  <div className="flex items-center justify-between text-xs p-2 bg-secondary/50 rounded border border-border/50 cursor-pointer hover:bg-secondary/80 transition-colors">
                    <div className="flex flex-col">
                       <span className="font-medium text-foreground">{sensor.type} Sensor</span>
                       <span className="text-[10px] text-muted-foreground font-mono">ID: {sensor.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <Info className="w-3 h-3 text-muted-foreground" />
                       <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{sensor.type} Sensor Details</DialogTitle>
                    <DialogDescription>
                      Full technical specifications and location data
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      
                      <div className="space-y-1">
                        <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                          <Factory className="w-3 h-3" /> Manufacturer
                        </span>
                        <p className="text-sm font-medium">{sensor.manufacturer}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Nation
                        </span>
                        <p className="text-sm font-medium">{sensor.country}</p>
                        <p className="text-xs text-muted-foreground">Alt: {sensor.altitude}m</p>
                      </div>

                      <div className="space-y-1 col-span-2">
                         <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Coordinates
                        </span>
                        <p className="text-sm font-mono text-muted-foreground">
                          {sensor.latitude}, {sensor.longitude}
                        </p>
                        {sensor.locationName && (
                          <p className="text-xs font-medium text-foreground">
                            Address: {sensor.locationName}
                          </p>
                        )}
                        <a 
                          href={`https://www.openstreetmap.org/?mlat=${sensor.latitude}&mlon=${sensor.longitude}#map=15/${sensor.latitude}/${sensor.longitude}`} 
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          View on Map
                        </a>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Last Seen
                        </span>
                        <p className="text-xs font-mono">{new Date(sensor.lastSeen).toLocaleString()}</p>
                      </div>
                      
                      <div className="space-y-1">
                         <span className="text-xs font-mono text-muted-foreground">Placement</span>
                         <div className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${sensor.indoor ? "bg-amber-500/10 text-amber-500" : "bg-sky-500/10 text-sky-500"}`}>
                           {sensor.indoor ? "INDOOR" : "OUTDOOR"}
                         </div>
                      </div>

                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))
          ) : (
            <div className="text-center py-4 text-xs text-muted-foreground">
              No active sensors found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
