'use client' // Error components must be Client Components

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-950 text-white gap-4">
      <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold">Something went wrong in the Microgreens Module!</h2>
      <p className="text-zinc-400 max-w-md text-center text-sm">
        {error.message || "An unexpected error occurred while calculating crop impacts."}
      </p>
      <div className="flex gap-4">
        <Button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
          variant="outline"
          className="border-white/10 hover:bg-white/5"
        >
          Try again
        </Button>
        <Button
            onClick={() => window.location.href = '/'}
            className="bg-emerald-600 hover:bg-emerald-700"
        >
            Return Home
        </Button>
      </div>
    </div>
  )
}
