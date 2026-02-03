"use client"

import { useFSMController } from "@/hooks/use-fsm-controller"
import { Bug, CloudRain, Leaf, Power, Radio, RefreshCw, Zap, Sprout, Wind, Droplets, Sun, AlertTriangle, ShieldCheck, HeartPulse, Utensils, Info, Moon, CheckCircle, ArrowRight } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { FSMDiagram } from "@/components/fsm-diagram"
import { FSMState, StateConfig } from "@/lib/fsm-types"
import Link from "next/link"
import { useState, useEffect } from "react"

export default function MicrogreensPage() {
  const { 
    currentState, 
    sensorData, 
    transitionTo,
    isAutoMode,
    setIsAutoMode
  } = useFSMController()

  const [mounted, setMounted] = useState(false)
  const [beginnerMode, setBeginnerMode] = useState(true)
  const [myCrops, setMyCrops] = useState<string[]>([])
  
  // Real-time Indoor/Outdoor Config
  const [manualIndoor, setManualIndoor] = useState(false)
  const [showPrediction, setShowPrediction] = useState(false)
  const [predictionData, setPredictionData] = useState<{ day: string, predicted: number }[]>([])

  // Local History Tracking (Real-time)
  const [aqiHistory, setAqiHistory] = useState<{ time: string, indoor: number, outdoor: number, reduction: number }[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Extended Crop Database with Specific Needs & Purification Power
  const [cropDatabase, setCropDatabase] = useState([
      { id: "radish", name: "Radish", level: "Beginner", indoorSafe: true, days: 7, harvestRange: "6-8", notes: "Very fast growth, early AQI impact starts ~Day 3", idealTemp: 22, idealHum: 50, purification: 0.8, mechanism: "High transpiration rate, fine leaf texture → effective PM2.5 dust capture.", icon: <Leaf className="w-4 h-4" /> },
      { id: "pea", name: "Pea Shoots", level: "Beginner", indoorSafe: true, days: 10, harvestRange: "10-14", notes: "Slower start, stronger effect after leaf expansion", idealTemp: 20, idealHum: 60, purification: 0.65, mechanism: "Broad leaves enhance particulate deposition and CO₂ uptake.", icon: <Sprout className="w-4 h-4" /> },
      { id: "sunflower", name: "Sunflower", level: "Intermediate", indoorSafe: true, days: 12, harvestRange: "7-10", notes: "Large leaves → strongest AQI impact from Day 4 onward", idealTemp: 24, idealHum: 45, purification: 1.5, mechanism: "Large leaf surface area + strong photosynthesis → maximum particulate interaction.", icon: <Sun className="w-4 h-4" /> },
      { id: "mustard", name: "Mustard", level: "Beginner", indoorSafe: true, days: 8, harvestRange: "7-9", notes: "Dense foliage, consistent mid-cycle impact", idealTemp: 21, idealHum: 55, purification: 1.0, mechanism: "Dense foliage, higher stomatal activity → moderate VOC and dust interaction.", icon: <Wind className="w-4 h-4" /> },
      { id: "beet", name: "Beet", level: "Advanced", indoorSafe: true, days: 14, harvestRange: "10-14", notes: "Slower growth, stabilizing AQI role", idealTemp: 23, idealHum: 65, purification: 0.55, mechanism: "Moderate leaf area → supportive, stabilizing role.", icon: <Droplets className="w-4 h-4" /> },
      // Outdoor Specific (High Durability)
      { id: "kale", name: "Red Russian Kale", level: "Beginner", indoorSafe: false, days: 16, harvestRange: "8-12", notes: "Cooler-temp crop, modest air-clean contribution", idealTemp: 15, idealHum: 70, purification: 0.45, mechanism: "Lower transpiration, smaller leaves → mild particulate trapping.", icon: <CloudRain className="w-4 h-4" /> },
      { id: "spinach", name: "Hardy Spinach", level: "Beginner", indoorSafe: false, days: 18, harvestRange: "10-15", notes: "Slow but steady growth, late-cycle effect", idealTemp: 16, idealHum: 80, purification: 0.55, mechanism: "Steady photosynthesis, moderate leaf density → consistent but limited impact.", icon: <ShieldCheck className="w-4 h-4" /> },
  ])

  // New Crop State
  const [isAddCropOpen, setIsAddCropOpen] = useState(false)
  const [newCrop, setNewCrop] = useState({
      name: "",
      level: "Beginner",
      indoorSafe: true,
      days: 7,
      idealTemp: 22,
      idealHum: 50,
      purification: 0.5,
      mechanism: ""
  })

  // Add New Crop Handler
  const handleAddCrop = () => {
      const id = newCrop.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4)
      const entry = {
          id,
          ...newCrop,
          icon: <Sprout className="w-4 h-4" /> // Default icon
      }
      setCropDatabase(prev => [...prev, entry])
      setMyCrops(prev => [...prev, id]) // Auto-add to my crops
      setIsAddCropOpen(false)
      // Reset form
      setNewCrop({
        name: "",
        level: "Beginner",
        indoorSafe: true,
        days: 7,
        idealTemp: 22,
        idealHum: 50,
        purification: 0.5,
        mechanism: ""
      })
  }

  // Calculate Impact 
  const totalPurification = myCrops.reduce((acc, id) => {
      const crop = cropDatabase.find(c => c.id === id)
      return acc + (crop?.purification || 0)
  }, 0)
  
  // Threshold State
  const [thresholds, setThresholds] = useState({
      maxTemp: 30,
      minTemp: 10,
      maxHum: 80,
      minHum: 30,
      maxAQI: 100
  })

  // 2️⃣ Indoor Safety Logic (Multi-Factor & Customizable)
  const temp = sensorData?.temperature ?? 22
  const hum = sensorData?.humidity ?? 50
  const aqi = sensorData?.aqi ?? 0

  let reason = ""
  if (aqi > thresholds.maxAQI) reason = `Pollution (> ${thresholds.maxAQI})`
  else if (temp > thresholds.maxTemp) reason = `High Heat (> ${thresholds.maxTemp}°C)`
  else if (temp < thresholds.minTemp) reason = `Cold Snap (< ${thresholds.minTemp}°C)`
  else if (hum < thresholds.minHum) reason = `Dry Air (< ${thresholds.minHum}%)`
  else if (hum > thresholds.maxHum) reason = `High Humidity (> ${thresholds.maxHum}%)`

  const isIndoorRequired = reason !== "" || manualIndoor
  const growthMode = isIndoorRequired ? `INDOOR (${reason || "Manual"})` : "OUTDOOR"
  const growthColor = isIndoorRequired ? "text-amber-400" : "text-emerald-400"

  // Math: Direct Reduction Calculation
  // Assume Full Efficiency if Indoor or Outdoor (Outdoor plants still filter local air)
  // Or adjust efficiency based on mode?
  // User asked for "Run FSM only calculate AQI". 
  // We'll apply the physics simply: Outdoor - Purification.
  // Efficiency: 100% inside, 50% outside (due to wind).
  const efficiency = isIndoorRequired ? 1.0 : 0.5 
  
  // Total Reduction
  const currentReduction = totalPurification * efficiency
  
  // Direct Indoor AQI Calculation
  // If we have crops, we reduce. If we don't, Indoor = Outdoor.
  // User requested both equal initially: Removed passive wall protection.
  const wallProtection = 0 
  const currentDay = 5 // Static day for FSM demo
  const indoorAQI = Math.max(0, Number((aqi - wallProtection - currentReduction).toFixed(1)))
  
  // Track History (Real-time updates)
  useEffect(() => {
      const timer = setInterval(() => {
        setAqiHistory(prev => {
            const now = new Date()
            const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
            
            // Only add point if time changed or it's been a while? 
            // Just add every 5 seconds for "Live" feel or 1 minute.
            // Let's do 5 seconds for demo feel.
            const newPoint = { 
                time: timeStr, 
                indoor: indoorAQI, 
                outdoor: aqi,
                reduction: Number((aqi - indoorAQI).toFixed(1))
            }
            return [...prev, newPoint].slice(-60) // Keep last 60 points
        })
      }, 5000)
      return () => clearInterval(timer)
  }, [indoorAQI, aqi])

  // Automatic "Force Indoor" Safety Logic
  // If conditions are dangerous (reason !== "") AND we have crops that need protection ("BRING INSIDE" status),
  // automatically enable the Indoor Mode toggle to latch the safety state.
  useEffect(() => {
    const hasAtRiskCrops = myCrops.some(id => {
       const crop = cropDatabase.find(c => c.id === id)
       // Crops that are NOT indoorSafe need to be brought inside when conditions are bad
       return crop && !crop.indoorSafe
    })

    if (reason !== "" && hasAtRiskCrops && !manualIndoor) {
        setManualIndoor(true)
    }
  }, [reason, myCrops, manualIndoor])
  
  // Helper: Calculate Success Score per Crop
  const calculateSuccess = (crop: typeof cropDatabase[0]) => {
      const tempDev = Math.abs(temp - crop.idealTemp)
      const humDev = Math.abs(hum - crop.idealHum)
      const pollutionPenalty = aqi > 150 ? 20 : 0
      return Math.max(0, Math.min(100, 100 - (tempDev * 3) - (humDev * 0.5) - pollutionPenalty))
  }

  const handleStateClick = (state: FSMState) => {
      transitionTo(state)
  }

    // Predict Next 5 Days (Cumulative Impact)
    const generatePrediction = () => {
        const data = []
        // Start with current
        data.push({ day: 'Today', predicted: aqi, original: aqi })
        
        let currentLevel = aqi
        for (let i = 1; i <= 5; i++) {
             // Simulate non-linear decay (effectiveness decreases as air gets cleaner)
             // Reduction per step = current_reduction but scaled slightly by how "dirty" the air still is (optional physics)
             // simplified: uniform reduction is fine, but let's make it robust
             currentLevel = Math.max(0, currentLevel - currentReduction)
             
             data.push({ day: `Day +${i}`, predicted: Number(currentLevel.toFixed(1)) })
        }
        setPredictionData(data)
        setShowPrediction(true)
    }

  // 1️⃣ Daily AQI → Food Suggestion Logic (Updated with Time & Growth)
  const getNutritionAdvice = () => {
    // Current Sim Day (Default to mid-growth for FSM mode)
    // const currentDay = 5  <-- Now using component-level state 

    // Priority: Active Crops Growth Stage
    if (myCrops.length > 0) {
        const crop = cropDatabase.find(c => c.id === myCrops[0])
        if (crop) {
            if (currentDay >= crop.days) {
                return {
                    title: "Ready to Harvest",
                    crop: `${crop.name} (Day ${currentDay})`,
                    benefit: "Maximum nutrient density reached. Harvest now!",
                    icon: <CheckCircle className="w-5 h-5 text-emerald-500" />
                }
            } else {
                return {
                    title: "Growing Phase",
                    crop: `${crop.name} (Day ${currentDay}/${crop.days})`,
                    benefit: "Accumulating vitamins. Keep checking air quality.",
                    icon: <Sprout className="w-5 h-5 text-blue-500 animate-pulse" />
                }
            }
        }
    }

    // Fallback: General AQI Advice
    const aqi = sensorData?.aqi ?? 0
    if (aqi > 150) return {
        title: "Detox Day",
        crop: "Broccoli Microgreens",
        benefit: "Rich in sulforaphane, helps flush toxins.",
        icon: <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
    }
    if (aqi > 50) return {
        title: "Immunity Boost",
        crop: "Radish Greens",
        benefit: "Vitamin C for respiratory health.",
        icon: <HeartPulse className="w-5 h-5 text-red-600 dark:text-red-400" />
    }
    return {
        title: "Maintenance",
        crop: "Pea Shoots",
        benefit: "Protein for general vitality.",
        icon: <Leaf className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    }
  }
  const nutrition = getNutritionAdvice()
  // ... (keep rest)


  // Filter suggestions
  const activeSuggestions = cropDatabase.filter(s => {
      if (beginnerMode && s.level !== "Beginner") return false
      return true
  })

  const toggleCrop = (id: string) => {
      setMyCrops(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  if (!mounted) return null
  
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white p-4 font-mono overflow-x-hidden selection:bg-emerald-500/30 transition-colors duration-300">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-zinc-200 dark:border-white/10 pb-4">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20 shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <Sprout className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-emerald-400 dark:to-cyan-400">
                    Smart Growing System
                    </h1>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="h-5 px-1 bg-emerald-100 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px]">v1.0</Badge>
                   <span>PURIFICATION SIM </span>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                {/* Theme Toggle */}
                <ThemeToggle />

                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900/50 p-1.5 rounded-lg border border-zinc-200 dark:border-white/5 shadow-sm">
                    <span className="text-xs text-muted-foreground pl-2">Beginner Mode</span>
                    <Switch checked={beginnerMode} onCheckedChange={setBeginnerMode} className="data-[state=checked]:bg-emerald-500" />
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900/50 p-1.5 rounded-lg border border-zinc-200 dark:border-white/5 shadow-sm">
                    <span className="text-xs text-muted-foreground pl-2">Auto Run</span>
                    <Switch checked={isAutoMode} onCheckedChange={setIsAutoMode} className="data-[state=checked]:bg-emerald-500" />
                </div>
                <Link href="/">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-zinc-900 dark:hover:text-white">
                        Return to Monitor
                    </Button>
                </Link>
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* LEFT COLUMN */}
            <div className="space-y-6 lg:col-span-1">
                
                 {/* Air Quality Impact Card */}
                 <Card 
                    className="p-4 bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 relative overflow-hidden shadow-sm cursor-pointer hover:border-emerald-500/50 transition-colors group"
                    onClick={generatePrediction}
                 >
                    <div className="absolute top-0 right-0 p-2 opacity-5 dark:opacity-10">
                        <Wind className="w-12 h-12 text-zinc-900 dark:text-white" />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Leaf className="w-3 h-3 text-emerald-500" />
                            Air Purification Sim
                        </h3>
                    </div>
                    
                    <div className="space-y-4">
                        {/* Timeline Graph */}
                        <div className="h-[120px] w-full mt-2">
                             <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={aqiHistory}>
                                    <defs>
                                        <linearGradient id="colorIndoor" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorOutdoor" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.1} />
                                    <XAxis dataKey="time" hide />
                                    <YAxis hide domain={[0, 'auto']} />
                                    <Tooltip 
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                const outdoor = Number(payload[0]?.value ?? 0)
                                                const indoor = Number(payload[1]?.value ?? 0)
                                                return (
                                                    <div className="bg-black/90 backdrop-blur border border-white/10 p-2 rounded shadow-xl">
                                                        <p className="text-[10px] font-bold text-zinc-400 mb-1 border-b border-white/10 pb-1">{label}</p>
                                                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px]">
                                                            <span className="text-red-400">Outdoor:</span> <span className="font-mono text-right text-red-400">{outdoor}</span>
                                                            <span className="text-emerald-400">Indoor:</span> <span className="font-mono text-right text-emerald-400">{indoor}</span>
                                                        </div>
                                                         <div className="mt-1 pt-1 border-t border-white/10 flex justify-between gap-2 text-[9px]">
                                                            <span className="text-blue-400 font-bold">Reduced:</span>
                                                            <span className="text-blue-400 font-mono">-{outdoor - indoor} AQI</span>
                                                         </div>
                                                    </div>
                                                )
                                            }
                                            return null
                                        }}
                                    />
                                    <Area type="monotone" dataKey="outdoor" stroke="#ef4444" fillOpacity={1} fill="url(#colorOutdoor)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="indoor" stroke="#10b981" fillOpacity={1} fill="url(#colorIndoor)" strokeWidth={2} />
                                </AreaChart>
                             </ResponsiveContainer>
                        </div>

                        <div className="flex justify-between items-end border-t border-zinc-100 dark:border-white/5 pt-2">
                            <div className="text-left">
                                <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-red-500" /> Outdoor
                                </div>
                                <div className="text-lg font-bold text-red-500 dark:text-red-400 leading-none mt-1">{sensorData?.aqi ?? 0}</div>
                            </div>
                            
                            <div className="text-center">
                                <span className="text-[10px] text-muted-foreground block">Current Impact</span>
                                <span className="text-xs font-mono text-emerald-500">-{currentReduction.toFixed(1)} AQI</span>
                            </div>

                            <div className="text-right">
                                <div className="text-[10px] text-muted-foreground uppercase flex items-center justify-end gap-1">
                                    Indoor <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                </div>
                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 leading-none mt-1">{indoorAQI}</div>
                            </div>
                        </div>

                        <div className="bg-zinc-100 dark:bg-black/40 p-2 rounded border border-zinc-200 dark:border-white/5">
                            <div className="flex justify-between text-[10px] mb-1">
                                <span className="text-muted-foreground">Microgreen Impact</span>
                                <span className="text-emerald-600 dark:text-emerald-400">-{currentReduction.toFixed(1)} pts/day</span>
                            </div>
                            <Progress value={Math.min(100, (currentReduction * 5))} className="h-1.5 bg-zinc-200 dark:bg-white/10 [&>*]:bg-emerald-500" />
                            <p className="text-[9px] text-muted-foreground mt-1.5">
                                {myCrops.length > 0 
                                    ? `${myCrops.length} active crops installed` 
                                    : "Add crops to simulate air cleaning"}
                            </p>
                        </div>
                    </div>
                 </Card>

                 {/* Environmental Monitor Card */}
                 <Card className="p-4 bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 shadow-sm relative overflow-hidden">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <ActivityIcon className="w-3 h-3 text-blue-500" />
                            Live Environment & Limits
                        </h3>
                        <div className="flex items-center gap-2">
                             <span className="text-[9px] font-bold text-muted-foreground">FORCE INDOOR</span>
                             <Switch checked={manualIndoor} onCheckedChange={setManualIndoor} className="scale-75 data-[state=checked]:bg-amber-500" />
                        </div>
                     </div>
                    <div className="space-y-4">
                        {/* Temperature Row */}
                        <div className="bg-zinc-50 dark:bg-black/20 p-2 rounded border border-zinc-100 dark:border-white/5">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] uppercase text-muted-foreground flex items-center gap-1"><Sun className="w-3 h-3"/> Temp</span>
                                <span className={`text-sm font-bold ${sensorData?.temperature && sensorData.temperature > thresholds.maxTemp ? "text-red-500" : "text-zinc-700 dark:text-zinc-300"}`}>
                                    {sensorData?.temperature?.toFixed(1) ?? "--"}°C
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[8px] uppercase text-muted-foreground block mb-0.5">Min</label>
                                    <input 
                                        type="number" 
                                        value={thresholds.minTemp}
                                        onChange={(e) => setThresholds(p => ({...p, minTemp: Number(e.target.value)}))}
                                        className="w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded px-1.5 py-0.5 text-[10px]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[8px] uppercase text-muted-foreground block mb-0.5">Max</label>
                                    <input 
                                        type="number" 
                                        value={thresholds.maxTemp}
                                        onChange={(e) => setThresholds(p => ({...p, maxTemp: Number(e.target.value)}))}
                                        className="w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded px-1.5 py-0.5 text-[10px]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Humidity Row */}
                        <div className="bg-zinc-50 dark:bg-black/20 p-2 rounded border border-zinc-100 dark:border-white/5">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] uppercase text-muted-foreground flex items-center gap-1"><Droplets className="w-3 h-3"/> Humidity</span>
                                <span className={`text-sm font-bold ${sensorData?.humidity && (sensorData.humidity > thresholds.maxHum || sensorData.humidity < thresholds.minHum) ? "text-red-500" : "text-zinc-700 dark:text-zinc-300"}`}>
                                    {sensorData?.humidity?.toFixed(0) ?? "--"}%
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[8px] uppercase text-muted-foreground block mb-0.5">Min</label>
                                    <input 
                                        type="number" 
                                        value={thresholds.minHum}
                                        onChange={(e) => setThresholds(p => ({...p, minHum: Number(e.target.value)}))}
                                        className="w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded px-1.5 py-0.5 text-[10px]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[8px] uppercase text-muted-foreground block mb-0.5">Max</label>
                                    <input 
                                        type="number" 
                                        value={thresholds.maxHum}
                                        onChange={(e) => setThresholds(p => ({...p, maxHum: Number(e.target.value)}))}
                                        className="w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded px-1.5 py-0.5 text-[10px]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* AQI Row */}
                        <div className="bg-zinc-50 dark:bg-black/20 p-2 rounded border border-zinc-100 dark:border-white/5">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] uppercase text-muted-foreground flex items-center gap-1"><Wind className="w-3 h-3"/> AQI</span>
                                <span className={`text-sm font-bold ${sensorData?.aqi && sensorData.aqi > thresholds.maxAQI ? "text-red-500" : "text-zinc-700 dark:text-zinc-300"}`}>
                                    {sensorData?.aqi ?? "--"}
                                </span>
                            </div>
                            <div>
                                <label className="text-[8px] uppercase text-muted-foreground block mb-0.5">Max Limit</label>
                                <input 
                                    type="number" 
                                    value={thresholds.maxAQI}
                                    onChange={(e) => setThresholds(p => ({...p, maxAQI: Number(e.target.value)}))}
                                    className="w-full bg-white dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded px-1.5 py-0.5 text-[10px]"
                                />
                            </div>
                        </div>
                    </div>
                 </Card>

                 {/* Avoid Today Warning */}
                {(sensorData?.aqi ?? 0) > 150 && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50 p-4 rounded-lg flex items-start gap-3"
                    >
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-red-700 dark:text-red-400">HAZARDOUS AIR</h4>
                            <p className="text-xs text-red-600/80 dark:text-red-200/80 mt-1">Stop airflow. Intense filtration required.</p>
                        </div>
                    </motion.div>
                )}

                 {/* Active Crop Intelligence Card */}
                 <Card className="p-4 bg-gradient-to-br from-purple-50 to-white dark:from-zinc-900 dark:to-black border-zinc-200 dark:border-white/10 shadow-sm relative overflow-hidden">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                        <Utensils className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                        Active Crop Intelligence
                    </h3>
                    
                    {myCrops.length === 0 ? (
                        <div className="text-center py-6">
                            <Sprout className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">Select crops to see detailed analysis.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {myCrops.map(id => {
                                const crop = cropDatabase.find(c => c.id === id)!
                                // const currentDay = 5 // Static day for FSM mode
                                const success = calculateSuccess(crop)
                                const isReady = false
                                const progress = 50 
                                const daysLeft = crop.days - currentDay
                                
                                let stage = "Germination"
                                // Stage Logic
                                if (isReady) stage = "Harvest Ready"
                                else if (progress > 80) stage = "Maturation"
                                else if (progress > 30) stage = "Rapid Growth"
                                
                                return (
                                    <div key={id} className="bg-white/50 dark:bg-zinc-800/50 p-3 rounded-lg border border-purple-100 dark:border-white/5 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-2 opacity-10">
                                            {crop.icon}
                                        </div>
                                        
                                        <div className="flex justify-between items-start mb-2 relative z-10">
                                            <div className="flex items-center gap-2">
                                                <div className={cn("p-1.5 rounded text-white shadow-sm", isReady ? "bg-emerald-500" : "bg-purple-500")}>
                                                    {crop.icon}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-zinc-900 dark:text-white leading-none mb-1">
                                                        {crop.name}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground font-medium">
                                                        {isReady ? "Peak Nutrition • Harvest Now" : `Harvest in ${daysLeft} Days`}
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge variant={isReady ? "default" : "secondary"} className={cn("text-[8px] h-5", isReady ? "bg-emerald-500 hover:bg-emerald-600" : "bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300")}>
                                                {stage}
                                            </Badge>
                                        </div>
                                        
                                        <div className="space-y-2 relative z-10 mt-2">
                                            <div className="bg-zinc-100 dark:bg-black/40 p-1.5 rounded text-[9px] text-muted-foreground border border-zinc-200 dark:border-white/5">
                                                <span className="font-bold text-zinc-700 dark:text-zinc-300 block mb-0.5">Mechanism:</span>
                                                {crop.mechanism}
                                            </div>
                                            
                                            <div className="flex justify-between items-center pt-1">
                                                <div className="flex items-center gap-1.5">
                                                    <Wind className="w-3 h-3 text-emerald-500" />
                                                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
                                                        Current: -{(crop.purification * efficiency).toFixed(1)} AQI (Max {crop.purification})
                                                    </span>
                                                </div>
                                                <Badge variant="outline" className="text-[8px] h-4 border-emerald-500/30 text-emerald-500">
                                                    ACTIVE
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                 </Card>

                 {/* Available Crops List */}
                 <div className="space-y-3">
                     <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             <PlusSquare className="w-3 h-3 text-emerald-500" />
                             Add Crops to Filter Air
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-[10px] text-emerald-500 hover:text-emerald-400 p-0 hover:bg-transparent"
                            onClick={() => setIsAddCropOpen(true)}
                        >
                            + Custom
                        </Button>
                     </h3>
                     <ScrollArea className="h-[300px]">
                        <div className="space-y-2 pr-4">
                            {activeSuggestions.map((crop) => (
                                <Card key={crop.id} 
                                      className={cn(
                                          "p-3 border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer group",
                                          myCrops.includes(crop.id) ? "bg-emerald-500/10 border-emerald-500/50" : "bg-zinc-900/40"
                                      )}
                                      onClick={() => toggleCrop(crop.id)}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-emerald-400">
                                                {crop.icon}
                                            </div>
                                            <span className="font-bold text-sm text-white">{crop.name}</span>
                                        </div>
                                        {myCrops.includes(crop.id) && <Badge className="bg-emerald-500 text-black h-4 px-1 text-[9px]">ADDED</Badge>}
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-gray-500">
                                        <div className="flex gap-2">
                                            <span>Temp: {crop.idealTemp}°C</span>
                                        </div>
                                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 text-[9px] h-4 px-1">
                                            +{crop.purification} Air Clean
                                        </Badge>
                                    </div>
                                </Card>
                            ))}
                        </div>
                     </ScrollArea>
                 </div>
            </div>

            {/* CENTER & RIGHT (Keep existing structure but update crop card) */}
             <div className="lg:col-span-3 space-y-6">
                 
                 {/* FSM Interaction Surface */}
                 <Card className="p-0 overflow-hidden bg-black/60 border-white/10 h-[300px] relative group">
                    <div className="absolute top-4 left-4 z-10 flex gap-2">
                         <Badge variant="outline" className="bg-white/80 dark:bg-black/80 backdrop-blur border-zinc-300 dark:border-white/20 text-xs px-2 py-0.5 gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${isIndoorRequired ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
                             {growthMode}
                        </Badge>
                    </div>
                    {/* FSM Diagram */}
                    <div className="p-2 h-full flex items-center justify-center scale-75 origin-center">
                        <FSMDiagram currentState={currentState} onStateClick={handleStateClick} />
                    </div>
                 </Card>

                 {/* MY SMART GARDEN SECTION */}
                 <div>
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Sprout className="w-5 h-5 text-emerald-400" />
                        My Smart Garden
                        <Badge variant="secondary" className="bg-white/10 text-white ml-2">{myCrops.length} Crops</Badge>
                    </h2>
                    
                    {myCrops.length === 0 ? (
                        <div className="border border-dashed border-white/10 rounded-xl p-12 text-center text-gray-500 bg-white/5">
                            <p>No crops selected. Add microgreens to start purifying your indoor air.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {myCrops.map(id => {
                                const crop = cropDatabase.find(c => c.id === id)!
                                const success = calculateSuccess(crop)
                                const successColor = success > 70 ? "bg-emerald-500" : success > 40 ? "bg-yellow-500" : "bg-red-500"
                                
                                return (
                                    <Card key={id} className="p-4 bg-zinc-900/80 border-white/10 flex flex-col gap-4 relative overflow-hidden backdrop-blur-sm group hover:border-emerald-500/30 transition-all duration-300">
                                        
                                        {/* Header Section */}
                                        <div className="flex justify-between items-start z-10">
                                            <div className="flex items-center gap-3">
                                                 <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-900/20">
                                                     {crop.icon}
                                                 </div>
                                                 <div>
                                                     <h4 className="font-bold text-white text-base leading-tight">{crop.name}</h4>
                                                     <div className="text-[10px] text-zinc-400 leading-tight mt-1 max-w-[150px] line-clamp-1" title={crop.mechanism}>
                                                        {crop.mechanism.split(' ')[0]} Action
                                                     </div>
                                                 </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-600 hover:text-red-400 -mr-2 -mt-2" onClick={() => toggleCrop(id)}>
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>

                                        <Separator className="bg-white/5" />

                                        {/* Detailed Stats Grid */}
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 z-10">
                                            {/* Filtration Effectiveness */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px]">
                                                    <span className="text-zinc-500">Filtration Eff.</span>
                                                    <span className="text-emerald-400 font-mono">Lv.{crop.purification}</span>
                                                </div>
                                                <Progress value={crop.purification * 20} className="h-1 bg-white/5 text-emerald-500" />
                                            </div>

                                            {/* Growth Success Predictor */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px]">
                                                    <span className="text-zinc-500">Growth Viability</span>
                                                    <span className={cn("font-mono", success > 70 ? "text-emerald-400" : "text-amber-400")}>{Math.round(success)}%</span>
                                                </div>
                                                <Progress value={success} className={cn("h-1 bg-white/5", successColor.replace('bg-', 'text-'))} />
                                            </div>
                                        </div>

                                        {/* Growth Timeline */}
                                        <div className="bg-zinc-950/50 rounded-lg p-2 border border-white/5 space-y-1.5 z-10">
                                            <div className="flex items-center justify-between text-[10px]">
                                                <div className="flex flex-col">
                                                    <span className="text-zinc-500">Planted</span>
                                                    <span className="text-white font-medium">Day 0</span>
                                                </div>
                                                
                                                {/* Current Day Indicator */}
                                                <div className="flex flex-col items-center">
                                                    <div className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 mb-0.5">
                                                        Day {currentDay}
                                                    </div>
                                                    <ArrowRight className="w-3 h-3 text-zinc-700" />
                                                </div>

                                                 <div className="flex flex-col items-end">
                                                    <span className="text-zinc-500">Harvest</span>
                                                    <span className="text-emerald-400 font-medium">Day {crop.harvestRange || crop.days}</span>
                                                </div>
                                            </div>
                                            {(crop.notes) && (
                                                <div className="text-[9px] text-zinc-400 leading-normal border-t border-white/5 pt-1 mt-1 font-medium bg-gradient-to-r from-zinc-400 to-zinc-500 bg-clip-text text-transparent">
                                                    {crop.notes}
                                                </div>
                                            )}
                                        </div>

                                        {/* Status Indicators (Badge Style) */}
                                        <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
                                            {/* Safety Check */}
                                            <div className={cn(
                                                "px-2 py-1.5 rounded-md border flex flex-col items-center justify-center text-center transition-colors",
                                                reason !== "" && !manualIndoor && !crop.indoorSafe
                                                    ? "bg-red-500/10 border-red-500/20 text-red-400" 
                                                    : "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                                            )}>
                                                 {manualIndoor ? (
                                                     // Manual Override -> ALWAYS PROTECTED
                                                     <>
                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                            <ShieldCheck className="w-3 h-3" />
                                                            <span className="text-[10px] font-bold">Protected</span>
                                                        </div>
                                                        <span className="text-[9px] opacity-80">Safe Inside</span>
                                                     </>
                                                 ) : reason !== "" ? (
                                                     // Dangerous Outside
                                                     !crop.indoorSafe ? (
                                                        <>
                                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                                <AlertTriangle className="w-3 h-3" />
                                                                <span className="text-[10px] font-bold">Unsafe</span>
                                                            </div>
                                                            <span className="text-[9px] opacity-80">Bring Inside</span>
                                                        </>
                                                     ) : (
                                                        <>
                                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                                <ShieldCheck className="w-3 h-3" />
                                                                <span className="text-[10px] font-bold">Protected</span>
                                                            </div>
                                                            <span className="text-[9px] opacity-80">Safe Indoor</span>
                                                        </>
                                                     )
                                                 ) : (
                                                     // Safe Outside
                                                     !crop.indoorSafe ? (
                                                        <>
                                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                                <Sun className="w-3 h-3" />
                                                                <span className="text-[10px] font-bold">Optimal</span>
                                                            </div>
                                                            <span className="text-[9px] opacity-80">Outdoor Best</span>
                                                        </>
                                                     ) : (
                                                        <>
                                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                                <CheckCircle className="w-3 h-3" />
                                                                <span className="text-[10px] font-bold">Stable</span>
                                                            </div>
                                                            <span className="text-[9px] opacity-80">Indoor OK</span>
                                                        </>
                                                     )
                                                 )}
                                            </div>

                                            {/* Harvest/Air Safety */}
                                            <div className={cn(
                                                "px-2 py-1.5 rounded-md border flex flex-col items-center justify-center text-center",
                                                (sensorData?.aqi ?? 0) > 100 
                                                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
                                                    : "bg-blue-500/5 border-blue-500/20 text-blue-400"
                                            )}>
                                                {(sensorData?.aqi ?? 0) > 100 ? (
                                                    <>
                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                            <CloudRain className="w-3 h-3" />
                                                            <span className="text-[10px] font-bold">Risk</span>
                                                        </div>
                                                        <span className="text-[9px] opacity-80">Wash Recommended</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                            <Leaf className="w-3 h-3" />
                                                            <span className="text-[10px] font-bold">Clean</span>
                                                        </div>
                                                        <span className="text-[9px] opacity-80">Harvest Ready</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                 </div>
             </div>
        </div>

        {/* Prediction Modal */}
        <Dialog open={showPrediction} onOpenChange={setShowPrediction}>
            <DialogContent className="bg-zinc-900 border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <TrendingUpIcon className="w-5 h-5 text-emerald-500" />
                        5-Day AQI Forecast
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400 text-xs">
                        Projected air quality based on current crop growth and filtration efficiency.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="h-[200px] w-full mt-4">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={predictionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                            <XAxis 
                                dataKey="day" 
                                tick={{fontSize: 10, fill: '#71717a'}} 
                                axisLine={false}
                                tickLine={false}
                                tickMargin={10}
                            />
                            <YAxis 
                                domain={[0, 'auto']} 
                                tick={{fontSize: 10, fill: '#71717a'}} 
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                itemStyle={{ color: '#10b981' }}
                                labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                            />
                            <ReferenceLine y={50} stroke="#eab308" strokeDasharray="3 3">
                                <Label value="Safe Level (50)" position="insideTopRight" fill="#eab308" fontSize={9} />
                            </ReferenceLine>
                            <Area 
                                type="monotone" 
                                dataKey="predicted" 
                                name="Projected AQI" 
                                stroke="#10b981" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorPred)" 
                                animationDuration={1500}
                            />
                        </AreaChart>
                     </ResponsiveContainer>
                </div>
                
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg mt-2">
                    <div className="text-xs text-emerald-300 font-medium">Insight</div>
                    <p className="text-[10px] text-zinc-400 mt-1">
                        After 5 days of continuous filtration, your microgreens could reduce Indoor AQI to 
                        <span className="text-white font-bold mx-1">{predictionData[4]?.predicted}</span>
                        (from {sensorData?.aqi} Outdoor). Daily reduction: {currentReduction.toFixed(1)} pts/day.
                    </p>
                </div>
            </DialogContent>
        </Dialog>

        {/* Add Crop Dialog */}
        <Dialog open={isAddCropOpen} onOpenChange={setIsAddCropOpen}>
            <DialogContent className="bg-zinc-900 border-white/10 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Custom Plant</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Enter details for a new microgreen or plant to simulate its purification effects.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right text-xs">Name</Label>
                        <Input 
                            id="name" 
                            value={newCrop.name} 
                            onChange={(e) => setNewCrop({...newCrop, name: e.target.value})}
                            className="col-span-3 bg-zinc-800 border-white/10 h-8 text-xs" 
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="purification" className="text-right text-xs">Purification</Label>
                        <div className="col-span-3 flex items-center gap-2">
                             <Input 
                                id="purification" 
                                type="number" 
                                step="0.1"
                                value={newCrop.purification} 
                                onChange={(e) => setNewCrop({...newCrop, purification: parseFloat(e.target.value)})}
                                className="bg-zinc-800 border-white/10 h-8 text-xs w-20" 
                            />
                            <span className="text-[10px] text-muted-foreground">pts/day decrease</span>
                        </div>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="temp" className="text-right text-xs">Ideal Temp</Label>
                         <div className="col-span-3 flex items-center gap-2">
                            <Input 
                                id="temp" 
                                type="number" 
                                value={newCrop.idealTemp} 
                                onChange={(e) => setNewCrop({...newCrop, idealTemp: parseFloat(e.target.value)})}
                                className="bg-zinc-800 border-white/10 h-8 text-xs w-20" 
                            />
                            <span className="text-[10px] text-muted-foreground">°C</span>
                         </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs">Placement</Label>
                         <div className="col-span-3 flex items-center gap-4">
                             <div className="flex items-center space-x-2">
                                <Switch id="indoor-safe" checked={newCrop.indoorSafe} onCheckedChange={(c) => setNewCrop({...newCrop, indoorSafe: c})} />
                                <Label htmlFor="indoor-safe" className="text-xs">Indoor Safe?</Label>
                             </div>
                         </div>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="desc" className="text-right text-xs">Mechanism</Label>
                        <Input 
                            id="desc" 
                            value={newCrop.mechanism} 
                            onChange={(e) => setNewCrop({...newCrop, mechanism: e.target.value})}
                            className="col-span-3 bg-zinc-800 border-white/10 h-8 text-xs" 
                            placeholder="e.g. Broad leaves trap dust"
                        />
                    </div>
                </div>
                 <div className="flex justify-end">
                    <Button onClick={handleAddCrop} className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs">
                        Add Plant
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    </div>
  )
}

// Icon Components
function PlusSquare(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
  )
}

function X(props: any) {
    return (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
    )
}

function TrendingUpIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
  )
}

function Plus(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  )
}

function ShieldAlert(props: any) {
    return (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
    )
}





function ActivityIcon(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    )
  }
