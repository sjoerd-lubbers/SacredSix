"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Pencil, Trash2, Archive, RotateCcw, Users, Share, Flame } from "lucide-react"
import { Project, Collaborator } from "@/lib/store"
import { User } from "@/lib/userStore"
import { apiEndpoint } from "@/config"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
} from "@/components/ui/dialog"
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
import ProjectForm, { ProjectFormValues } from "@/components/ProjectForm"
import ProjectSharingModal from "@/components/ProjectSharingModal"

interface ProjectCardProps {
  project: Project
  user: User | null
  selectedTag: string | null
  isArchiving: boolean
  isSubmitting: boolean
  onTagClick: (tag: string) => void
  onArchiveToggle: (projectId: string, archive: boolean) => Promise<void>
  onUpdate: (projectId: string, data: Partial<Project>) => Promise<Project | null>
  onDelete: (projectId: string) => Promise<void>
  onProjectUpdated: () => Promise<void>
}

export default function ProjectCard({
  project,
  user,
  selectedTag,
  isArchiving,
  isSubmitting,
  onTagClick,
  onArchiveToggle,
  onUpdate,
  onDelete,
  onProjectUpdated
}: ProjectCardProps) {
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [sacredProjectsCount, setSacredProjectsCount] = useState<number>(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [taskLogsCount, setTaskLogsCount] = useState<number>(0)
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)

  useEffect(() => {
    // Fetch the count of sacred projects when the dialog is opened
    if (isDialogOpen) {
      fetchSacredProjectsCount()
    }
  }, [isDialogOpen])

  // Fetch task logs count when component mounts
  useEffect(() => {
    fetchTaskLogsCount()
  }, [project._id])

  const fetchTaskLogsCount = async () => {
    if (!project._id) return
    
    setIsLoadingLogs(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      // First, get all tasks for this project
      const tasksResponse = await axios.get(apiEndpoint(`tasks/project/${project._id}`), config)
      const tasks = tasksResponse.data
      
      // Then, get logs for each task and count them
      let totalLogs = 0
      
      for (const task of tasks) {
        const logsResponse = await axios.get(apiEndpoint(`tasks/${task._id}/logs`), config)
        totalLogs += logsResponse.data.length
      }
      
      setTaskLogsCount(totalLogs)
    } catch (error) {
      console.error("Error fetching task logs count:", error)
    } finally {
      setIsLoadingLogs(false)
    }
  }

  const fetchSacredProjectsCount = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      const response = await axios.get(apiEndpoint("projects"), config)
      const sacredProjects = response.data.filter(
        (p: Project) => p.isSacred && !p.isArchived && p._id !== project._id
      )
      
      setSacredProjectsCount(sacredProjects.length)
    } catch (error) {
      console.error("Error fetching sacred projects count:", error)
    }
  }

  const handleUpdate = async (data: ProjectFormValues) => {
    if (!editingProject) return

    const tagsArray = data.tags 
      ? data.tags.split(",").map(tag => tag.trim()).filter(tag => tag !== "") 
      : []

    await onUpdate(
      editingProject._id, 
      {
        name: data.name,
        description: data.description,
        tags: tagsArray,
        isSacred: data.isSacred
      }
    )
    
    setEditingProject(null)
    setIsDialogOpen(false)
  }

  return (
    <div 
      key={project._id} 
      className="rounded-lg border bg-card p-4 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center">
            <h3 className={`font-medium ${project.isSacred ? 'text-amber-700 dark:text-amber-500' : ''}`}>{project.name}</h3>
            {project.collaborators && project.collaborators.length > 0 && (
              <Badge variant="outline" className="ml-2 flex items-center gap-1" title="Shared with others">
                <Users className="h-3 w-3" />
                {project.collaborators.length}
              </Badge>
            )}
          </div>
          {project.description && (
            <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
          )}
          {project.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {project.tags.map((tag, index) => (
                <Badge
                  key={index}
                  className={`cursor-pointer hover:bg-primary/20 ${selectedTag === tag ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}
                  onClick={() => onTagClick(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Created: {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-2">
          {!project.isArchived && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onArchiveToggle(project._id, true)}
              disabled={isArchiving}
              title="Archive project"
            >
              <Archive className="h-4 w-4" />
            </Button>
          )}
          {project.isArchived && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onArchiveToggle(project._id, false)}
              disabled={isArchiving}
              title="Restore project"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingProject(project);
                  setIsDialogOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Project</DialogTitle>
              </DialogHeader>
              <ProjectForm
                defaultValues={{
                  name: project.name,
                  description: project.description || "",
                  tags: project.tags.join(", "),
                  isSacred: project.isSacred || false,
                }}
                onSubmit={handleUpdate}
                isSubmitting={isSubmitting}
                submitLabel="Update Project"
                submittingLabel="Updating..."
                disableSacredCheckbox={sacredProjectsCount >= 6}
                disabledSacredMessage="Maximum of 6 sacred projects reached"
              />
            </DialogContent>
          </Dialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Project</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this project? This action cannot be undone.
                  All tasks associated with this project will also be deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(project._id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 relative" asChild>
          <a href={`/dashboard/projects/${project._id}`}>
            View Tasks
            {taskLogsCount > 0 && (
              <span className="ml-1 bg-gray-600 text-white text-xs rounded-full px-1.5 py-0.5 inline-flex items-center justify-center">
                {taskLogsCount}
              </span>
            )}
            {isLoadingLogs && (
              <span className="ml-1 animate-pulse">...</span>
            )}
          </a>
        </Button>
        {!project.isArchived && user && (
          <ProjectSharingModal
            projectId={project._id}
            projectName={project.name}
            ownerId={{ _id: user.id, name: user.name, email: user.email }}
            collaborators={(project.collaborators || []).map(collab => ({
              ...collab,
              userId: typeof collab.userId === 'string' 
                ? { _id: collab.userId, name: '', email: '' } 
                : collab.userId
            }))}
            currentUserId={user.id}
            onProjectUpdated={onProjectUpdated}
            trigger={
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Share className="h-4 w-4" />
                Share
              </Button>
            }
          />
        )}
      </div>
    </div>
  )
}
