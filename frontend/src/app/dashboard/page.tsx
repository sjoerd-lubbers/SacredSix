"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Calendar, CheckSquare, Clock, ListTodo } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { CompletionRateCard } from "@/components/CompletionRateCard"
import { Sparkline } from "@/components/Sparkline"
import { apiEndpoint } from "@/config";

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
  isArchived?: boolean
  tags?: string[]
  isSacred?: boolean
}

interface SparklineData {
  date: string
  count: number
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
  const [sparklineData, setSparklineData] = useState<{
    creationSparkline: SparklineData[],
    completionSparkline: SparklineData[]
  }>({
    creationSparkline: [],
    completionSparkline: []
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
        const tasksResponse = await axios.get(apiEndpoint("tasks"), config)
        setTasks(tasksResponse.data)

        // Fetch projects
        const projectsResponse = await axios.get(apiEndpoint("projects"), config)
        
        // Count tasks per project
        const projectsWithTaskCount = projectsResponse.data.filter(
          (project: Project) => !project.isArchived // Exclude archived projects
        ).map((project: Project) => ({
          ...project,
          taskCount: tasksResponse.data.filter((task: Task) => task.projectId === project._id).length
        }))
        
        setProjects(projectsWithTaskCount)

        // Calculate stats - exclude tasks from archived projects
        const activeProjects = projectsResponse.data.filter((project: Project) => !project.isArchived)
        const activeProjectIds = activeProjects.map((project: Project) => project._id)
        
        const activeTasks = tasksResponse.data.filter(
          (task: Task) => activeProjectIds.includes(task.projectId)
        )
        
        const totalTasks = activeTasks.length
        const completedTasks = activeTasks.filter((task: Task) => task.status === "done").length
        const inProgressTasks = activeTasks.filter((task: Task) => task.status === "in_progress").length
        const todayTasks = activeTasks.filter((task: Task) => task.isSelectedForToday).length

        setStats({
          totalTasks,
          completedTasks,
          inProgressTasks,
          todayTasks,
        })
        
        // Fetch sparkline data
        const sparklineResponse = await axios.get(apiEndpoint("tasks/stats/sparkline"), config)
        setSparklineData(sparklineResponse.data)
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
          <div className="flex items-end justify-between">
            <p className="mt-2 text-3xl font-bold">{stats.totalTasks}</p>
            {sparklineData.creationSparkline.length > 0 && (
              <div className="mb-1">
                <Sparkline 
                  data={sparklineData.creationSparkline.map(d => d.count)} 
                  width={100} 
                  height={30} 
                  color="#3b82f6" // Blue color
                />
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Task creation trend (30 days)</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Completed</h3>
          </div>
          <div className="flex items-end justify-between">
            <p className="mt-2 text-3xl font-bold">{stats.completedTasks}</p>
            {sparklineData.completionSparkline.length > 0 && (
              <div className="mb-1">
                <Sparkline 
                  data={sparklineData.completionSparkline.map(d => d.count)} 
                  width={100} 
                  height={30} 
                  color="#22c55e" // Green color
                />
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Task completion trend (30 days)</p>
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

      {/* Completion Rate Card and Sacred Six Projects side by side */}
      <div className="grid gap-6 md:grid-cols-6">
        {/* Completion Rate Card - Left Side */}
        <div className="md:col-span-2">
          <CompletionRateCard />
        </div>
        
        {/* Sacred Six Projects - Right Side */}
        <div className="md:col-span-4 rounded-lg border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium">Sacred Six</h3>
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard/sacred-six">View All</a>
            </Button>
          </div>
          {projects.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects
                .filter(project => project.isSacred)
                .slice(0, 6)
                .map((project) => (
                  <div key={project._id} className="rounded-md border p-4">
                    <div className="flex items-center">
                      <div className="mr-3 flex-shrink-0" style={{ width: '32px', height: '32px' }}>
                        <div className="w-full h-full rounded-full flex items-center justify-center bg-amber-100 text-amber-700">
                          <span className="text-sm font-bold">{projects.filter(p => p.isSacred).indexOf(project) + 1}</span>
                        </div>
                      </div>
                      <h4 className="font-medium">{project.name}</h4>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{project.taskCount || 0} tasks</p>
                    <Button variant="ghost" size="sm" className="mt-2" asChild>
                      <a href={`/dashboard/projects/${project._id}`}>View Project</a>
                    </Button>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No Sacred Six projects yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
