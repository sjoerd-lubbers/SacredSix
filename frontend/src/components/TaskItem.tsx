"use client"

import { useState } from "react"
import { Pencil, Trash2, CheckCircle2, Circle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { Dialog, DialogTrigger } from "@/components/ui/dialog"

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
  createdAt: string
  updatedAt: string
}

interface TaskItemProps {
  task: Task
  onStatusChange: (taskId: string, newStatus: string) => void
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  setEditDialogOpen: (open: boolean) => void
}

export function TaskItem({ task, onStatusChange, onEdit, onDelete, setEditDialogOpen }: TaskItemProps) {
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

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <button
            onClick={() => {
              const newStatus = task.status === "done" 
                ? "todo" 
                : task.status === "in_progress" 
                  ? "done" 
                  : "in_progress"
              onStatusChange(task._id, newStatus)
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
              <span className="text-xs text-muted-foreground">
                Last Changed: {new Date(task.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          {/* Edit Task Button */}
          <Dialog onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(task)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </DialogTrigger>
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
                <AlertDialogAction onClick={() => onDelete(task._id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
