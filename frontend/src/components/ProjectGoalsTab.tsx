"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GoalItem } from "@/components/GoalItem"
import { LinkTasksToGoalDialog } from "@/components/LinkTasksToGoalDialog"

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

interface ProjectGoalsTabProps {
  projectId?: string
  goals: Goal[]
  tasks: Task[]
  searchQuery: string
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>
  onCreateGoal: () => void
  onEditGoal: React.Dispatch<React.SetStateAction<Goal | null>>
  onDeleteGoal: (goalId: string) => Promise<void>
  onLinkTasks: (goalId: string, goalName: string) => void
  onStatusChange: (goalId: string, newStatus: string) => Promise<void>
  setEditDialogOpen: (open: boolean) => void
}

export function ProjectGoalsTab({ 
  goals, 
  tasks, 
  searchQuery, 
  setSearchQuery, 
  onCreateGoal, 
  onEditGoal, 
  onDeleteGoal, 
  onLinkTasks, 
  onStatusChange, 
  setEditDialogOpen 
}: ProjectGoalsTabProps) {
  // Filter goals based on search query
  const filteredGoals = goals.filter(goal => 
    goal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (goal.description && goal.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Goals</h2>
        <Button onClick={onCreateGoal}>
          <Plus className="mr-2 h-4 w-4" />
          Add Goal
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search goals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {filteredGoals.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="text-lg font-medium">No goals found</h3>
          <p className="mt-2 text-muted-foreground">
            {searchQuery 
              ? "Try a different search term or clear your search" 
              : "Create goals to track progress on your project milestones"}
          </p>
          {!searchQuery && (
            <Button 
              className="mt-4" 
              onClick={onCreateGoal}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create your first goal
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {filteredGoals.map((goal) => (
            <GoalItem
              key={goal._id}
              goal={goal}
              tasks={tasks}
              onStatusChange={onStatusChange}
              onEdit={(goal) => {
                onEditGoal(goal);
                setEditDialogOpen(true);
              }}
              onDelete={onDeleteGoal}
              setEditDialogOpen={setEditDialogOpen}
              onLinkTask={(goalId) => onLinkTasks(goalId, goals.find(g => g._id === goalId)?.name || '')}
            />
          ))}
        </div>
      )}
    </div>
  );
}
