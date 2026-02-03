import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Try BAT1 then BAT0
    const batteries = ['BAT1', 'BAT0'];
    
    for (const bat of batteries) {
        try {
            // Using standard fs promises
            const capacityPath = `/sys/class/power_supply/${bat}/capacity`;
            const statusPath = `/sys/class/power_supply/${bat}/status`;
            
            // Check existence first to avoid errors
            await fs.access(capacityPath);
            
            const capacity = await fs.readFile(capacityPath, 'utf-8');
            const status = await fs.readFile(statusPath, 'utf-8');
            
            return NextResponse.json({ 
                level: parseInt(capacity.trim()),
                isCharging: status.trim() === 'Charging' || status.trim() === 'Full',
                source: bat
            });
        } catch (inner) {
            // Continue to next battery
            continue;
        }
    }

    console.error("No battery found in sysfs");
    return NextResponse.json({ error: "Battery not found" }, { status: 404 });
  } catch (error) {
    console.error("Battery API Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: String(error) }, { status: 500 });
  }
}

// Prevent caching to ensure real-time data
export const dynamic = 'force-dynamic';
