"use client"

import { Button } from "@/components/ui/button"
import { Sprout } from "lucide-react"
import { useRouter } from "next/navigation"

export function MicrogreensButton() {
  const router = useRouter()

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="h-8 gap-2 bg-card border-border text-emerald-500 hover:text-emerald-400 hover:border-emerald-500/50"
      onClick={() => router.push("/microgreens")}
    >
      <Sprout className="w-3.5 h-3.5" />
      <span className="hidden sm:inline text-xs">Microgreens</span>
    </Button>
  )
}
