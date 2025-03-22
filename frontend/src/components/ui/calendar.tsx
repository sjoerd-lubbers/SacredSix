"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface CalendarProps {
  className?: string
  month?: Date
  selected?: Date | Date[]
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  [key: string]: any
}

function Calendar({
  className,
  month = new Date(),
  selected,
  onSelect,
  disabled,
  ...props
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(month)
  
  // Simple calendar that just shows the current month
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()
  
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay()
  
  const handleDateSelect = (day: number) => {
    if (onSelect) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      )
      onSelect(date)
    }
  }
  
  const isSelected = (day: number) => {
    if (!selected) return false
    
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    )
    
    if (Array.isArray(selected)) {
      return selected.some(
        (selectedDate) => 
          selectedDate.getDate() === date.getDate() &&
          selectedDate.getMonth() === date.getMonth() &&
          selectedDate.getFullYear() === date.getFullYear()
      )
    }
    
    return (
      selected.getDate() === date.getDate() &&
      selected.getMonth() === date.getMonth() &&
      selected.getFullYear() === date.getFullYear()
    )
  }
  
  const isDisabled = (day: number) => {
    if (!disabled) return false
    
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    )
    
    return disabled(date)
  }
  
  const prevMonth = () => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1
      )
    )
  }
  
  const nextMonth = () => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1
      )
    )
  }
  
  const monthName = currentMonth.toLocaleString('default', { month: 'long' })
  const year = currentMonth.getFullYear()
  
  return (
    <div className={cn("p-3", className)} {...props}>
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={prevMonth}
          className="p-1 rounded-md border"
          type="button"
        >
          Prev
        </button>
        <div>
          {monthName} {year}
        </div>
        <button 
          onClick={nextMonth}
          className="p-1 rounded-md border"
          type="button"
        >
          Next
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="text-sm font-medium">
            {day}
          </div>
        ))}
        
        {Array.from({ length: firstDayOfMonth }).map((_, index) => (
          <div key={`empty-${index}`} />
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1
          const selected = isSelected(day)
          const disabled = isDisabled(day)
          
          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              className={cn(
                "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md",
                selected && "bg-primary text-primary-foreground",
                disabled && "text-muted-foreground opacity-50"
              )}
              onClick={() => handleDateSelect(day)}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
