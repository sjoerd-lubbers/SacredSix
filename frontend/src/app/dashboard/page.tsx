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
        <div className="rounded-lg border bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 p-4 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full">
              <ListTodo className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <h3 className="font-medium">Total Tasks</h3>
          </div>
          <div className="flex items-end justify-between">
            <p className="mt-2 text-3xl font-bold text-blue-700 dark:text-blue-300">{stats.totalTasks}</p>
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
          <p className="mt-1 text-xs text-blue-600/70 dark:text-blue-400/70">Task creation trend (30 days)</p>
        </div>
        <div className="rounded-lg border bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 p-4 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="flex items-center space-x-2">
            <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full">
              <CheckSquare className="h-5 w-5 text-green-600 dark:text-green-300" />
            </div>
            <h3 className="font-medium">Completed</h3>
          </div>
          <div className="flex items-end justify-between">
            <p className="mt-2 text-3xl font-bold text-green-700 dark:text-green-300">{stats.completedTasks}</p>
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
          <p className="mt-1 text-xs text-green-600/70 dark:text-green-400/70">Task completion trend (30 days)</p>
        </div>
        <div className="rounded-lg border bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800 p-4 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="flex items-center space-x-2">
            <div className="bg-purple-100 dark:bg-purple-800 p-2 rounded-full">
              <Clock className="h-5 w-5 text-purple-600 dark:text-purple-300" />
            </div>
            <h3 className="font-medium">In Progress</h3>
          </div>
          <div className="flex items-end justify-between">
            <p className="mt-2 text-3xl font-bold text-purple-700 dark:text-purple-300">{stats.inProgressTasks}</p>
            <div className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-800 px-2 py-1 rounded-full">
              {stats.totalTasks > 0 ? Math.round((stats.inProgressTasks / stats.totalTasks) * 100) : 0}% of total
            </div>
          </div>
          <p className="mt-1 text-xs text-purple-600/70 dark:text-purple-400/70">Tasks currently in progress</p>
        </div>
        <div className="rounded-lg border bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 p-4 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="flex items-center space-x-2">
            <div className="bg-amber-100 dark:bg-amber-800 p-2 rounded-full">
              <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-300" />
            </div>
            <h3 className="font-medium">Today's Tasks</h3>
          </div>
          <div className="flex items-end justify-between">
            <p className="mt-2 text-3xl font-bold text-amber-700 dark:text-amber-300">{stats.todayTasks}</p>
            <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
              <a href="/dashboard/today">View</a>
            </Button>
          </div>
          <p className="mt-1 text-xs text-amber-600/70 dark:text-amber-400/70">Tasks selected for today</p>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <h3 className="font-medium mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button className="h-auto py-4 flex flex-col items-center justify-center gap-2" asChild>
            <a href="/dashboard/today">
              <Calendar className="h-6 w-6 mb-1" />
              <span>Daily Sacred 6</span>
            </a>
          </Button>
          <Button className="h-auto py-4 flex flex-col items-center justify-center gap-2" variant="outline" asChild>
            <a href="/dashboard/projects">
              <ListTodo className="h-6 w-6 mb-1" />
              <span>My Projects</span>
            </a>
          </Button>
          <Button className="h-auto py-4 flex flex-col items-center justify-center gap-2" variant="outline" asChild>
            <a href="/dashboard/reflections">
              <Clock className="h-6 w-6 mb-1" />
              <span>Reflections</span>
            </a>
          </Button>
          <Button className="h-auto py-4 flex flex-col items-center justify-center gap-2" variant="outline" asChild>
            <a href="/dashboard/personal-mission">
              <CheckSquare className="h-6 w-6 mb-1" />
              <span>My Mission</span>
            </a>
          </Button>
        </div>
      </div>

      {/* Completion Rate Card and Sacred Six Projects side by side */}
      <div className="grid gap-6 md:grid-cols-6">
        {/* Completion Rate Card - Left Side */}
        <div className="md:col-span-2">
          <CompletionRateCard />
        </div>
        
        {/* Sacred Six Projects - Right Side */}
        <div className="md:col-span-4 rounded-lg border bg-amber-50/50 dark:bg-amber-900/5 border-amber-200 dark:border-amber-800/30 p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-amber-100 dark:bg-amber-800 p-2 rounded-full mr-2">
                <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-300" />
              </div>
              <h3 className="font-medium text-lg">Sacred Six Projects</h3>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard/sacred-six">View All</a>
            </Button>
          </div>
          
          {projects.filter(project => project.isSacred).length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects
                .filter(project => project.isSacred)
                .slice(0, 6)
                .map((project, index) => {
                  // Calculate completion percentage
                  const projectTasks = tasks.filter(task => task.projectId === project._id);
                  const completedTasks = projectTasks.filter(task => task.status === "done").length;
                  const completionPercentage = projectTasks.length > 0 
                    ? Math.round((completedTasks / projectTasks.length) * 100) 
                    : 0;
                  
                  return (
                    <div 
                      key={project._id} 
                      className="rounded-lg border border-amber-200 dark:border-amber-800/50 bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center mb-2">
                        <div className="mr-3 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300 ring-2 ring-amber-300 dark:ring-amber-700">
                          <span className="text-sm font-bold">{index + 1}</span>
                        </div>
                        <h4 className="font-medium text-lg truncate">{project.name}</h4>
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{project.taskCount || 0} tasks</span>
                          <span className="font-medium">{completionPercentage}% complete</span>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div 
                            className="bg-amber-500 dark:bg-amber-600 h-1.5 rounded-full transition-all duration-500" 
                            style={{ width: `${completionPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Button variant="ghost" size="sm" className="px-2 h-8" asChild>
                          <a href={`/dashboard/projects/${project._id}`}>View Tasks</a>
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-amber-300 dark:border-amber-700 p-6 text-center">
              <h4 className="font-medium mb-2">No Sacred Six projects yet</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Create up to 6 sacred projects to focus on your most important goals.
              </p>
              <Button asChild>
                <a href="/dashboard/projects">Create Sacred Project</a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
