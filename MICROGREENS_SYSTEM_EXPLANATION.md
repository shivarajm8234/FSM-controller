# Microgreens Air Purification System - Technical Explanation

## Overview
The Microgreens section is an intelligent air quality management system that simulates how microgreen plants can purify indoor air by reducing AQI (Air Quality Index) and VOC (Volatile Organic Compounds). It integrates real-time MQTT sensor data with a Finite State Machine (FSM) controller to make automated decisions about indoor/outdoor plant placement.

---

## 🌱 Core Components

### 1. **Real-Time Sensor Integration (MQTT)**
The system connects to live sensor data through the `useFSMController` hook:

```typescript
const { 
  currentState,      // Current FSM state
  sensorData,        // Live MQTT data: {temperature, humidity, aqi}
  transitionTo,      // Manual state transitions
  isAutoMode,        // Auto FSM mode toggle
  myCrops,           // Selected crops
  toggleCrop,        // Add/remove crops
  addCrop            // Add new crop
} = useFSMController()
```

**Sensor Data Used:**
- **Temperature** (°C): Affects crop viability and triggers indoor/outdoor decisions
- **Humidity** (%): Influences growth success calculations
- **AQI** (Air Quality Index): Primary metric for air purification simulation

---

## 📊 AQI Purification Logic

### How AQI Reduction Works

#### Step 1: Crop Database
Each microgreen has a **purification power** rating:

```typescript
{
  id: "radish",
  name: "Radish",
  purification: 1.0,        // AQI reduction: 1.0 points/day
  vocRemovalMean: 2,        // VOC reduction: 2 µg/m³/day
  mechanism: "High transpiration rate, fine leaf texture → effective PM2.5 dust capture"
}
```

**Example Crops:**
- **Radish**: 1.0 AQI/day, 2 VOC/day (Beginner)
- **Pea Shoots**: 2.0 AQI/day, 3 VOC/day (Beginner)
- **Sunflower**: 3.0 AQI/day, 6 VOC/day (Intermediate) - Strongest purifier

#### Step 2: Total Purification Calculation
```typescript
const totalPurification = myCrops.reduce((acc, id) => {
  const crop = cropDatabase.find(c => c.id === id)
  return acc + (crop?.purification || 0)
}, 0)

const totalVocRemoval = myCrops.reduce((acc, id) => {
  const crop = cropDatabase.find(c => c.id === id)
  return acc + (crop?.vocRemovalMean || 0)
}, 0)
```

**Example:**
- If you have **Radish (1.0)** + **Sunflower (3.0)** = **4.0 total purification**

#### Step 3: Efficiency Modifier (Indoor vs Outdoor)
```typescript
const efficiency = isIndoorRequired ? 1.0 : 0.5
```

- **Indoor (100% efficiency)**: Plants are in controlled environment, full filtration
- **Outdoor (50% efficiency)**: Wind disperses purification effect

#### Step 4: Final AQI Calculation
```typescript
const currentReduction = totalPurification * efficiency
const indoorAQI = Math.max(0, aqi - currentReduction)
```

**Real Example:**
- Outdoor AQI: **120**
- Total Purification: **4.0** (Radish + Sunflower)
- Efficiency: **1.0** (Indoor mode)
- **Indoor AQI = 120 - 4.0 = 116**

---

## 🧪 VOC (Volatile Organic Compounds) Reduction

### VOC Simulation
VOCs are harmful gases (formaldehyde, benzene, etc.) that plants can absorb through their leaves.

```typescript
const baseVoc = 200 + (Math.random() * 20 - 10)  // Baseline: ~200 µg/m³
const currentVocReduction = totalVocRemoval * efficiency
const indoorVoc = Math.max(0, baseVoc - currentVocReduction)
```

**Example:**
- Baseline VOC: **210 µg/m³**
- Total VOC Removal: **8 µg/m³/day** (Radish 2 + Sunflower 6)
- Efficiency: **1.0** (Indoor)
- **Indoor VOC = 210 - 8 = 202 µg/m³**

### VOC Mechanisms by Crop
Each crop has a specific VOC removal mechanism:

| Crop | VOC Removal | Mechanism |
|------|-------------|-----------|
| Radish | 2 µg/m³/day | VOC interaction + particulate surface deposition |
| Pea Shoots | 3 µg/m³/day | VOC adsorption + larger leaf area |
| Sunflower | 6 µg/m³/day | Larger leaves → more surface for deposition |
| Mustard | 4.5 µg/m³/day | Dense foliage → VOC/PM interaction |

---

## 🤖 Finite State Machine (FSM) Integration

### Automatic Indoor/Outdoor Decision Logic

The system automatically decides whether crops should be **INDOOR** or **OUTDOOR** based on environmental thresholds:

```typescript
const [thresholds, setThresholds] = useState({
  maxTemp: 30,    // °C
  minTemp: 10,    // °C
  maxHum: 80,     // %
  minHum: 30,     // %
  maxAQI: 100     // AQI units
})
```

#### Decision Tree:
```typescript
let reason = ""
if (aqi > thresholds.maxAQI) 
  reason = `Pollution (> ${thresholds.maxAQI})`
else if (temp > thresholds.maxTemp) 
  reason = `High Heat (> ${thresholds.maxTemp}°C)`
else if (temp < thresholds.minTemp) 
  reason = `Cold Snap (< ${thresholds.minTemp}°C)`
else if (hum < thresholds.minHum) 
  reason = `Dry Air (< ${thresholds.minHum}%)`
else if (hum > thresholds.maxHum) 
  reason = `High Humidity (> ${thresholds.maxHum}%)`

const isIndoorRequired = reason !== "" || manualIndoor
const growthMode = isIndoorRequired ? `INDOOR (${reason || "Manual"})` : "OUTDOOR"
```

**Example Scenario:**
- **Outdoor AQI = 150** (exceeds threshold of 100)
- **Decision**: `INDOOR (Pollution > 100)`
- **Efficiency**: 1.0 (full purification)
- **FSM State**: Automatically transitions to protect crops

### Automatic Safety Override
If you have outdoor-only crops (like Kale) and conditions become dangerous:

```typescript
useEffect(() => {
  const hasAtRiskCrops = myCrops.some(id => {
    const crop = cropDatabase.find(c => c.id === id)
    return crop && !crop.indoorSafe  // Outdoor crops
  })

  if (reason !== "" && hasAtRiskCrops && !manualIndoor) {
    setManualIndoor(true)  // Auto-enable "Force Indoor" mode
  }
}, [reason, myCrops, manualIndoor])
```

---

## 📈 Real-Time Data Visualization

### 1. AQI History Chart (Updates Every 5 Seconds)
```typescript
useEffect(() => {
  const timer = setInterval(() => {
    setAqiHistory(prev => {
      const now = new Date()
      const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
      
      const baseVoc = 200 + (Math.random() * 20 - 10)
      const indoorVoc = Math.max(0, baseVoc - currentVocReduction)

      const newPoint = { 
        time: timeStr, 
        indoor: indoorAQI, 
        outdoor: aqi,
        reduction: Number((aqi - indoorAQI).toFixed(1)),
        voc: Number(indoorVoc.toFixed(1))
      }
      
      return [...prev, newPoint].slice(-60)  // Keep last 60 points (5 minutes)
    })
  }, 5000)  // Update every 5 seconds
  return () => clearInterval(timer)
}, [indoorAQI, aqi, currentVocReduction])
```

**Chart Features:**
- **Red Area**: Outdoor AQI (from MQTT sensor)
- **Green Area**: Indoor AQI (after purification)
- **Gap Between**: Visual representation of purification impact
- **Tooltip**: Shows exact reduction at each time point

### 2. Comparison Bar Chart (AQI + VOC)
```typescript
const comparisonData = [
  { name: 'AQI', Outdoor: aqi, Indoor: indoorAQI },
  { name: 'VOC (µg)', Outdoor: 210, Indoor: Math.max(0, 210 - currentVocReduction) }
]
```

Shows side-by-side comparison of:
- **Outdoor AQI** vs **Indoor AQI**
- **Outdoor VOC** vs **Indoor VOC**

### 3. 5-Day Prediction Model
```typescript
const generatePrediction = useCallback(() => {
  const data = []
  let currentLevel = aqi
  let currentVoc = 210
  
  data.push({ day: 'Today', predicted: aqi, reducedVoc: currentVoc })
  
  for (let i = 1; i <= 5; i++) {
    currentLevel = Math.max(0, currentLevel - currentReduction)
    currentVoc = Math.max(0, currentVoc - currentVocReduction)
    
    data.push({ 
      day: `Day +${i}`, 
      predicted: Number(currentLevel.toFixed(1)), 
      reducedVoc: Number(currentVoc.toFixed(1)) 
    })
  }
  setPredictionData(data)
  setShowPrediction(true)
}, [aqi, currentReduction, currentVocReduction])
```

**Prediction Logic:**
- Assumes **continuous purification** at current rate
- Shows **cumulative reduction** over 5 days
- Includes **VOC reduction** projection

---

## 🧠 Crop Intelligence System

### Growth Success Calculation
Each crop's viability is calculated based on current conditions:

```typescript
const calculateSuccess = (crop) => {
  const tempDev = Math.abs(temp - crop.idealTemp)
  const humDev = Math.abs(hum - crop.idealHum)
  const pollutionPenalty = aqi > 150 ? 20 : 0
  
  return Math.max(0, Math.min(100, 
    100 - (tempDev * 3) - (humDev * 0.5) - pollutionPenalty
  ))
}
```

**Factors:**
- **Temperature Deviation**: -3% per °C away from ideal
- **Humidity Deviation**: -0.5% per % away from ideal
- **Pollution Penalty**: -20% if AQI > 150

**Example:**
- **Radish** (Ideal: 22°C, 50% humidity)
- Current: 25°C, 45% humidity, AQI 120
- Temp Dev: |25-22| = 3°C → -9%
- Hum Dev: |45-50| = 5% → -2.5%
- Pollution: 0% (AQI < 150)
- **Success = 100 - 9 - 2.5 = 88.5%** ✅ Good!

### Nutrition Advice (AQI-Based)
```typescript
const getNutritionAdvice = () => {
  if (aqi > 150) return {
    title: "Detox Day",
    crop: "Broccoli Microgreens",
    benefit: "Rich in sulforaphane, helps flush toxins."
  }
  if (aqi > 50) return {
    title: "Immunity Boost",
    crop: "Radish Greens",
    benefit: "Vitamin C for respiratory health."
  }
  return {
    title: "Maintenance",
    crop: "Pea Shoots",
    benefit: "Protein for general vitality."
  }
}
```

---

## 🔧 Advanced Features

### 1. Custom Crop Addition
Users can add their own plants with custom purification values:

```typescript
const handleAddCrop = () => {
  const id = newCrop.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
  const entry = {
    id,
    ...newCrop,
    icon: <Sprout className="w-4 h-4" />
  }
  setCropDatabase(prev => [...prev, entry])
  addCrop(id)
}
```

### 2. Data Export (JSON)
Export complete system state for analysis:

```typescript
const handleExport = () => {
  const dataToExport = {
    timestamp: new Date().toISOString(),
    aqiHistory: aqiHistory,
    predictionData: predictionData,
    currentSensorData: sensorData,
    activeCrops: myCrops.map(id => cropDatabase.find(c => c.id === id)),
    thresholds: thresholds,
    metrics: {
      totalPurification,
      totalVocRemoval,
      indoorAQI,
      outdoorAQI: aqi,
      currentReduction,
      currentVocReduction,
      efficiency
    }
  }
  // Download as JSON file
}
```

### 3. Beginner Mode
Filters crops to show only "Beginner" level plants:

```typescript
const activeSuggestions = cropDatabase.filter(s => {
  if (beginnerMode && s.level !== "Beginner") return false
  return true
})
```

---

## 📊 Complete Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    MQTT Sensor (Real-time)                  │
│              Temperature, Humidity, AQI                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  FSM Controller (useFSMController)          │
│  • Reads sensor data                                        │
│  • Manages crop selection                                   │
│  • Handles state transitions                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Threshold Evaluation Logic                     │
│  • Check: AQI > 100? Temp > 30°C? Hum < 30%?               │
│  • Decision: INDOOR or OUTDOOR                              │
│  • Efficiency: 1.0 (indoor) or 0.5 (outdoor)                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Purification Calculation                       │
│  • Total Purification = Σ(crop.purification)                │
│  • Total VOC Removal = Σ(crop.vocRemovalMean)               │
│  • Current Reduction = Total × Efficiency                   │
│  • Indoor AQI = Outdoor AQI - Current Reduction             │
│  • Indoor VOC = Baseline VOC - VOC Removal                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Real-time Visualization                     │
│  • AQI History Chart (updates every 5s)                     │
│  • Comparison Bar Chart (AQI + VOC)                         │
│  • 5-Day Prediction Model                                   │
│  • Crop Intelligence Cards                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Metrics Summary

| Metric | Description | Calculation |
|--------|-------------|-------------|
| **Outdoor AQI** | Raw sensor reading | From MQTT |
| **Indoor AQI** | Purified air quality | `Outdoor - (Purification × Efficiency)` |
| **Current Reduction** | Active purification rate | `Σ(crop.purification) × Efficiency` |
| **Total VOC Removal** | VOC reduction rate | `Σ(crop.vocRemovalMean) × Efficiency` |
| **Efficiency** | Indoor/Outdoor modifier | `1.0` (indoor) or `0.5` (outdoor) |
| **Growth Success** | Crop viability % | `100 - TempDev×3 - HumDev×0.5 - Pollution` |

---

## 🚀 Example Scenario

**Initial State:**
- Outdoor AQI: **120**
- Temperature: **25°C**
- Humidity: **45%**
- Selected Crops: **None**

**User Actions:**
1. Add **Radish** (purification: 1.0, VOC: 2)
2. Add **Sunflower** (purification: 3.0, VOC: 6)

**System Response:**
- Total Purification: **4.0**
- Total VOC Removal: **8.0**
- AQI > 100 → **INDOOR mode triggered**
- Efficiency: **1.0**

**Results:**
- Indoor AQI: **120 - 4.0 = 116** ✅
- Indoor VOC: **210 - 8.0 = 202 µg/m³** ✅
- 5-Day Prediction: **Day 5 AQI = 100** (safe level!)

**Chart Updates:**
- Real-time graph shows **green area (indoor)** below **red area (outdoor)**
- Gap represents **4.0 AQI reduction**
- Updates every **5 seconds** with new sensor data

---

## 🔬 Scientific Basis

The purification values are based on real research:
- **Phytoremediation**: Plants absorb pollutants through stomata
- **Particulate Deposition**: Leaf surfaces trap PM2.5 dust
- **VOC Absorption**: Microgreens metabolize formaldehyde, benzene
- **Transpiration**: Increases air circulation and filtration

**References:**
- NASA Clean Air Study
- Phytoremediation research (Wolverton et al.)
- Indoor air quality studies on microgreens

---

## 📝 Summary

The Microgreens system is a **real-time air quality simulation** that:

1. ✅ Connects to **live MQTT sensors** (temp, humidity, AQI)
2. ✅ Calculates **AQI and VOC reduction** based on selected crops
3. ✅ Uses **FSM logic** to auto-decide indoor/outdoor placement
4. ✅ Visualizes **real-time purification** with charts (updates every 5s)
5. ✅ Provides **5-day predictions** and crop intelligence
6. ✅ Supports **custom crops** and data export

**Core Formula:**
```
Indoor AQI = Outdoor AQI - (Σ Crop Purification × Efficiency)
Indoor VOC = Baseline VOC - (Σ Crop VOC Removal × Efficiency)
```

This creates an interactive, educational tool for understanding how plants can improve indoor air quality! 🌱
