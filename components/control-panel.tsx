"use client"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { type FSMState, type FSMConfig, VALID_TRANSITIONS, STATE_CONFIGS } from "@/lib/fsm-types"
import { Play, Square, RotateCcw, ChevronRight, Settings2 } from "lucide-react"

interface ControlPanelProps {
  currentState: FSMState
  isAutoMode: boolean
  onAutoModeChange: (auto: boolean) => void
  onManualTransition: (state: FSMState) => void
  onReset: () => void
  config: FSMConfig
  onConfigChange: (config: Partial<FSMConfig>) => void
}

export function ControlPanel({
  currentState,
  isAutoMode,
  onAutoModeChange,
  onManualTransition,
  onReset,
  config,
  onConfigChange,
}: ControlPanelProps) {
  const validTransitions = VALID_TRANSITIONS[currentState]

  return (
    <div className="bg-card border border-border rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-xs font-mono text-muted-foreground tracking-wider">CONTROL</h3>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="auto-mode" className="text-[10px] font-mono text-muted-foreground">
            {isAutoMode ? "AUTO" : "MANUAL"}
          </Label>
          <Switch id="auto-mode" checked={isAutoMode} onCheckedChange={onAutoModeChange} />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Mode indicator */}
        <div
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded ${
            isAutoMode ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-amber-500/10 border border-amber-500/30"
          }`}
        >
          {isAutoMode ? (
            <>
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-mono text-emerald-400">AUTONOMOUS MODE</span>
            </>
          ) : (
            <>
              <Square className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-mono text-amber-400">MANUAL CONTROL</span>
            </>
          )}
        </div>

        {/* Transition buttons */}
        {!isAutoMode && validTransitions.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-muted-foreground">AVAILABLE TRANSITIONS</span>
            <div className="flex flex-wrap gap-2">
              {validTransitions.map((state) => {
                const stateConfig = STATE_CONFIGS[state]
                return (
                  <Button
                    key={state}
                    variant="outline"
                    size="sm"
                    onClick={() => onManualTransition(state)}
                    className={`font-mono text-xs h-8 border-border hover:border-current ${stateConfig.color} hover:${stateConfig.bgColor}`}
                  >
                    <ChevronRight className="w-3 h-3 mr-1" />
                    {state}
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {/* Reset button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="w-full font-mono text-xs h-8 border-border hover:bg-secondary bg-transparent"
        >
          <RotateCcw className="w-3 h-3 mr-2" />
          SYSTEM RESET
        </Button>

        {/* Configuration sliders */}
        <div className="space-y-4 pt-3 border-t border-border">
          <span className="text-[10px] font-mono text-muted-foreground">PARAMETERS</span>

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-[10px] font-mono text-muted-foreground">SLEEP INTERVAL</Label>
                <span className="text-xs font-mono text-foreground">{config.sleepInterval}s</span>
              </div>
              <Slider
                value={[config.sleepInterval]}
                onValueChange={([value]) => onConfigChange({ sleepInterval: value })}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
            </div>



            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-[10px] font-mono text-muted-foreground">PM10 THRESHOLD</Label>
                <span className="text-xs font-mono text-foreground">{config.pm10Threshold} µg/m³</span>
              </div>
              <Slider
                value={[config.pm10Threshold]}
                onValueChange={([value]) => onConfigChange({ pm10Threshold: value })}
                min={10}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-[10px] font-mono text-muted-foreground">PM2.5 THRESHOLD</Label>
                <span className="text-xs font-mono text-foreground">{config.pm25Threshold} µg/m³</span>
              </div>
              <Slider
                value={[config.pm25Threshold]}
                onValueChange={([value]) => onConfigChange({ pm25Threshold: value })}
                min={5}
                max={50}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
