"use client"

import { MapPin, ExternalLink } from "lucide-react"

interface SensorMapProps {
  latitude?: number | string
  longitude?: number | string
  locationName?: string
  aqi?: number
  aqiStatus?: string
}

export function SensorMap({ latitude, longitude, locationName, aqi, aqiStatus }: SensorMapProps) {
  // Default to Stuttgart area if no coordinates (approx location of sensor 71641)
  const latVal = latitude ? Number(latitude) : 48.7758
  const lonVal = longitude ? Number(longitude) : 9.1829
  
  // Ensure valid numbers
  const lat = isNaN(latVal) ? 48.7758 : latVal
  const lon = isNaN(lonVal) ? 9.1829 : lonVal
  
  // Calculate bounding box for the embed
  // High zoom for approx 30m-50m visibility. 
  // 0.0003 deg is approx 30m. Let's use 0.0015 for a close neighborhood view.
  const delta = 0.0015
  const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`

  const getAQIColor = (aqiValue: number) => {
    if (aqiValue <= 50) return "bg-emerald-500 shadow-emerald-500/50"
    if (aqiValue <= 100) return "bg-yellow-500 shadow-yellow-500/50"
    if (aqiValue <= 150) return "bg-orange-500 shadow-orange-500/50"
    if (aqiValue <= 200) return "bg-red-500 shadow-red-500/50"
    if (aqiValue <= 300) return "bg-purple-500 shadow-purple-500/50"
    return "bg-rose-900 shadow-rose-900/50"
  }

  const colorClass = aqi !== undefined ? getAQIColor(aqi) : "bg-muted shadow-none"

  return (
    <div className="bg-card border border-border rounded-lg h-full flex flex-col relative overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border z-10 bg-card/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-xs font-mono text-muted-foreground tracking-wider">PRECISE LOCATION (30m ZONE)</h3>
        </div>
        {locationName && (
          <div className="px-2 py-1 bg-secondary rounded">
            <span className="text-[10px] font-mono text-foreground truncate max-w-[150px] block">
              {locationName}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 w-full min-h-[100px] relative bg-muted/20 pb-0">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`}
          className="w-full h-full filter opacity-80 hover:opacity-100 transition-opacity"
          title="Precise Sensor Zone"
        />
        
        {/* AQI Overlay - Simplified */}
        {aqi !== undefined && (
          <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
             <div className={`px-2 py-1 rounded backdrop-blur-md border border-white/10 flex items-center gap-2 shadow-lg ${aqiStatus === 'Good' ? 'bg-emerald-950/80 text-emerald-400' : 'bg-black/80 text-white'}`}>
                <div className={`w-2 h-2 rounded-full ${colorClass.split(" ")[0]} animate-pulse`} />
                <span className="text-xs font-bold font-mono">AQI {aqi}</span>
             </div>
             {aqiStatus && (
               <span className="text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded font-mono backdrop-blur">
                 {aqiStatus.toUpperCase()}
               </span>
             )}
          </div>
        )}

        <a 
          href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=13/${lat}/${lon}`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm p-1.5 rounded-md border border-border hover:bg-background transition-colors z-10"
        >
          <ExternalLink className="w-3 h-3 text-muted-foreground" />
        </a>
      </div>
    </div>
  )
}
