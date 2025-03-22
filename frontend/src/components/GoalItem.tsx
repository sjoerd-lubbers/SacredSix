"use client"

import { useState } from "react"
import { Edit, Trash2, Link, MoreHorizontal, CheckCircle, Circle, AlertCircle, ChevronDown, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

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

interface GoalItemProps {
  goal: Goal
  tasks: Task[]
  onStatusChange: (goalId: string, newStatus: string) => void
  onEdit: (goal: Goal) => void
  onDelete: (goalId: string) => void
  setEditDialogOpen: (open: boolean) => void
  onLinkTask: (goalId: string) => void
}

export function GoalItem({
  goal,
  tasks,
  onStatusChange,
  onEdit,
  onDelete,
  setEditDialogOpen,
  onLinkTask
}: GoalItemProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  // Get linked tasks
  const linkedTasks = tasks.filter(task => task.goalId === goal._id);
  const completedTasks = linkedTasks.filter(task => task.status === "done");
  const inProgressTasks = linkedTasks.filter(task => task.status === "in_progress");
  const todoTasks = linkedTasks.filter(task => task.status === "todo");
  
  const completionPercentage = linkedTasks.length > 0 
    ? Math.round((completedTasks.length / linkedTasks.length) * 100) 
    : 0;
  
  // Format target date
  const formattedTargetDate = goal.targetDate 
    ? new Date(goal.targetDate).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }) 
    : null;

  // Determine goal status based on tasks
  const determineGoalStatus = () => {
    if (linkedTasks.length === 0) return goal.status;
    
    if (completedTasks.length === linkedTasks.length) {
      return "completed";
    } else if (inProgressTasks.length > 0 || completedTasks.length > 0) {
      return "in_progress";
    } else {
      return "not_started";
    }
  };

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_started":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "at_risk":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "blocked":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  // Status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "not_started":
        return <Circle className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "at_risk":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "blocked":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  // Format status label
  const formatStatusLabel = (status: string) => {
    switch (status) {
      case "not_started":
        return "Not Started";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "at_risk":
        return "At Risk";
      case "blocked":
        return "Blocked";
      default:
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  // Progress color based on percentage - using simpler colors as requested
  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-green-500";  // Completed
    if (percentage > 0) return "bg-blue-400";      // In Progress (lighter blue)
    return "bg-gray-400";                          // Not Started
  };

  // Get task status color
  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "todo":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  // Get task status icon
  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "todo":
        return <Circle className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  // Get task priority color
  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  // Get current goal status
  const currentStatus = determineGoalStatus();
  
  // If the status has changed, update it
  if (currentStatus !== goal.status) {
    onStatusChange(goal._id, currentStatus);
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold">{goal.name}</h3>
              {goal.description && (
                <p className="text-sm text-muted-foreground">{goal.description}</p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  onEdit(goal)
                  setEditDialogOpen(true)
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onLinkTask(goal._id)}>
                  <Link className="mr-2 h-4 w-4" />
                  Link Tasks
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 focus:text-red-600" 
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(currentStatus)}`}>
                  {getStatusIcon(currentStatus)}
                  <span className="ml-1">{formatStatusLabel(currentStatus)}</span>
                </span>
                {formattedTargetDate && (
                  <span className="text-xs text-muted-foreground">
                    Target: {formattedTargetDate}
                  </span>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onLinkTask(goal._id)}
              >
                <Link className="mr-2 h-4 w-4" />
                Link Tasks
              </Button>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className={getProgressColor(completionPercentage)} />
            </div>
            
            <div className="text-sm text-muted-foreground">
              {linkedTasks.length > 0 ? (
                <span>{completedTasks.length} of {linkedTasks.length} tasks completed</span>
              ) : (
                <span>No tasks linked to this goal yet</span>
              )}
            </div>
            
            {/* Linked Tasks Accordion */}
            {linkedTasks.length > 0 && (
              <Accordion type="single" collapsible className="mt-2">
                <AccordionItem value="tasks">
                  <AccordionTrigger className="text-sm font-medium">
                    Linked Tasks ({linkedTasks.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {linkedTasks.map(task => (
                        <div key={task._id} className="rounded-md border p-2 text-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium">{task.name}</div>
                              {task.description && (
                                <div className="text-xs text-muted-foreground line-clamp-2">
                                  {task.description}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${getTaskStatusColor(task.status)}`}>
                                {getTaskStatusIcon(task.status)}
                                <span className="ml-1">{task.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                              </span>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${getTaskPriorityColor(task.priority)}`}>
                                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the goal "{goal.name}". Any tasks linked to this goal will be unlinked, but not deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => onDelete(goal._id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
