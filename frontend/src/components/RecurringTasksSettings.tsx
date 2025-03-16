"use client"

import { useState } from "react"
import axios from "axios"
import { Repeat } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiEndpoint } from "@/config"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface RecurringTasksSettingsProps {
  projectId: string
  defaultTasksRecurring: boolean
  defaultRecurringDays: string[]
  onSettingsUpdated: () => void
}

export function RecurringTasksSettings({
  projectId,
  defaultTasksRecurring,
  defaultRecurringDays,
  onSettingsUpdated
}: RecurringTasksSettingsProps) {
  const { toast } = useToast()
  const [isRecurring, setIsRecurring] = useState(defaultTasksRecurring)
  const [selectedDays, setSelectedDays] = useState<string[]>(defaultRecurringDays || [])
  const [isSaving, setIsSaving] = useState(false)

  const handleDaySelection = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day) 
        : [...prev, day]
    )
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      await axios.put(apiEndpoint(`projects/${projectId}/recurring-settings`), {
        defaultTasksRecurring: isRecurring,
        defaultRecurringDays: selectedDays
      }, config)

      toast({
        title: "Settings saved",
        description: "Recurring task settings have been updated.",
      })

      // Notify parent component to refresh project data
      onSettingsUpdated()
    } catch (error) {
      console.error("Error saving recurring task settings:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save recurring task settings. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Repeat className="mr-2 h-5 w-5" />
          Recurring Tasks Settings
        </CardTitle>
        <CardDescription>
          Configure default recurring task settings for this project
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Make new tasks recurring by default</h4>
            <p className="text-sm text-muted-foreground">
              When enabled, all new tasks created in this project will be set as recurring
            </p>
          </div>
          <Switch 
            checked={isRecurring}
            onCheckedChange={setIsRecurring}
          />
        </div>
        
        {isRecurring && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Default recurring days:</p>
            <div className="flex flex-wrap gap-2">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                <Badge 
                  key={day}
                  variant={selectedDays.includes(day) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleDaySelection(day)}
                >
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              When completed, recurring tasks will reset to "todo" status on the selected days.
              If no days are selected, tasks will reset every weekday (Mon-Fri).
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={saveSettings} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </CardFooter>
    </Card>
  )
}
