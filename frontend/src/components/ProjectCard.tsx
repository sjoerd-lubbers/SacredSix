"use client"

import { useState } from "react"
import { Pencil, Trash2, Archive, RotateCcw, Users, Share } from "lucide-react"
import { Project, Collaborator } from "@/lib/store"
import { User } from "@/lib/userStore"

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
        tags: tagsArray
      }
    )
    
    setEditingProject(null)
  }

  return (
    <div key={project._id} className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center">
            <h3 className="font-medium">{project.name}</h3>
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
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingProject(project)}
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
                }}
                onSubmit={handleUpdate}
                isSubmitting={isSubmitting}
                submitLabel="Update Project"
                submittingLabel="Updating..."
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
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <a href={`/dashboard/projects/${project._id}`}>View Tasks</a>
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
