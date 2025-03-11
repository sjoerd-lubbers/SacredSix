"use client"

import { useState } from "react"
import axios from "axios"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from "@/components/ui/dialog"

interface AiTaskSuggestionsProps {
  projectId: string
  projectName: string
  projectDescription?: string
  currentTasks: string[]
  onAddTask: (task: {
    name: string;
    description: string;
    priority: string;
    estimatedTime: string;
  }) => void
}

export function AiTaskSuggestions({
  projectId,
  projectName,
  projectDescription = "",
  currentTasks,
  onAddTask
}: AiTaskSuggestionsProps) {
  const { toast } = useToast()
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])
  const [isLoadingAiSuggestions, setIsLoadingAiSuggestions] = useState(false)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500 dark:text-red-400"
      case "medium":
        return "text-yellow-500 dark:text-yellow-400"
      case "low":
        return "text-green-500 dark:text-green-400"
      default:
        return "text-muted-foreground"
    }
  }

  const generateSuggestions = async () => {
    setIsLoadingAiSuggestions(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return
      
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }
      
      const description = (document.getElementById("ai-description") as HTMLTextAreaElement)?.value || projectDescription
      
      const response = await axios.post(
        "http://localhost:5000/api/ai/suggest-tasks", 
        {
          title: projectName,
          description,
          currentTasks,
          projectId
        }, 
        config
      )
      
      setAiSuggestions(response.data.suggestedTasks)
      
      toast({
        title: "AI Suggestions Generated",
        description: "AI has suggested tasks for your project.",
      })
    } catch (error) {
      console.error("Error getting AI suggestions:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get AI suggestions. Please try again.",
      })
    } finally {
      setIsLoadingAiSuggestions(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Sparkles className="mr-2 h-4 w-4" /> AI Suggestions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>AI Task Suggestions</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md bg-muted p-4">
            <h3 className="mb-2 font-medium">Generate AI Task Suggestions</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Let AI suggest tasks for your project based on a title and description.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="ai-title" className="mb-2 block text-sm font-medium">
                    Title
                  </label>
                  <Input 
                    id="ai-title" 
                    placeholder="E.g., Meal planning for the week"
                    value={projectName}
                    readOnly
                  />
                </div>
                <div>
                  <label htmlFor="ai-description" className="mb-2 block text-sm font-medium">
                    Description (Optional)
                  </label>
                  <Textarea 
                    id="ai-description" 
                    placeholder="Describe what you want to accomplish..."
                    className="min-h-[100px]"
                    defaultValue={projectDescription}
                  />
                </div>
              </div>
              <Button 
                onClick={generateSuggestions}
                disabled={isLoadingAiSuggestions}
              >
                {isLoadingAiSuggestions ? "Generating..." : "Generate Suggestions"}
              </Button>
            </div>
          </div>
          
          {aiSuggestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Suggested Tasks</h3>
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="rounded-md border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{suggestion.name}</h4>
                        <p className="mt-1 text-sm text-muted-foreground">{suggestion.description}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`text-xs ${getPriorityColor(suggestion.priority)}`}>
                            Priority: {suggestion.priority.charAt(0).toUpperCase() + suggestion.priority.slice(1)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Est. Time: {suggestion.estimatedTime} hours
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          onAddTask({
                            name: suggestion.name,
                            description: suggestion.description,
                            priority: suggestion.priority,
                            estimatedTime: String(suggestion.estimatedTime * 60), // Convert hours to minutes
                          })
                        }}
                      >
                        Add Task
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
