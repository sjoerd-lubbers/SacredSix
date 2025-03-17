"use client"

import { Target, Heart } from "lucide-react"
import ElementsTab from "@/components/ElementsTab"

export default function PersonalMissionPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center mb-2">
          <Target className="h-7 w-7 mr-3 text-blue-500" />
          <h1 className="text-3xl font-bold">Personal Mission & Values</h1>
        </div>
        <p className="text-muted-foreground mt-2 ml-10 max-w-3xl">
          Define your personal mission and core values to guide your Sacred Six journey. 
          Your mission statement articulates your purpose, while your values serve as guiding 
          principles for decision-making and prioritization.
        </p>
      </div>


      <ElementsTab />
    </div>
  )
}
