"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { useProjectsStore } from "@/lib/store"
import { CheckCircle2, Circle, Clock, AlertCircle, Sparkles, Repeat, MessageSquare } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { apiEndpoint } from "@/config"
import { TaskLogDialog } from "@/components/TaskLogDialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"

interface Task {
  _id: string
  name: string
  description: string
  status: string
  priority: string
  projectId: string
  dueDate?: string
  isSelectedForToday: boolean
  isRecurring?: boolean
  recurringDays?: string[]
  projectName?: string
  logs?: any[]
}

interface Project {
  _id: string
  name: string
  description?: string
  tags: string[]
  isArchived: boolean
  isSacred?: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export default function TodayPage() {
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [recommendedTasks, setRecommendedTasks] = useState<Task[]>([])
  const [eligibleTasks, setEligibleTasks] = useState<Task[]>([])
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRecommending, setIsRecommending] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedDays, setSelectedDays] = useState<string[]>([])

  // Get projects from the store
  const { projects: storeProjects, activeProjects, fetchProjects } = useProjectsStore()
  
  useEffect(() => {
    // On initial load, fetch projects first, then fetch data
    const initializeData = async () => {
      setIsLoading(true)
      try {
        // Always fetch fresh projects data first
        await fetchProjects(true)
        // Then fetch tasks data
        await fetchData()
      } catch (error) {
        console.error("Error initializing data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load data. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    initializeData()
  }, []) // Empty dependency array means this runs once on mount
  
  // Update local projects when store projects change
  useEffect(() => {
    if (storeProjects.length > 0) {
      setProjects(storeProjects)
      
      // If we already have tasks, update their project names
      if (tasks.length > 0) {
        const updatedTasks = tasks.map(task => ({
          ...task,
          projectName: storeProjects.find(p => p._id === task.projectId)?.name || "No Project"
        }))
        setTasks(updatedTasks)
      }
      
      // If we already have today's tasks, update their project names
      if (todayTasks.length > 0) {
        const updatedTodayTasks = todayTasks.map(task => ({
          ...task,
          projectName: storeProjects.find(p => p._id === task.projectId)?.name || "No Project"
        }))
        setTodayTasks(updatedTodayTasks)
      }
    }
  }, [storeProjects])
  
  // Helper function to update tasks with project names
  const updateTasksWithProjectNames = (taskList: Task[], projectList: Project[]) => {
    const updatedTasks = taskList.map(task => ({
      ...task,
      projectName: projectList.find(p => p._id === task.projectId)?.name || "No Project"
    }))
    
    if (taskList === tasks) {
      setTasks(updatedTasks)
    } else if (taskList === todayTasks) {
      setTodayTasks(updatedTasks)
    }
  }
  
  const fetchData = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      // First, fetch all projects directly from the API
      // This ensures we have the most up-to-date project data
      const projectsResponse = await axios.get(apiEndpoint("projects"), config)
      const allProjects = projectsResponse.data
      
      console.log('Projects fetched directly from API:', allProjects.length)
      console.log('Project names:', allProjects.map((p: any) => p.name).join(', '))
      
      // Update the store with these projects
      setProjects(allProjects)
      
      // Fetch all tasks
      const allTasksResponse = await axios.get(apiEndpoint("tasks"), config)
      
      // Create a map of project IDs to project names for quick lookup
      const projectMap = new Map<string, string>()
      allProjects.forEach((project: any) => {
        projectMap.set(project._id, project.name)
      })
      
      // Add project names to tasks using the project map
      const tasksWithProjects = allTasksResponse.data.map((task: Task) => ({
        ...task,
        projectName: projectMap.get(task.projectId) || "No Project"
      }))
      
      setTasks(tasksWithProjects)
      
      // Get tasks from active sacred projects using the isSacred field
      const sacredSixProjects = allProjects.filter((project: Project) => 
        !project.isArchived && // Filter out archived projects
        project.isSacred // Use the isSacred field instead of tags
      )
      
      console.log('Sacred Six Projects:', sacredSixProjects.map((p: Project) => ({ 
        name: p.name, 
        tags: p.tags,
        isArchived: p.isArchived
      })));
      
      // If no projects with sacred six tag, use all active projects as a fallback
      const activeProjectsList = allProjects.filter((p: Project) => !p.isArchived)
      const projectsToUse = sacredSixProjects.length > 0 ? sacredSixProjects : activeProjectsList
      
      const projectIds = projectsToUse.map((project: Project) => project._id)
      
      // Filter tasks that are from the selected projects and not done
      const eligibleTasks = tasksWithProjects.filter((task: Task) => 
        projectIds.includes(task.projectId) && 
        task.status !== 'done'
      )
      
      console.log('Projects used for tasks:', projectsToUse.map((p: Project) => p.name))
      console.log('Eligible Tasks:', eligibleTasks.map((t: Task) => t.name))
      console.log('All Tasks with project names:', tasksWithProjects.map((t: Task) => ({ 
        name: t.name, 
        projectId: t.projectId,
        projectName: t.projectName
      })))
      
      setEligibleTasks(eligibleTasks)
      
      // Fetch today's tasks
      const todayTasksResponse = await axios.get(apiEndpoint("tasks/today"), config)
      
      // Add project names to today's tasks using the project map
      const todayTasksWithProjects = todayTasksResponse.data.map((task: Task) => ({
        ...task,
        projectName: projectMap.get(task.projectId) || "No Project"
      }))
      
      setTodayTasks(todayTasksWithProjects)
      
      // Set selected task IDs from today's tasks
      setSelectedTaskIds(todayTasksWithProjects.map((task: Task) => task._id))
      
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load tasks. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      const task = todayTasks.find(t => t._id === taskId)
      if (!task) return

      await axios.put(apiEndpoint(`tasks/${taskId}`), {
        ...task,
        status: newStatus
      }, config)

      // Update local state
      setTodayTasks(prev => 
        prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t)
      )

      // Also update in tasks and eligible tasks
      setTasks(prev => 
        prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t)
      )
      
      setEligibleTasks(prev => 
        prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t)
      )

      toast({
        title: "Task updated",
        description: `Task status changed to ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update task. Please try again.",
      })
    }
  }

  const toggleRecurringTask = async (taskId: string, isRecurring: boolean) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      const task = todayTasks.find(t => t._id === taskId) || tasks.find(t => t._id === taskId)
      if (!task) return

      // If no specific days are selected and isRecurring is true, default to all weekdays
      const recurringDays = selectedDays.length > 0 ? selectedDays : 
                           (isRecurring ? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] : [])

      await axios.put(apiEndpoint(`tasks/${taskId}`), {
        ...task,
        name: task.name,
        isRecurring,
        recurringDays
      }, config)

      // Update local state
      const updateTaskInList = (list: Task[]) => 
        list.map(t => t._id === taskId ? { ...t, isRecurring, recurringDays } : t)

      setTodayTasks(updateTaskInList(todayTasks))
      setTasks(updateTaskInList(tasks))
      setEligibleTasks(updateTaskInList(eligibleTasks))

      toast({
        title: isRecurring ? "Task set to recurring" : "Task set to non-recurring",
        description: isRecurring 
          ? `This task will automatically reset when completed on ${recurringDays.join(', ')}`
          : "This task will no longer automatically reset when completed",
      })

      // Close the dialog if it was open
      setEditingTask(null)
      setSelectedDays([])
    } catch (error) {
      console.error("Error updating recurring task:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update task. Please try again.",
      })
    }
  }

  const handleDaySelection = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day) 
        : [...prev, day]
    )
  }

  const openRecurringDialog = (task: Task) => {
    setEditingTask(task)
    setSelectedDays(task.recurringDays || [])
  }

  const getAIRecommendations = async () => {
    setIsRecommending(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      const response = await axios.post(
        apiEndpoint("ai/recommend-tasks"), 
        {}, 
        config
      )

      if (response.data.recommendedTasks) {
        // Use projectName from backend if available, otherwise look it up from storeProjects
        const recommendedTasksWithProjects = response.data.recommendedTasks.map((task: Task) => {
          // If the task already has a projectName from the backend, use it
          if (task.projectName) {
            return task;
          }
          // Otherwise, look it up from storeProjects
          return {
            ...task,
            projectName: storeProjects.find((p: any) => p._id === task.projectId)?.name || "No Project"
          };
        });
        
        setRecommendedTasks(recommendedTasksWithProjects)
        
        // Enter selection mode
        setIsSelectionMode(true)
        
        // Pre-select the recommended tasks
        setSelectedTaskIds(recommendedTasksWithProjects.map((task: Task) => task._id))

        toast({
          title: "AI Recommendations Ready",
          description: "Select the tasks you want to include in the Daily Sacred 6.",
        })
      }
    } catch (error) {
      console.error("Error getting AI recommendations:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get AI recommendations. Please try again.",
      })
    } finally {
      setIsRecommending(false)
    }
  }
  
  const handleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => {
      // If already selected, remove it
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId)
      }
      
      // If we already have 6 tasks, don't add more
      if (prev.length >= 6) {
        toast({
          variant: "destructive",
          title: "Maximum tasks reached",
          description: "You can only select up to 6 tasks for the Daily Sacred 6.",
        })
        return prev
      }
      
      // Otherwise, add it
      return [...prev, taskId]
    })
  }
  
  const saveSelectedTasks = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }
      
      // Update the selected tasks on the server
      await axios.put(
        apiEndpoint("tasks/today/select"),
        { taskIds: selectedTaskIds },
        config
      )

      // Fetch the updated today's tasks
      const todayTasksResponse = await axios.get(apiEndpoint("tasks/today"), config)
      
      // Add project names to today's tasks - use storeProjects directly
      const todayTasksWithProjects = todayTasksResponse.data.map((task: Task) => ({
        ...task,
        projectName: storeProjects.find((p: any) => p._id === task.projectId)?.name || "No Project"
      }))
      
      setTodayTasks(todayTasksWithProjects)
      
      // Exit selection mode
      setIsSelectionMode(false)

      toast({
        title: "Tasks Saved",
        description: "Your Daily Sacred Six tasks have been updated.",
      })
    } catch (error) {
      console.error("Error saving selected tasks:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save selected tasks. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  const cancelSelection = () => {
    // Reset selection to current today's tasks
    setSelectedTaskIds(todayTasks.map(task => task._id))
    setIsSelectionMode(false)
  }

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-500" />
      case "todo":
        return <Circle className="h-5 w-5 text-gray-400" />
      default:
        return <AlertCircle className="h-5 w-5 text-red-500" />
    }
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center">Loading tasks...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Daily Sacred 6</h1>
          <p className="text-muted-foreground">Focus on these 6 tasks from your Sacred Six projects to maximize your productivity</p>
        </div>
        {!isSelectionMode ? (
          <div className="flex space-x-2">
            <Button onClick={() => setIsSelectionMode(true)}>
              Select Tasks
            </Button>
            <Button onClick={getAIRecommendations} disabled={isRecommending} variant="outline">
              {isRecommending ? "Getting Recommendations..." : "Get AI Recommendations"}
            </Button>
          </div>
        ) : (
          <div className="flex space-x-2">
            <Button onClick={saveSelectedTasks} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Selection"}
            </Button>
            <Button onClick={cancelSelection} variant="outline">
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Recurring Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recurring Task Settings</DialogTitle>
          </DialogHeader>
          
          {editingTask && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{editingTask.name}</h4>
                  <p className="text-sm text-muted-foreground">Make this task repeat automatically</p>
                </div>
                <Switch 
                  checked={editingTask.isRecurring || false}
                  onCheckedChange={(checked: boolean) => {
                    setEditingTask({...editingTask, isRecurring: checked})
                  }}
                />
              </div>
              
              {(editingTask.isRecurring || false) && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Repeat on these days:</p>
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
                    When completed, this task will reset to "todo" status on the selected days.
                    If no days are selected, it will reset every weekday (Mon-Fri).
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTask(null)}>Cancel</Button>
            <Button onClick={() => editingTask && toggleRecurringTask(editingTask._id, editingTask.isRecurring || false)}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isSelectionMode ? (
        <div className="rounded-lg border bg-card shadow-sm">
          <Tabs defaultValue="recommended" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recommended">
                AI Recommended
                <Badge variant="outline" className="ml-2">{recommendedTasks.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="overdue">
                Overdue Tasks
                <Badge variant="outline" className="ml-2">
                  {eligibleTasks.filter(task => {
                    if (!task.dueDate) return false;
                    const dueDate = new Date(task.dueDate);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0); // Set to beginning of day
                    return dueDate < today; // Only if due date is before today (not including today)
                  }).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="eligible">
                All Eligible Tasks
                <Badge variant="outline" className="ml-2">{eligibleTasks.length}</Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="recommended" className="p-4">
              <div className="mb-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-yellow-500" />
                  AI Recommended Tasks
                </h3>
                <p className="text-sm text-muted-foreground">
                  Select up to 6 tasks for the Daily Sacred 6. {selectedTaskIds.length}/6 selected.
                </p>
              </div>
              <div className="space-y-2">
                {recommendedTasks.length > 0 ? (
                  recommendedTasks.map((task) => (
                    <div key={task._id} className={`flex items-start space-x-2 p-2 rounded-md hover:bg-accent ${task.dueDate && new Date(task.dueDate) < new Date() && new Date(task.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) ? "bg-red-50 dark:bg-red-900/20" : ""}`}>
                      <Checkbox 
                        id={`recommended-${task._id}`}
                        checked={selectedTaskIds.includes(task._id)}
                        onCheckedChange={() => handleTaskSelection(task._id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label 
                          htmlFor={`recommended-${task._id}`}
                          className="font-medium cursor-pointer flex items-center"
                        >
                          {task.name}
                          {task.status === "done" && <CheckCircle2 className="h-4 w-4 ml-2 text-green-500" />}
                        </label>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Project: <a href={`/dashboard/projects/${task.projectId}`} className="text-primary hover:underline">{task.projectName}</a>
                      </span>
                      <Badge className={`${
                        task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                      </Badge>
                          {task.dueDate && (
                            <span className={`text-xs ${new Date(task.dueDate) < new Date() && new Date(task.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"}`}>
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                              {new Date(task.dueDate) < new Date() && new Date(task.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) && " (Overdue)"}
                            </span>
                          )}
                          {task.isRecurring && (
                            <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 px-2 py-1 rounded-full">
                              Recurring: {task.recurringDays?.map(day => day.slice(0, 3)).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No AI recommendations available. Click "Get AI Recommendations" to generate some.
                  </p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="overdue" className="p-4">
              <div className="mb-4">
                <h3 className="text-lg font-medium flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                  Overdue Tasks
                </h3>
                <p className="text-sm text-muted-foreground">
                  Tasks with due dates in the past. These should be prioritized.
                </p>
              </div>
              <div className="space-y-2">
                {eligibleTasks.filter(task => {
                  if (!task.dueDate) return false;
                  const dueDate = new Date(task.dueDate);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0); // Set to beginning of day
                  return dueDate < today; // Only if due date is before today (not including today)
                }).length > 0 ? (
                  eligibleTasks
                    .filter(task => {
                      if (!task.dueDate) return false;
                      const dueDate = new Date(task.dueDate);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0); // Set to beginning of day
                      return dueDate < today; // Only if due date is before today (not including today)
                    })
                    .map((task) => (
                      <div key={task._id} className="flex items-start space-x-2 p-2 rounded-md hover:bg-accent bg-red-50 dark:bg-red-900/20">
                        <Checkbox 
                          id={`overdue-${task._id}`}
                          checked={selectedTaskIds.includes(task._id)}
                          onCheckedChange={() => handleTaskSelection(task._id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <label 
                            htmlFor={`overdue-${task._id}`}
                            className="font-medium cursor-pointer flex items-center"
                          >
                          {task.name}
                          {task.status === "done" && <CheckCircle2 className="h-4 w-4 ml-2 text-green-500" />}
                          </label>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              Project: <a href={`/dashboard/projects/${task.projectId}`} className="text-primary hover:underline">{task.projectName}</a>
                            </span>
                      <Badge className={`${
                        task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                      </Badge>
                            {task.dueDate && (
                              <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                                Due: {new Date(task.dueDate).toLocaleDateString()} (Overdue)
                              </span>
                            )}
                            {task.isRecurring && (
                              <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 px-2 py-1 rounded-full">
                                Recurring: {task.recurringDays?.map(day => day.slice(0, 3)).join(", ")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No overdue tasks found. Great job staying on top of your deadlines!
                  </p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="eligible" className="p-4">
              <div className="mb-4">
                <h3 className="text-lg font-medium">All Eligible Tasks</h3>
                <p className="text-sm text-muted-foreground">
                  Tasks from sacred projects. {selectedTaskIds.length}/6 selected.
                </p>
                {selectedTaskIds.length > 0 && selectedTaskIds.length < 6 && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Great start! You're on your way with {selectedTaskIds.length} {selectedTaskIds.length === 1 ? 'task' : 'tasks'}. 
                    Select {6 - selectedTaskIds.length} more to complete your Sacred Six.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                {eligibleTasks.length > 0 ? (
                  eligibleTasks.map((task) => (
                    <div key={task._id} className={`flex items-start space-x-2 p-2 rounded-md hover:bg-accent ${task.dueDate && new Date(task.dueDate) < new Date() && new Date(task.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) ? "bg-red-50 dark:bg-red-900/20" : ""}`}>
                      <Checkbox 
                        id={`eligible-${task._id}`}
                        checked={selectedTaskIds.includes(task._id)}
                        onCheckedChange={() => handleTaskSelection(task._id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label 
                          htmlFor={`eligible-${task._id}`}
                          className="font-medium cursor-pointer flex items-center"
                        >
                          {task.name}
                          {task.status === "done" && <CheckCircle2 className="h-4 w-4 ml-2 text-green-500" />}
                        </label>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            Project: <a href={`/dashboard/projects/${task.projectId}`} className="text-primary hover:underline">{task.projectName}</a>
                          </span>
                      <Badge className={`${
                        task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                      </Badge>
                          {task.dueDate && (
                            <span className={`text-xs ${new Date(task.dueDate) < new Date() && new Date(task.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"}`}>
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                              {new Date(task.dueDate) < new Date() && new Date(task.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) && " (Overdue)"}
                            </span>
                          )}
                          {task.isRecurring && (
                            <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 px-2 py-1 rounded-full">
                              Recurring: {task.recurringDays?.map(day => day.slice(0, 3)).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No eligible tasks found. Add the "sacred six" tag to projects to make their tasks eligible.
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : todayTasks.length > 0 ? (
        <div className="space-y-4">
          {todayTasks.length < 6 && (
            <div className="rounded-lg border bg-yellow-50 dark:bg-yellow-900/20 p-4 text-yellow-800 dark:text-yellow-200">
              <h3 className="text-lg font-medium flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-yellow-500" />
                Almost there!
              </h3>
              <p>
                You have {todayTasks.length} {todayTasks.length === 1 ? 'task' : 'tasks'} selected for today. 
                Select {6 - todayTasks.length} more to complete your Sacred Six and maximize your productivity.
              </p>

            </div>
          )}
          {todayTasks.map((task) => (
            <div key={task._id} className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <button
                    onClick={() => {
                      const newStatus = task.status === "done" 
                        ? "todo" 
                        : task.status === "in_progress" 
                          ? "done" 
                          : "in_progress"
                      handleStatusChange(task._id, newStatus)
                    }}
                    className="mt-1"
                  >
                    {getStatusIcon(task.status)}
                  </button>
                  <div>
                    <h3 className="font-medium">{task.name}</h3>
                    {task.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Project: <a href={`/dashboard/projects/${task.projectId}`} className="text-primary hover:underline">{task.projectName}</a>
                      </span>
                      <Badge className={`${
                        task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                      </Badge>
                      {task.dueDate && (
                        <span className={`text-xs ${new Date(task.dueDate) < new Date() && new Date(task.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"}`}>
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                          {new Date(task.dueDate) < new Date() && new Date(task.dueDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) && " (Overdue)"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(task._id, "in_progress")}
                      disabled={task.status === "in_progress"}
                    >
                      Start
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(task._id, "done")}
                      disabled={task.status === "done"}
                    >
                      Complete
                    </Button>
                  </div>
                  <TaskLogDialog 
                    task={task} 
                    onLogAdded={() => {
                      // Update the task logs without closing the dialog
                      // by updating only the specific task's logs
                      const token = localStorage.getItem("token")
                      if (!token) return

                      const config = {
                        headers: { Authorization: `Bearer ${token}` }
                      }

                      // Fetch only this task's data to update it
                      axios.get(apiEndpoint(`tasks/${task._id}`), config)
                        .then(response => {
                          // Update this task in the todayTasks array, preserving the projectName
                          setTodayTasks(prev => 
                            prev.map(t => t._id === task._id ? {
                              ...response.data,
                              projectName: t.projectName // Preserve the project name
                            } : t)
                          )
                        })
                        .catch(error => {
                          console.error("Error updating task logs:", error)
                        })

                      // Also fetch the logs to update the count
                      axios.get(apiEndpoint(`tasks/${task._id}/logs`), config)
                        .then(response => {
                          // The logs count will be updated in the TaskLogDialog component
                        })
                        .catch(error => {
                          console.error("Error fetching task logs:", error)
                        })
                    }}
                    trigger={
                      <Button variant="secondary" size="sm" className="w-full gap-1 relative">
                        <MessageSquare className="h-4 w-4" />
                        <span>Task Logs</span>
                        {task.logs && task.logs.length > 0 && (
                          <span className="ml-1 bg-gray-600 text-white text-xs rounded-full px-1.5 py-0.5 inline-flex items-center justify-center">
                            {task.logs.length}
                          </span>
                        )}
                      </Button>
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
          {/* SVG Illustration */}
          <div className="flex justify-center mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="200"
              height="200"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary/20"
            >
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M8 12h8" />
              <path d="M12 8v8" />
            </svg>
          </div>
          <h3 className="text-lg font-medium">No tasks selected for today</h3>
          <p className="mt-2 text-muted-foreground">
            Use the "Select Tasks" button to choose tasks for the Daily Sacred 6,
            or "Get AI Recommendations" to get suggestions.
          </p>
          <div className="mt-4 flex justify-center space-x-4">
            <Button onClick={() => setIsSelectionMode(true)}>
              Select Tasks
            </Button>
            <Button onClick={getAIRecommendations} variant="outline" disabled={isRecommending}>
              {isRecommending ? "Getting Recommendations..." : "Get AI Recommendations"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
