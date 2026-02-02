"use client"

import type { SensorHistoryPoint } from "@/lib/fsm-types"
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { CloudRain } from "lucide-react"

interface PollutionChartProps {
  data: SensorHistoryPoint[]
}

export function PollutionChart({ data }: PollutionChartProps) {
  return (
    <div className="bg-card border border-border rounded-lg h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <CloudRain className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-xs font-mono text-muted-foreground tracking-wider">AIR QUALITY TRENDS</h3>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] text-muted-foreground">PM10</span>
           </div>
           <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-[10px] text-muted-foreground">PM2.5</span>
           </div>
        </div>
      </div>

      <div className="p-2 flex-1 min-h-0">
        <div className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="pm10Gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="pm25Gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tick={{ fill: "#6b7280", fontSize: 9 }}
                axisLine={{ stroke: "#27272a" }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 9 }}
                axisLine={{ stroke: "#27272a" }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                }}
                labelStyle={{ color: "#71717a" }}
              />
              <Area
                type="monotone"
                dataKey="pm10"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#pm10Gradient)"
                name="PM10"
                animationDuration={300}
              />
              <Area
                type="monotone"
                dataKey="pm25"
                stroke="#a855f7"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#pm25Gradient)"
                name="PM2.5"
                animationDuration={300}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
