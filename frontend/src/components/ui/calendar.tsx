"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface CalendarProps {
  className?: string
  selected?: Date | Date[]
  onSelect?: (date: Date | undefined) => void
  disabled?: boolean
  initialFocus?: boolean
  [key: string]: any
}

function Calendar({
  className,
  selected,
  onSelect,
  disabled = false,
  initialFocus,
  ...props
}: CalendarProps) {
  // This is a placeholder component that doesn't actually render a calendar
  // It's just here to satisfy imports without causing errors
  return (
    <div 
      className={cn("p-3", className)} 
      {...props}
    >
      <div className="text-center p-4 border rounded-md">
        <p>Calendar placeholder</p>
        <p className="text-sm text-muted-foreground">
          (Calendar functionality temporarily disabled)
        </p>
      </div>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
