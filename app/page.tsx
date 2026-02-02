"use client"

import { FSMDiagram } from "@/components/fsm-diagram"
import { SensorDisplay } from "@/components/sensor-display"
import { PowerChart } from "@/components/power-chart"
import { EventLog } from "@/components/event-log"
import { ControlPanel } from "@/components/control-panel"
import { ThemeToggle } from "@/components/theme-toggle"
import { PollutionChart } from "@/components/pollution-chart"
import { SensorMap } from "@/components/sensor-map"
import { useFSMController } from "@/hooks/use-fsm-controller"
import { STATE_CONFIGS, type FSMState } from "@/lib/fsm-types"
import { Cpu, Activity, LayoutDashboard, Check } from "lucide-react"
import { DashboardGrid } from "@/components/dashboard-grid"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useSoundEffects } from "@/hooks/use-sound-effects"
import { useState } from "react"

export default function Home() {
  const {
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
    setConfig,
    connectedSensors,
    triggerFault,
    lastTxStats,
    sensorHistory,
    simulationMode,
    setSimulationMode,
  } = useFSMController()

  // Visibility state for dashboard sections
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({
    controls: true,
    logs: true,
    fsm: true,
    pollution: true,
    sensors: true,
    power: true,
    map: true,
  })

  // Enable sound effects
  useSoundEffects(currentState)

  return (
    <main className="h-screen w-full bg-background grid-pattern overflow-hidden flex flex-col">
      {/* Compact Header */}
      <header className="h-14 border-b border-border bg-background/50 backdrop-blur-sm px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground tracking-tight">Air Pollution Monitor</h1>
            <p className="text-[10px] text-muted-foreground font-mono">FSM IoT Controller v1.0</p>
          </div>
        </div>
        
        {/* Compact State Info Banner Integrated in Header */}
        <div className="hidden lg:flex items-center gap-6 px-6">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-xs font-mono text-muted-foreground">STATE:</span>
             <span 
               className="text-xs font-mono font-bold px-2 py-0.5 rounded"
               style={{ 
                 backgroundColor: STATE_CONFIGS[currentState].bgColor,
                 color: STATE_CONFIGS[currentState].hexColor
               }}
             >
               {currentState}
             </span>
           </div>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2 bg-card border-border">
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs">View</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Toggle Sections</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.keys(visibleSections).map((key) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={visibleSections[key]}
                  onCheckedChange={(checked) =>
                    setVisibleSections((prev) => ({ ...prev, [key]: checked }))
                  }
                  className="capitalize text-xs font-mono"
                >
                  {key}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />
          <div className="flex items-center gap-2 px-2 py-1 bg-card border border-border rounded-md">
            <Activity className="w-3 h-3 text-emerald-500" />
            <span className="text-[10px] font-mono text-muted-foreground">ONLINE</span>
          </div>
        </div>
      </header>

      <DashboardGrid visibleSections={visibleSections}>
        {{
          controls: (
            <ControlPanel
              currentState={currentState}
              isAutoMode={isAutoMode}
              onAutoModeChange={setIsAutoMode}
              onManualTransition={(state) => transitionTo(state, "Manual transition")}
              onReset={reset}
              config={config}
              onConfigChange={setConfig}
              onTriggerFault={triggerFault}
              simulationMode={simulationMode}
              onSimulationModeChange={setSimulationMode}
            />
          ),
          logs: <EventLog events={eventLog} compact={true} />,
          fsm: (
            <div className="h-full w-full flex flex-col relative">
              <div className="absolute top-2 left-2 z-10 flex gap-2">
                 {["BOOT", "SENSE", "SLEEP", "TRANSMIT"].map((state) => (
                      <div key={state} className="flex items-center gap-1 opacity-70">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: state === currentState ? STATE_CONFIGS[state as FSMState].hexColor : "var(--muted)" }}
                        />
                        <span className="text-[8px] font-mono text-muted-foreground">{state}</span>
                      </div>
                  ))}
              </div>
              <div className="flex-1 flex items-center justify-center overflow-hidden">
                 <div className="scale-90 origin-center w-full">
                    <FSMDiagram
                      currentState={currentState}
                      onStateClick={(state) => !isAutoMode && transitionTo(state, "Manual transition")}
                    />
                 </div>
              </div>
            </div>
          ),
          pollution: <PollutionChart data={sensorHistory} />,
          sensors: (
            <SensorDisplay 
              data={sensorData} 
              isCharging={isCharging} 
              sensors={connectedSensors} 
              lastTxStats={lastTxStats}
            />
          ),
          power: <PowerChart data={powerHistory} averagePower={averagePower} />,
          map: (
            <SensorMap 
              latitude={connectedSensors[0]?.latitude} 
              longitude={connectedSensors[0]?.longitude} 
              locationName={connectedSensors[0]?.locationName}
              aqi={sensorData.aqi}
              aqiStatus={sensorData.aqiStatus}
            />
          )
        }}
      </DashboardGrid>
    </main>
  )
}
