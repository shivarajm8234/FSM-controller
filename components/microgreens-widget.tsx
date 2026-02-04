"use client"

import { Card } from "@/components/ui/card"
import { useFSMController } from "@/hooks/use-fsm-controller"
import { Sprout, Wind, Leaf } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function MicrogreensWidget() {
  const { myCrops, sensorData } = useFSMController()

  // Simplified Calculation for Widget
  // Ideally this should be shared logic, but for now we approximate or just show status.
  // Let's just show the active crops and their "Purification Power" (based on count).
  
  const cropCount = myCrops.length
  // Assume avg purification 0.8 per crop
  const estimatedImpact = (cropCount * 0.8 * 0.5).toFixed(1) // 50% efficiency assumption

  return (
    <div className="h-full flex flex-col p-2 space-y-2">
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Sprout className="w-4 h-4" />
             </div>
             <div>
                <div className="text-sm font-bold text-foreground">My Garden</div>
                <div className="text-[10px] text-muted-foreground">{cropCount} Active Crops</div>
             </div>
          </div>
          <Link href="/microgreens">
             <Button variant="ghost" size="sm" className="h-6 text-[10px]">Manage</Button>
          </Link>
       </div>

       <div className="flex-1 bg-muted/20 rounded p-2 flex flex-col justify-center space-y-3">
           <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Current Impact</span>
              <span className="text-emerald-500 font-mono font-bold">-{estimatedImpact} AQI</span>
           </div>
           
           <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                 <span>Filtration Load</span>
                 <span>{(sensorData.aqi || 0) > 50 ? "High" : "Normal"}</span>
              </div>
              <Progress value={Math.min(100, cropCount * 10)} className="h-1.5" />
           </div>

           {cropCount === 0 && (
             <div className="text-[10px] text-center text-muted-foreground pt-1">
               Add crops to improve air quality
             </div>
           )}
       </div>
    </div>
  )
}
