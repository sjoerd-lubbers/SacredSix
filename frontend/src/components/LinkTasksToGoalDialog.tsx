"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog"
import { apiEndpoint } from "@/config"

interface Task {
  _id: string
  name: string
  description: string
  status: string
  priority: string
  projectId: string
  goalId?: string | null
  dueDate?: string
  estimatedTime?: number
  isSelectedForToday: boolean
  isRecurring?: boolean
  recurringDays?: string[]
  lastCompletedDate?: string
  createdAt: string
  updatedAt: string
}

interface LinkTasksToGoalDialogProps {
  projectId: string
  goalId: string
  goalName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onTasksLinked: () => void
}

export function LinkTasksToGoalDialog({
  projectId,
  goalId,
  goalName,
  open,
  onOpenChange,
  onTasksLinked
}: LinkTasksToGoalDialogProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (open && projectId) {
      fetchTasks()
    }
  }, [open, projectId])

  const fetchTasks = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      const response = await axios.get(apiEndpoint(`tasks/project/${projectId}`), config)
      setTasks(response.data)
      
      // Pre-select tasks that are already linked to this goal
      const linkedTaskIds = response.data
        .filter((task: Task) => task.goalId === goalId)
        .map((task: Task) => task._id)
      
      setSelectedTaskIds(linkedTaskIds)
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      // Get all tasks for this project
      const allTasks = tasks.map(task => task._id)
      
      // For each task, update its goalId only if it's selected or was previously linked to this goal
      const updatePromises = allTasks.map(taskId => {
        const task = tasks.find(t => t._id === taskId)
        if (!task) return Promise.resolve() // Skip if task not found
        
        const shouldBeLinked = selectedTaskIds.includes(taskId)
        const wasLinkedToThisGoal = task.goalId === goalId
        
        // Only update if the task's link status to THIS goal has changed
        if (shouldBeLinked || wasLinkedToThisGoal) {
          return axios.put(
            apiEndpoint(`tasks/${taskId}`), 
            { 
              name: task.name, // Include the required name field
              goalId: shouldBeLinked ? goalId : null 
            },
            config
          )
        }
        
        // Don't update tasks that weren't linked to this goal and aren't being linked now
        return Promise.resolve()
      })
      
      await Promise.all(updatePromises)
      
      onTasksLinked()
      onOpenChange(false)
    } catch (error) {
      console.error("Error linking tasks:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleTask = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const filteredTasks = tasks.filter(task => 
    task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Link Tasks to Goal: {goalName}</DialogTitle>
          <DialogDescription>
            Select the tasks you want to link to this goal. Tasks linked to a goal will contribute to the goal's progress.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4"
          />
          
          {isLoading ? (
            <div className="flex justify-center py-8">Loading tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex justify-center py-8 text-muted-foreground">
              {searchQuery ? "No tasks match your search" : "No tasks found for this project"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map(task => {
                // Check if task is already linked to another goal
                const isLinkedToOtherGoal = Boolean(task.goalId && task.goalId !== goalId);
                
                return (
                  <div 
                    key={task._id} 
                    className={`flex items-start space-x-2 rounded-md border p-3 ${
                      isLinkedToOtherGoal 
                        ? 'opacity-50 bg-gray-100 dark:bg-gray-800' 
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <Checkbox 
                      id={task._id}
                      checked={selectedTaskIds.includes(task._id)}
                      onCheckedChange={() => {
                        if (!isLinkedToOtherGoal) {
                          toggleTask(task._id);
                        }
                      }}
                      disabled={isLinkedToOtherGoal}
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor={task._id} 
                        className={`flex flex-col ${isLinkedToOtherGoal ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center">
                          <span className="font-medium">{task.name}</span>
                          {isLinkedToOtherGoal && (
                            <span className="ml-2 text-xs text-red-500 dark:text-red-400">
                              (Linked to another goal)
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <span className="text-sm text-muted-foreground">
                            {task.description.length > 100 
                              ? `${task.description.substring(0, 100)}...` 
                              : task.description}
                          </span>
                        )}
                      </label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        task.status === "done" 
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                          : task.status === "in_progress" 
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                      }`}>
                        {task.status === "done" 
                          ? <Check className="mr-1 h-3 w-3" /> 
                          : null}
                        {task.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            <Check className="mr-2 h-4 w-4" />
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
