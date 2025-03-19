"use client"

import { getEnvironment, ENVIRONMENT_DISPLAY, APP_NAME } from "@/config"

interface EnvironmentIndicatorProps {
  variant?: 'badge' | 'app-name'
  showInProduction?: boolean
}

export function EnvironmentIndicator({
  variant = 'badge',
  showInProduction = false
}: EnvironmentIndicatorProps) {
  const environment = getEnvironment()
  
  const { name, color, textColor, shortName } = ENVIRONMENT_DISPLAY[environment]
  
  // Different display variants
  switch (variant) {
    case 'app-name':
      return (
        <span className="flex items-center">
          {APP_NAME}
          {/* Only show environment badge if not in production or showInProduction is true */}
          {(environment !== 'production' || showInProduction) && (
            <span className={`ml-2 px-2 py-0.5 rounded-md text-xs font-medium ${color} ${textColor}`}>
              {shortName}
            </span>
          )}
        </span>
      )
      
    case 'badge':
    default:
      return (
        <span className={`px-2 py-1 rounded-md text-xs font-medium ${color} ${textColor}`}>
          {name}
        </span>
      )
  }
}
