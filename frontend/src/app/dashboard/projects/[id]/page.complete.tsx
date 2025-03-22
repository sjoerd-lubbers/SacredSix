"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { useParams, useRouter } from "next/navigation"
import { Plus, Users, Search, Target } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

// Import our custom components
import { TaskSortingControls } from "@/components/TaskSortingControls"
import { AiTaskSuggestions } from "@/components/AiTaskSuggestions"
import ProjectSharingModal from "@/components/ProjectSharingModal"
import { TaskItem } from "@/components/TaskItem"
import { TaskForm } from "@/components/TaskForm"
import { GoalItem } from "@/components/GoalItem"
import { GoalForm } from "@/components/GoalForm"
import { LinkTasksToGoalDialog } from "@/components/LinkTasksToGoalDialog"
import { apiEndpoint } from "@/config";

interface Project {
  _id: string
  ownerId: {
    _id: string
    name: string
    email: string
  }
  collaborators: Array<{
    userId: {
      _id: string
      name: string
      email: string
    }
    role: string
    addedAt: string
  }>
  name: string
  description?: string
  tags: string[]
  isArchived: boolean
  defaultTasksRecurring?: boolean
  defaultRecurringDays?: string[]
}

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

interface Goal {
  _id: string
  name: string
  description: string
  status: string
  projectId: string
  targetDate?: string
  progress: number
  createdAt: string
  updatedAt: string
}

const taskSchema = z.object({
  name: z.string().min(1, "Task name is required"),
  description: z.string().optional(),
  priority: z.string(),
  status: z.string(),
  dueDate: z.string().optional(),
  estimatedTime: z.string().optional(),
  isRecurring: z.boolean().optional().default(false),
  recurringDays: z.array(z.string()).optional().default([]),
  goalId: z.string().optional(),
})

const goalSchema = z.object({
  name: z.string().min(1, "Goal name is required"),
  description: z.string().optional(),
  targetDate: z.string().optional(),
})

type TaskFormValues = z.infer<typeof taskSchema>
type GoalFormValues = z.infer<typeof goalSchema>

export default function ProjectTasksPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sortBy, setSortBy] = useState<string>("priority")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false)
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false)
  const [createGoalDialogOpen, setCreateGoalDialogOpen] = useState(false)
  const [editGoalDialogOpen, setEditGoalDialogOpen] = useState(false)
  const [linkTasksDialogOpen, setLinkTasksDialogOpen] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState<string>("")
  const [selectedGoalName, setSelectedGoalName] = useState<string>("")
  const [activeTab, setActiveTab] = useState<"tasks" | "goals">("tasks")
  const [taskTab, setTaskTab] = useState<"active" | "completed">("active")
  const [searchQuery, setSearchQuery] = useState<string>("")

  const newTaskForm = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: "",
      description: "",
      priority: "medium",
      status: "todo",
      dueDate: "",
      estimatedTime: "",
      isRecurring: false,
      recurringDays: [],
    },
  })

  const editTaskForm = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: "",
      description: "",
      priority: "medium",
      status: "todo",
      dueDate: "",
      estimatedTime: "",
      isRecurring: false,
      recurringDays: [],
    },
  })

  const newGoalForm = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      description: "",
      targetDate: "",
    },
  })

  const editGoalForm = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      description: "",
      targetDate: "",
    },
  })

  useEffect(() => {
    if (!params.id) return
    
    const initializeData = async () => {
      setIsLoading(true)
      
      // Get current user ID from JWT token
      const token = localStorage.getItem("token")
      if (token) {
        try {
          // JWT tokens are in the format: header.payload.signature
          // We need to decode the payload part (index 1)
          const payload = token.split('.')[1]
          const decodedPayload = JSON.parse(atob(payload))
          setCurrentUserId(decodedPayload.id)
        } catch (error) {
          console.error("Error decoding JWT token:", error)
        }
      }
      
      await fetchProjectData()
    }
    
    initializeData()
  }, [params.id])

  useEffect(() => {
    if (editingTask) {
      editTaskForm.reset({
        name: editingTask.name,
        description: editingTask.description || "",
        priority: editingTask.priority,
        status: editingTask.status,
        dueDate: editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : "",
        estimatedTime: editingTask.estimatedTime ? String(editingTask.estimatedTime) : "",
        isRecurring: editingTask.isRecurring || false,
        recurringDays: editingTask.recurringDays || [],
        goalId: editingTask.goalId || "",
      })
    }
  }, [editingTask, editTaskForm])

  useEffect(() => {
    if (editingGoal) {
      editGoalForm.reset({
        name: editingGoal.name,
        description: editingGoal.description || "",
        targetDate: editingGoal.targetDate ? new Date(editingGoal.targetDate).toISOString().split('T')[0] : "",
      })
    }
  }, [editingGoal, editGoalForm])

  const fetchProjectData = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      // Fetch project details
      const projectResponse = await axios.get(apiEndpoint(`projects/${params.id}`), config)
      setProject(projectResponse.data)

      // Fetch tasks for this project
      const tasksResponse = await axios.get(apiEndpoint(`tasks/project/${params.id}`), config)
      setTasks(tasksResponse.data)

      // Fetch goals for this project
      const goalsResponse = await axios.get(apiEndpoint(`goals/project/${params.id}`), config)
      setGoals(goalsResponse.data)
    } catch (error) {
      console.error("Error fetching project data:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load project data. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onCreateTask = async (data: TaskFormValues) => {
    if (!project) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      const taskData = {
        projectId: project._id,
        name: data.name,
        description: data.description,
        priority: data.priority,
        status: data.status,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        estimatedTime: data.estimatedTime ? parseInt(data.estimatedTime) : undefined,
        isRecurring: data.isRecurring,
        recurringDays: data.recurringDays,
        goalId: data.goalId || null,
      }

      const response = await axios.post(apiEndpoint("tasks"), taskData, config)

      setTasks(prev => [...prev, response.data])
      
      newTaskForm.reset({
        name: "",
        description: "",
        priority: "medium",
        status: "todo",
        dueDate: "",
        estimatedTime: "",
        isRecurring: false,
        recurringDays: [],
      })

      setCreateTaskDialogOpen(false)

      toast({
        title: "Task created",
        description: "Your task has been created successfully.",
      })
    } catch (error) {
      console.error("Error creating task:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create task. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const onUpdateTask = async (data: TaskFormValues) => {
    if (!editingTask) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      const taskData = {
        name: data.name,
        description: data.description,
        priority: data.priority,
        status: data.status,
        dueDate: data.dueDate && data.dueDate.trim() !== "" ? new Date(data.dueDate).toISOString() : null,
        estimatedTime: data.estimatedTime ? parseInt(data.estimatedTime) : undefined,
        isRecurring: data.isRecurring,
        recurringDays: data.recurringDays,
        goalId: data.goalId || null,
      }

      const response = await axios.put(apiEndpoint(`tasks/${editingTask._id}`), taskData, config)

      setTasks(prev => 
        prev.map(task => 
          task._id === editingTask._id ? response.data : task
        )
      )
      
      setEditingTask(null)
      setEditTaskDialogOpen(false)

      toast({
        title: "Task updated",
        description: "Your task has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update task. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const onCreateGoal = async (data: GoalFormValues) => {
    if (!project) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      const goalData = {
        projectId: project._id,
        name: data.name,
        description: data.description,
        status: "not_started", // Default status
        targetDate: data.targetDate ? new Date(data.targetDate).toISOString() : undefined,
        progress: 0, // Default progress
      }

      const response = await axios.post(apiEndpoint("goals"), goalData, config)

      setGoals(prev => [...prev, response.data])
      
      newGoalForm.reset({
        name: "",
        description: "",
        targetDate: "",
      })

      setCreateGoalDialogOpen(false)

      toast({
        title: "Goal created",
        description: "Your goal has been created successfully. Link tasks to track progress.",
      })
    } catch (error) {
      console.error("Error creating goal:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create goal. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const onUpdateGoal = async (data: GoalFormValues) => {
    if (!editingGoal) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      const goalData = {
        name: data.name,
        description: data.description,
        targetDate: data.targetDate && data.targetDate.trim() !== "" ? new Date(data.targetDate).toISOString() : null,
        // Status and progress are calculated from linked tasks, so we keep the existing values
        status: editingGoal.status,
        progress: editingGoal.progress,
      }

      const response = await axios.put(apiEndpoint(`goals/${editingGoal._id}`), goalData, config)

      setGoals(prev => 
        prev.map(goal => 
          goal._id === editingGoal._id ? response.data : goal
        )
      )
      
      setEditingGoal(null)
      setEditGoalDialogOpen(false)

      toast({
        title: "Goal updated",
        description: "Your goal has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating goal:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update goal. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const onDeleteTask = async (taskId: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      await axios.delete(apiEndpoint(`tasks/${taskId}`), config)

      setTasks(prev => prev.filter(task => task._id !== taskId))

      toast({
        title: "Task deleted",
        description: "Your task has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting task:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete task. Please try again.",
      })
    }
  }

  const onDeleteGoal = async (goalId: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      await axios.delete(apiEndpoint(`goals/${goalId}`), config)

      setGoals(prev => prev.filter(goal => goal._id !== goalId))

      // Update tasks that were linked to this goal
      setTasks(prev => 
        prev.map(task => 
          task.goalId === goalId ? { ...task, goalId: null } : task
        )
      )

      toast({
        title: "Goal deleted",
        description: "Your goal has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting goal:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete goal. Please try again.",
      })
    }
  }

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      const task = tasks.find(t => t._id === taskId)
      if (!task) return

      const response = await axios.put(apiEndpoint(`tasks/${taskId}`), {
        ...task,
        status: newStatus
      }, config)

      setTasks(prev => 
        prev.map(t => t._id === taskId ? response.data : t)
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

  const handleGoalStatusChange = async (goalId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      const goal = goals.find(g => g._id === goalId)
      if (!goal) return

      const response = await axios.put(apiEndpoint(`goals/${goalId}`), {
        ...goal,
        status: newStatus
      }, config)

      setGoals(prev => 
        prev.map(g => g._id === goalId ? response.data : g)
      )

      toast({
        title: "Goal updated",
        description: `Goal status changed to ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating goal:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update goal. Please try again.",
      })
    }
  }

  const handleLinkTasks = (goalId: string, goalName: string) => {
    setSelectedGoalId(goalId)
    setSelectedGoalName(goalName)
    setLinkTasksDialogOpen(true)
  }

  // Handle adding a task from AI suggestions
  const handleAddAiTask = (task: {
    name: string;
    description: string;
    priority: string;
    estimatedTime: string;
  }) => {
    newTaskForm.reset({
      name: task.name,
      description: task.description,
      priority: task.priority,
      status: "todo",
      dueDate: "",
      estimatedTime: task.estimatedTime,
    })
    
    setCreateTaskDialogOpen(true)
  }

  // Sort tasks based on current sort settings
  const sortedTasks = [...tasks].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === "priority") {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      comparison = (priorityOrder[a.priority as keyof typeof priorityOrder] || 0) - 
                  (priorityOrder[b.priority as keyof typeof priorityOrder] || 0);
    } else if (sortBy === "dueDate") {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      comparison = dateA - dateB;
    } else if (sortBy === "status") {
      const statusOrder = { todo: 1, in_progress: 2, done: 3 };
      comparison = (statusOrder[a.status as keyof typeof statusOrder] || 0) - 
                  (statusOrder[b.status as keyof typeof statusOrder] || 0);
    } else if (sortBy === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === "updatedAt") {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      comparison = dateA - dateB;
    }
    
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Filter tasks based on active tab and search query
  const getFilteredTasks = (tabValue: "active" | "completed") => {
    return sortedTasks.filter(task => {
      // Filter by tab (active vs completed)
      const tabFilter = tabValue === "active" 
        ? task.status !== "done" 
        : task.status === "done";
      
      // Filter by search query
      const searchFilter = searchQuery 
        ? task.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      
      return tabFilter && searchFilter;
    });
  };

  // Filter goals based on search query
  const filteredGoals = goals.filter(goal => {
    return searchQuery 
      ? goal.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (goal.description && goal.description.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
  });

  const activeTasks = getFilteredTasks("active");
  const completedTasks = getFilteredTasks("completed");

  if (isLoading) {
    return <div className="flex h-full items-center justify-center">Loading project data...</div>
  }

  if (!project) {
    return <div className="flex h-full items-center justify-center">Project not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            {project.name}
            {project.collaborators.length > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                <Users className="mr-1 h-3 w-3" />
                Shared
              </span>
            )}
          </h1>
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
          {project.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {project.tags.map((tag, index) => (
                <span
                  key={index}
                  className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          {/* Project Sharing Component */}
          <ProjectSharingModal
            projectId={project._id}
            projectName={project.name}
            ownerId={project.ownerId}
            collaborators={project.collaborators}
            currentUserId={currentUserId}
            onProjectUpdated={fetchProjectData}
          />
          
          {/* AI Task Suggestions Component */}
          <AiTaskSuggestions
            projectId={project._id}
            projectName={project.name}
            projectDescription={project.description}
            currentTasks={tasks.map(task => task.name)}
            onAddTask={handleAddAiTask}
          />
          
          {/* Create Task Button */}
          <Button onClick={() => setCreateTaskDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Task
          </Button>
          
          {/* Create Goal Button */}
          <Button onClick={() => setCreateGoalDialogOpen(true)} variant="outline">
            <Target className="mr-2 h-4 w-4" /> New Goal
          </Button>
        </div>
      </div>

      {/* Main Tabs (Tasks vs Goals) */}
      <Tabs defaultValue="tasks" onValueChange={(value) => setActiveTab(value as "tasks" | "goals")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks">
            Tasks ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="goals">
            Goals ({goals.length})
          </TabsTrigger>
        </TabsList>
        
        {/* Tasks Tab Content */}
        <TabsContent value="tasks" className="space-y-4">
          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <Input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          
          {/* Task Tabs (Active vs Completed) */}
          <Tabs defaultValue="active" onValueChange={(value) => setTaskTab(value as "active" | "completed")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">
                Active Tasks ({activeTasks.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed Tasks ({completedTasks.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="space-y-4">
              {/* Sorting Controls Component */}
              <TaskSortingControls
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
              />
              
              {/* Active Tasks */}
              {activeTasks.length > 0 ? (
                <div className="space-y-4">
                  {activeTasks.map((task) => (
                    <TaskItem
                      key={task._id}
                      task={task}
                      onStatusChange={handleTaskStatusChange}
                      onEdit={(task) => {
                        setEditingTask(task);
                        setEditTaskDialogOpen(true);
                      }}
                      onDelete={onDeleteTask}
                      setEditDialogOpen={setEditTaskDialogOpen}
                      goals={goals}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 rounded-full bg-primary/10 p-3">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium">No active tasks</h3>
                  <p className="mb-4 text-muted-foreground">
                    {searchQuery 
                      ? "No tasks match your search criteria." 
                      : "Create your first task to get started with this project."}
                  </p>
                  <Button onClick={() => setCreateTaskDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Task
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="space-y-4">
              {/* Sorting Controls Component */}
              <TaskSortingControls
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
              />
              
              {/* Completed Tasks */}
              {completedTasks.length > 0 ? (
                <div className="space-y-4">
                  {completedTasks.map((task) => (
                    <TaskItem
                      key={task._id}
                      task={task}
                      onStatusChange={handleTaskStatusChange}
                      onEdit={(task) => {
                        setEditingTask(task);
                        setEditTaskDialogOpen(true);
                      }}
                      onDelete={onDeleteTask}
                      setEditDialogOpen={setEditTaskDialogOpen}
                      goals={goals}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 rounded-full bg-primary/10 p-3">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium">No completed tasks</h3>
                  <p className="mb-4 text-muted-foreground">
                    {searchQuery 
                      ? "No completed tasks match your search criteria." 
                      : "Complete some tasks to see them here."}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>
        
        {/* Goals Tab Content */}
        <TabsContent value="goals" className="space-y-4">
          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <Input
              type="text"
              placeholder="Search goals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          
          {/* Goals List */}
