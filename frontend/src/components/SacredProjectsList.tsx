"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Flame, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { apiEndpoint } from "@/config"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import ProjectForm, { ProjectFormValues } from "@/components/ProjectForm"

interface Project {
  _id: string
  name: string
  description?: string
  taskCount?: number
  isArchived?: boolean
  tags?: string[]
  isSacred?: boolean
}

export function SacredProjectsList() {
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      // Fetch projects
      const projectsResponse = await axios.get(apiEndpoint("projects"), config)
      
      // Fetch tasks to count them per project
      const tasksResponse = await axios.get(apiEndpoint("tasks"), config)
      
      // Count tasks per project
      const projectsWithTaskCount = projectsResponse.data
        .filter((project: Project) => !project.isArchived && project.isSacred) // Only sacred, non-archived projects
        .map((project: Project) => ({
          ...project,
          taskCount: tasksResponse.data.filter((task: any) => task.projectId === project._id).length
        }))
      
      setProjects(projectsWithTaskCount)
    } catch (error) {
      console.error("Error fetching sacred projects:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load sacred projects. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateProject = async (data: ProjectFormValues) => {
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      const tagsArray = data.tags 
        ? data.tags.split(",").map(tag => tag.trim()).filter(tag => tag !== "") 
        : []

      const newProject = await axios.post(
        apiEndpoint("projects"), 
        {
          name: data.name,
          description: data.description,
          tags: tagsArray,
          isSacred: true // Always create as sacred in this component
        }, 
        config
      )

      // Add the new project to the list
      setProjects(prev => [...prev, { ...newProject.data, taskCount: 0 }])

      toast({
        title: "Sacred project created",
        description: "Your sacred project has been created successfully.",
      })
    } catch (error) {
      console.error("Error creating sacred project:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create sacred project. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center">Loading sacred projects...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Sacred Six Projects</h2>
          <p className="text-muted-foreground">Your most important projects</p>
        </div>
        {projects.filter(p => p.isSacred).length < 6 ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Sacred Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Sacred Project</DialogTitle>
              </DialogHeader>
              <ProjectForm
                onSubmit={handleCreateProject}
                isSubmitting={isSubmitting}
                submitLabel="Create Sacred Project"
                submittingLabel="Creating..."
                defaultValues={{ 
                  name: "",
                  description: "",
                  tags: "",
                  isSacred: true 
                }}
              />
            </DialogContent>
          </Dialog>
        ) : (
          <div className="text-sm text-amber-600 flex items-center">
            <span className="mr-2">Maximum of 6 sacred projects reached</span>
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard/projects">Manage Projects</a>
            </Button>
          </div>
        )}
      </div>

      {projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <div key={project._id} className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="flex items-center">
                <div className="mr-3 flex-shrink-0" style={{ width: '32px', height: '32px' }}>
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-amber-100 text-amber-700">
                    <span className="text-sm font-bold">{index + 1}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="font-medium">{project.name}</h3>
                    <Badge variant="secondary" className="ml-2 flex items-center gap-1 bg-amber-100 text-amber-700" title="Sacred Project">
                      <Flame className="h-3 w-3" />
                      Sacred
                    </Badge>
                  </div>
                  {project.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <p className="text-sm text-muted-foreground">{project.taskCount || 0} tasks</p>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/dashboard/projects/${project._id}`}>View Tasks</a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
          <h3 className="text-lg font-medium">No Sacred Six projects yet</h3>
          <p className="mt-2 text-muted-foreground">
            Create your Sacred Six projects to focus on what matters most.
          </p>
          {projects.filter(p => p.isSacred).length < 6 ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" /> Create Sacred Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Sacred Project</DialogTitle>
                </DialogHeader>
                <ProjectForm
                  onSubmit={handleCreateProject}
                  isSubmitting={isSubmitting}
                  submitLabel="Create Sacred Project"
                  submittingLabel="Creating..."
                  defaultValues={{ 
                    name: "",
                    description: "",
                    tags: "",
                    isSacred: true 
                  }}
                />
              </DialogContent>
            </Dialog>
          ) : (
            <div className="mt-4 text-amber-600">
              <p>Maximum of 6 sacred projects reached</p>
              <Button variant="outline" className="mt-2" asChild>
                <a href="/dashboard/projects">Manage Projects</a>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
