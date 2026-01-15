"use client"

import type { PowerDataPoint } from "@/lib/fsm-types"
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts"
import { TrendingUp } from "lucide-react"

interface PowerChartProps {
  data: PowerDataPoint[]
  averagePower: number
}

export function PowerChart({ data, averagePower }: PowerChartProps) {
  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-xs font-mono text-muted-foreground tracking-wider">POWER CONSUMPTION</h3>
        </div>
        <div className="flex items-center gap-2 px-2 py-1 bg-secondary rounded">
          <span className="text-[10px] font-mono text-muted-foreground">AVG</span>
          <span className="font-mono font-bold text-sm text-teal-400">{averagePower.toFixed(2)}</span>
          <span className="text-[10px] text-muted-foreground">mW</span>
        </div>
      </div>

      <div className="p-4">
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
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
                domain={[0, 60]}
                ticks={[0, 15, 30, 45, 60]}
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
                itemStyle={{ color: "#2dd4bf" }}
                formatter={(value: number) => [`${value} mW`, "Power"]}
              />
              <ReferenceLine y={averagePower} stroke="#6b7280" strokeDasharray="3 3" strokeWidth={1} />
              <Area
                type="stepAfter"
                dataKey="power"
                stroke="#2dd4bf"
                strokeWidth={1.5}
                fill="url(#powerGradient)"
                animationDuration={300}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
