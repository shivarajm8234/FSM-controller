"use client"

import { FSMDiagram } from "@/components/fsm-diagram"
import { SensorDisplay } from "@/components/sensor-display"
import { PowerChart } from "@/components/power-chart"
import { EventLog } from "@/components/event-log"
import { ControlPanel } from "@/components/control-panel"
import { StateInfo } from "@/components/state-info"
import { ThemeToggle } from "@/components/theme-toggle"
import { useFSMController } from "@/hooks/use-fsm-controller"
import { Cpu, Activity } from "lucide-react"

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
  } = useFSMController()

  return (
    <main className="min-h-screen bg-background grid-pattern">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                <Cpu className="w-6 h-6 text-primary" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-semibold text-foreground tracking-tight">FSM Controller</h1>
              <p className="text-xs text-muted-foreground font-mono">Industrial IoT Sensor Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-mono text-muted-foreground">SYSTEM ONLINE</span>
            </div>
          </div>
        </header>

        {/* Current State Banner */}
        <StateInfo currentState={currentState} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* FSM Diagram - Main focus area */}
          <div className="lg:col-span-8">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-mono text-muted-foreground tracking-wider">STATE MACHINE TOPOLOGY</h2>
                <div className="flex items-center gap-4">
                  {["SLEEP", "WAKE", "SENSE", "TRANSMIT", "ERROR"].map((state) => (
                    <div key={state} className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-sm"
                        style={{ backgroundColor: state === currentState ? "oklch(0.7 0.15 170)" : "var(--muted)" }}
                      />
                      <span className="text-[9px] font-mono text-muted-foreground">{state}</span>
                    </div>
                  ))}
                </div>
              </div>
              <FSMDiagram
                currentState={currentState}
                onStateClick={(state) => !isAutoMode && transitionTo(state, "Manual transition")}
              />
            </div>
          </div>

          {/* Right Sidebar - Controls & Sensors */}
          <div className="lg:col-span-4 space-y-6">
            <ControlPanel
              currentState={currentState}
              isAutoMode={isAutoMode}
              onAutoModeChange={setIsAutoMode}
              onManualTransition={(state) => transitionTo(state, "Manual transition")}
              onReset={reset}
              config={config}
              onConfigChange={setConfig}
            />
            <SensorDisplay data={sensorData} isCharging={isCharging} />
          </div>
        </div>

        {/* Bottom Row - Charts and Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PowerChart data={powerHistory} averagePower={averagePower} />
          <EventLog events={eventLog} />
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-center pt-4 border-t border-border">
          <p className="text-[10px] font-mono text-muted-foreground">
            FSM IoT Controller v1.0 — Real-time State Machine Visualization
          </p>
        </footer>
      </div>
    </main>
  )
}
