"use client"

import { useState, useEffect } from "react"
import { Project } from "@/lib/store"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import ProjectForm, { ProjectFormValues } from "@/components/ProjectForm"

interface EditProjectDialogProps {
  project: Project
  sacredProjectsCount: number
  isSubmitting: boolean
  onUpdate: (data: ProjectFormValues) => Promise<void>
}

export default function EditProjectDialog({
  project,
  sacredProjectsCount,
  isSubmitting,
  onUpdate
}: EditProjectDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const handleUpdate = async (data: ProjectFormValues) => {
    await onUpdate(data)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
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
            tags: project.tags?.join(", ") || "",
            isSacred: project.isSacred || false,
          }}
          onSubmit={handleUpdate}
          isSubmitting={isSubmitting}
          submitLabel="Update Project"
          submittingLabel="Updating..."
          disableSacredCheckbox={sacredProjectsCount >= 6 && !project.isSacred}
          disabledSacredMessage="Maximum of 6 sacred projects reached"
        />
      </DialogContent>
    </Dialog>
  )
}
