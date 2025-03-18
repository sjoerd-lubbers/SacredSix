"use client"

import { getEnvironment, ENVIRONMENT_DISPLAY } from "@/config"

interface EnvironmentIndicatorProps {
  variant?: 'badge' | 'app-name'
  showInProduction?: boolean
}

export function EnvironmentIndicator({
  variant = 'badge',
  showInProduction = false
}: EnvironmentIndicatorProps) {
  const environment = getEnvironment()
  
  // Don't show anything in production unless explicitly requested
  if (environment === 'production' && !showInProduction) {
    return null
  }
  
  const { name, color, textColor, shortName } = ENVIRONMENT_DISPLAY[environment]
  
  // Different display variants
  switch (variant) {
    case 'app-name':
      return (
        <span className="flex items-center">
          Sacred Six
          <span className={`ml-2 px-2 py-0.5 rounded-md text-xs font-medium ${color} ${textColor}`}>
            {shortName}
          </span>
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
