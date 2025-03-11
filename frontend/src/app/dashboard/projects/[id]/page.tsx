"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { useParams, useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, CheckCircle2, Circle, Clock, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { RecurringTasksSettings } from "@/components/RecurringTasksSettings"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

// Import our custom components
import { TaskSortingControls } from "@/components/TaskSortingControls"
import { AiTaskSuggestions } from "@/components/AiTaskSuggestions"
import ProjectSharingModal from "@/components/ProjectSharingModal"

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
  dueDate?: string
  estimatedTime?: number
  isSelectedForToday: boolean
  isRecurring?: boolean
  recurringDays?: string[]
  lastCompletedDate?: string
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
})

type TaskFormValues = z.infer<typeof taskSchema>

export default function ProjectTasksPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sortBy, setSortBy] = useState<string>("priority")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

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
      
      await fetchProjectAndTasks()
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
      })
    }
  }, [editingTask, editTaskForm])

  const fetchProjectAndTasks = async () => {
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
      const projectResponse = await axios.get(`http://localhost:5000/api/projects/${params.id}`, config)
      setProject(projectResponse.data)

      // Add a small delay to ensure project data is fully processed
      await new Promise(resolve => setTimeout(resolve, 50))

      // Fetch tasks for this project
      const tasksResponse = await axios.get(`http://localhost:5000/api/tasks/project/${params.id}`, config)
      setTasks(tasksResponse.data)
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
      }

      const response = await axios.post("http://localhost:5000/api/tasks", taskData, config)

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

      setCreateDialogOpen(false)

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
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        estimatedTime: data.estimatedTime ? parseInt(data.estimatedTime) : undefined,
        isRecurring: data.isRecurring,
        recurringDays: data.recurringDays,
      }

      const response = await axios.put(`http://localhost:5000/api/tasks/${editingTask._id}`, taskData, config)

      setTasks(prev => 
        prev.map(task => 
          task._id === editingTask._id ? response.data : task
        )
      )
      
      setEditingTask(null)
      setEditDialogOpen(false)

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

  const onDeleteTask = async (taskId: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`, config)

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

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      const task = tasks.find(t => t._id === taskId)
      if (!task) return

      const response = await axios.put(`http://localhost:5000/api/tasks/${taskId}`, {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-500" />
      case "todo":
        return <Circle className="h-5 w-5 text-gray-400" />
      default:
        return <Circle className="h-5 w-5 text-gray-400" />
    }
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
    
    setCreateDialogOpen(true)
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
    }
    
    return sortOrder === "asc" ? comparison : -comparison;
  });

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
            onProjectUpdated={fetchProjectAndTasks}
          />
          
          {/* AI Task Suggestions Component */}
          <AiTaskSuggestions
            projectId={project._id}
            projectName={project.name}
            projectDescription={project.description}
            currentTasks={tasks.map(task => task.name)}
            onAddTask={handleAddAiTask}
          />
          
          {/* Create Task Dialog */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-new-task-button="true">
                <Plus className="mr-2 h-4 w-4" /> New Task
              </Button>
            </DialogTrigger>
            <DialogContent onInteractOutside={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Add a new task to your project.
                </DialogDescription>
              </DialogHeader>
              <Form {...newTaskForm}>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  newTaskForm.handleSubmit(onCreateTask)(e);
                }} className="space-y-4">
                  <FormField
                    control={newTaskForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter task name" 
                            {...field} 
                            onKeyDown={(e) => {
                              // Prevent form submission on Enter key
                              if (e.key === 'Enter') {
                                e.preventDefault();
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={newTaskForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter task description" 
                            {...field} 
                            onKeyDown={(e) => {
                              // Prevent form submission on Enter key
                              if (e.key === 'Enter' && e.ctrlKey) {
                                e.preventDefault();
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={newTaskForm.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={newTaskForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="todo">To Do</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="done">Done</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={newTaskForm.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={newTaskForm.control}
                      name="estimatedTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Time (mins)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="60" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={newTaskForm.control}
                    name="isRecurring"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 mt-1"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Recurring Task</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            This task will automatically repeat on selected days
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                  {newTaskForm.watch("isRecurring") && (
                    <FormField
                      control={newTaskForm.control}
                      name="recurringDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recurring Days</FormLabel>
                          <div className="flex flex-wrap gap-2">
                            {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                              <Button
                                key={day}
                                type="button"
                                variant={field.value?.includes(day) ? "default" : "outline"}
                                onClick={() => {
                                  const updatedDays = field.value?.includes(day)
                                    ? field.value.filter((d: string) => d !== day)
                                    : [...(field.value || []), day];
                                  field.onChange(updatedDays);
                                }}
                                className="capitalize"
                              >
                                {day.slice(0, 3)}
                              </Button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Task"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Sorting Controls Component */}
      {tasks.length > 0 && (
        <TaskSortingControls
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />
      )}

      {tasks.length > 0 ? (
        <div className="space-y-4">
          {sortedTasks.map((task) => (
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
                      <span className={`text-xs ${getPriorityColor(task.priority)}`}>
                        Priority: {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>
                      {task.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {task.estimatedTime && (
                        <span className="text-xs text-muted-foreground">
                          Est. Time: {task.estimatedTime} mins
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
                <div className="flex space-x-2">
                  {/* Edit Task Dialog */}
                  <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingTask(task);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent onInteractOutside={(e) => e.preventDefault()}>
                      <DialogHeader>
                        <DialogTitle>Edit Task</DialogTitle>
                        <DialogDescription>
                          Update the details of your task.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...editTaskForm}>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          editTaskForm.handleSubmit(onUpdateTask)(e);
                        }} className="space-y-4">
                          <FormField
                            control={editTaskForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Task Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Enter task name" 
                                    {...field} 
                                    onKeyDown={(e) => {
                                      // Prevent form submission on Enter key
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editTaskForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Enter task description" 
                                    {...field} 
                                    onKeyDown={(e) => {
                                      // Prevent form submission on Enter key
                                      if (e.key === 'Enter' && e.ctrlKey) {
                                        e.preventDefault();
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={editTaskForm.control}
                              name="priority"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Priority</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select priority" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="low">Low</SelectItem>
                                      <SelectItem value="medium">Medium</SelectItem>
                                      <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={editTaskForm.control}
                              name="status"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Status</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="todo">To Do</SelectItem>
                                      <SelectItem value="in_progress">In Progress</SelectItem>
                                      <SelectItem value="done">Done</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={editTaskForm.control}
                              name="dueDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Due Date (Optional)</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={editTaskForm.control}
                              name="estimatedTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Estimated Time (mins)</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="60" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={editTaskForm.control}
                            name="isRecurring"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="h-4 w-4 mt-1"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Recurring Task</FormLabel>
                                  <p className="text-sm text-muted-foreground">
                                    This task will automatically repeat on selected days
                                  </p>
                                </div>
                              </FormItem>
                            )}
                          />
                          {editTaskForm.watch("isRecurring") && (
                            <FormField
                              control={editTaskForm.control}
                              name="recurringDays"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Recurring Days</FormLabel>
                                  <div className="flex flex-wrap gap-2">
                                    {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                                      <Button
                                        key={day}
                                        type="button"
                                        variant={field.value?.includes(day) ? "default" : "outline"}
                                        onClick={() => {
                                          const updatedDays = field.value?.includes(day)
                                            ? field.value.filter((d: string) => d !== day)
                                            : [...(field.value || []), day];
                                          field.onChange(updatedDays);
                                        }}
                                        className="capitalize"
                                      >
                                        {day.slice(0, 3)}
                                      </Button>
                                    ))}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                              {isSubmitting ? "Updating..." : "Update Task"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                  
                  {/* Delete Task Alert Dialog */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the task.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDeleteTask(task._id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-3">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-medium">No tasks yet</h3>
          <p className="mb-4 text-muted-foreground">
            Create your first task to get started with this project.
          </p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Task
          </Button>
        </div>
      )}
    </div>
  )
}
