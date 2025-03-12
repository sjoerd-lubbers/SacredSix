"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Calendar, CheckSquare, Clock, ListTodo } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { CompletionRateCard } from "@/components/CompletionRateCard"

interface Task {
  _id: string
  name: string
  status: string
  priority: string
  projectId: string
  dueDate?: string
  isSelectedForToday: boolean
  createdAt?: string
}

interface Project {
  _id: string
  name: string
  taskCount?: number
}

export default function DashboardPage() {
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    todayTasks: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return

        const config = {
          headers: { Authorization: `Bearer ${token}` }
        }

        // Fetch tasks
        const tasksResponse = await axios.get("http://localhost:5000/api/tasks", config)
        setTasks(tasksResponse.data)

        // Fetch projects
        const projectsResponse = await axios.get("http://localhost:5000/api/projects", config)
        
        // Count tasks per project
        const projectsWithTaskCount = projectsResponse.data.map((project: Project) => ({
          ...project,
          taskCount: tasksResponse.data.filter((task: Task) => task.projectId === project._id).length
        }))
        
        setProjects(projectsWithTaskCount)

        // Calculate stats
        const totalTasks = tasksResponse.data.length
        const completedTasks = tasksResponse.data.filter((task: Task) => task.status === "done").length
        const inProgressTasks = tasksResponse.data.filter((task: Task) => task.status === "in_progress").length
        const todayTasks = tasksResponse.data.filter((task: Task) => task.isSelectedForToday).length

        setStats({
          totalTasks,
          completedTasks,
          inProgressTasks,
          todayTasks,
        })
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Removed unused chart and recent tasks code

  if (isLoading) {
    return <div className="flex h-full items-center justify-center">Loading dashboard data...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your productivity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <ListTodo className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Total Tasks</h3>
          </div>
          <p className="mt-2 text-3xl font-bold">{stats.totalTasks}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Completed</h3>
          </div>
          <p className="mt-2 text-3xl font-bold">{stats.completedTasks}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-medium">In Progress</h3>
          </div>
          <p className="mt-2 text-3xl font-bold">{stats.inProgressTasks}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Today's Tasks</h3>
          </div>
          <p className="mt-2 text-3xl font-bold">{stats.todayTasks}</p>
        </div>
      </div>

      {/* Completion Rate Card */}
      <CompletionRateCard />

      {/* Removed Task Status and Recent Tasks sections as requested */}

      {/* Projects */}
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-medium">Projects</h3>
          <Button variant="outline" size="sm" asChild>
            <a href="/dashboard/projects">View All</a>
          </Button>
        </div>
        {projects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 3).map((project) => (
              <div key={project._id} className="rounded-md border p-4">
                <h4 className="font-medium">{project.name}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{project.taskCount || 0} tasks</p>
                <Button variant="ghost" size="sm" className="mt-2" asChild>
                  <a href={`/dashboard/projects/${project._id}`}>View Project</a>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No projects yet</p>
        )}
      </div>
    </div>
  )
}
