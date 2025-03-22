"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { useParams, useRouter } from "next/navigation"
import { Plus, Users, Target } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from "@/components/ui/dialog"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

// Import our custom components
import { AiTaskSuggestions } from "@/components/AiTaskSuggestions"
import ProjectSharingModal from "@/components/ProjectSharingModal"
import { TaskForm } from "@/components/TaskForm"
import { GoalForm } from "@/components/GoalForm"
import { LinkTasksToGoalDialog } from "@/components/LinkTasksToGoalDialog"
import { ProjectTasksTab } from "@/components/ProjectTasksTab"
import { ProjectGoalsTab } from "@/components/ProjectGoalsTab"
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
      <Tabs value={activeTab} defaultValue="tasks" onValueChange={(value) => setActiveTab(value as "tasks" | "goals")}>
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
          <ProjectTasksTab
            tasks={tasks}
            goals={goals}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            onCreateTask={() => setCreateTaskDialogOpen(true)}
            onEditTask={setEditingTask}
            onDeleteTask={onDeleteTask}
            onStatusChange={handleTaskStatusChange}
            setEditDialogOpen={setEditTaskDialogOpen}
          />
        </TabsContent>
        
        {/* Goals Tab Content */}
        <TabsContent value="goals" className="space-y-4">
          <ProjectGoalsTab
            goals={goals}
            tasks={tasks}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onCreateGoal={() => setCreateGoalDialogOpen(true)}
            onEditGoal={setEditingGoal}
            onDeleteGoal={onDeleteGoal}
            onLinkTasks={handleLinkTasks}
            onStatusChange={handleGoalStatusChange}
            setEditDialogOpen={setEditGoalDialogOpen}
          />
        </TabsContent>
      </Tabs>
      
      {/* Create Task Dialog */}
      <Dialog open={createTaskDialogOpen} onOpenChange={setCreateTaskDialogOpen}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to your project.
            </DialogDescription>
          </DialogHeader>
          <TaskForm 
            form={newTaskForm} 
            onSubmit={onCreateTask} 
            isSubmitting={isSubmitting} 
            onCancel={() => setCreateTaskDialogOpen(false)} 
            mode="create" 
            goals={goals}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Task Dialog */}
      <Dialog open={editTaskDialogOpen} onOpenChange={setEditTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the details of your task.
            </DialogDescription>
          </DialogHeader>
          <TaskForm 
            form={editTaskForm} 
            onSubmit={onUpdateTask} 
            isSubmitting={isSubmitting} 
            onCancel={() => setEditTaskDialogOpen(false)} 
            mode="edit" 
            goals={goals}
          />
        </DialogContent>
      </Dialog>
      
      {/* Create Goal Dialog */}
      <Dialog open={createGoalDialogOpen} onOpenChange={setCreateGoalDialogOpen}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Create New Goal</DialogTitle>
            <DialogDescription>
              Add a new goal to your project.
            </DialogDescription>
          </DialogHeader>
          <GoalForm 
            form={newGoalForm} 
            onSubmit={onCreateGoal} 
            isSubmitting={isSubmitting} 
            onCancel={() => setCreateGoalDialogOpen(false)} 
            mode="create" 
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Goal Dialog */}
      <Dialog open={editGoalDialogOpen} onOpenChange={setEditGoalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
            <DialogDescription>
              Update the details of your goal.
            </DialogDescription>
          </DialogHeader>
          <GoalForm 
            form={editGoalForm} 
            onSubmit={onUpdateGoal} 
            isSubmitting={isSubmitting} 
            onCancel={() => setEditGoalDialogOpen(false)} 
            mode="edit" 
          />
        </DialogContent>
      </Dialog>
      
      {/* Link Tasks to Goal Dialog */}
      <LinkTasksToGoalDialog
        projectId={project?._id || ""}
        goalId={selectedGoalId}
        goalName={selectedGoalName}
        open={linkTasksDialogOpen}
        onOpenChange={setLinkTasksDialogOpen}
        onTasksLinked={() => {
          fetchProjectData();
          // Ensure we stay on the goals tab
          setActiveTab("goals");
        }}
      />
    </div>
  )
}
