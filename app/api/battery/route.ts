import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export const dynamic = 'force-dynamic'

async function getBatteryLevel(): Promise<number | null> {
  try {
    // Try multiple methods to get battery status on Linux
    
    // Method 1: Using upower (most reliable on modern Linux)
    try {
      const { stdout } = await execAsync('upower -i $(upower -e | grep BAT) | grep percentage')
      const match = stdout.match(/(\d+)%/)
      if (match) {
        return parseInt(match[1], 10)
      }
    } catch (e) {
      // upower not available, try next method
    }

    // Method 2: Reading from /sys/class/power_supply/BAT0/
    try {
      const { stdout: capacity } = await execAsync('cat /sys/class/power_supply/BAT0/capacity')
      const level = parseInt(capacity.trim(), 10)
      if (!isNaN(level)) {
        return level
      }
    } catch (e) {
      // BAT0 not available, try BAT1
      try {
        const { stdout: capacity } = await execAsync('cat /sys/class/power_supply/BAT1/capacity')
        const level = parseInt(capacity.trim(), 10)
        if (!isNaN(level)) {
          return level
        }
      } catch (e) {
        // BAT1 not available either
      }
    }

    // Method 3: Using acpi command
    try {
      const { stdout } = await execAsync('acpi -b')
      const match = stdout.match(/(\d+)%/)
      if (match) {
        return parseInt(match[1], 10)
      }
    } catch (e) {
      // acpi not available
    }

    return null
  } catch (error) {
    console.error('Error reading battery level:', error)
    return null
  }
}

export async function GET() {
  try {
    const level = await getBatteryLevel()
    
    if (level !== null) {
      return NextResponse.json({ 
        level,
        timestamp: Date.now(),
        source: 'system'
      })
    } else {
      // No battery found (desktop or battery reading failed)
      return NextResponse.json({ 
        level: null,
        message: 'No battery detected or unable to read battery status',
        timestamp: Date.now(),
        source: 'system'
      }, { status: 200 }) // Still return 200, just with null level
    }
  } catch (error) {
    console.error('Battery API error:', error)
    return NextResponse.json({ 
      error: 'Failed to read battery status',
      level: null,
      timestamp: Date.now()
    }, { status: 500 })
  }
}
