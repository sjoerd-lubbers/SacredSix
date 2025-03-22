"use client"

import { useState } from "react"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskSortingControls } from "@/components/TaskSortingControls"
import { TaskItem } from "@/components/TaskItem"

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

interface ProjectTasksTabProps {
  tasks: Task[]
  goals: Goal[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  sortBy: string
  setSortBy: (sortBy: string) => void
  sortOrder: "asc" | "desc"
  setSortOrder: (sortOrder: "asc" | "desc") => void
  onCreateTask: () => void
  onEditTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
  onStatusChange: (taskId: string, newStatus: string) => void
  setEditDialogOpen: (open: boolean) => void
}

export function ProjectTasksTab({
  tasks,
  goals,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  setEditDialogOpen
}: ProjectTasksTabProps) {
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active")

  // Sort tasks based on current sort settings
  const sortedTasks = [...tasks].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === "priority") {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      comparison = (priorityOrder[a.priority as keyof typeof priorityOrder] || 0) - 
                  (priorityOrder[b.priority as keyof typeof priorityOrder] || 0);
    } else if (sortBy === "dueDate") {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      comparison = dateA - dateB;
    } else if (sortBy === "status") {
      const statusOrder = { todo: 1, in_progress: 2, done: 3 };
      comparison = (statusOrder[a.status as keyof typeof statusOrder] || 0) - 
                  (statusOrder[b.status as keyof typeof statusOrder] || 0);
    } else if (sortBy === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === "updatedAt") {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      comparison = dateA - dateB;
    }
    
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Filter tasks based on active tab and search query
  const getFilteredTasks = (tabValue: "active" | "completed") => {
    return sortedTasks.filter(task => {
      // Filter by tab (active vs completed)
      const tabFilter = tabValue === "active" 
        ? task.status !== "done" 
        : task.status === "done";
      
      // Filter by search query
      const searchFilter = searchQuery 
        ? task.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      
      return tabFilter && searchFilter;
    });
  };

  const activeTasks = getFilteredTasks("active");
  const completedTasks = getFilteredTasks("completed");

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative w-full md:w-64">
        <Input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      
      {/* Task Tabs (Active vs Completed) */}
      <Tabs defaultValue="active" onValueChange={(value) => setActiveTab(value as "active" | "completed")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">
            Active Tasks ({activeTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed Tasks ({completedTasks.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          {/* Sorting Controls Component */}
          <TaskSortingControls
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />
          
          {/* Active Tasks */}
          {activeTasks.length > 0 ? (
            <div className="space-y-4">
              {activeTasks.map((task) => (
                <TaskItem
                  key={task._id}
                  task={task}
                  onStatusChange={onStatusChange}
                  onEdit={(task) => {
                    onEditTask(task);
                    setEditDialogOpen(true);
                  }}
                  onDelete={onDeleteTask}
                  setEditDialogOpen={setEditDialogOpen}
                  goals={goals}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-medium">No active tasks</h3>
              <p className="mb-4 text-muted-foreground">
                {searchQuery 
                  ? "No tasks match your search criteria." 
                  : "Create your first task to get started with this project."}
              </p>
              <Button onClick={onCreateTask}>
                <Plus className="mr-2 h-4 w-4" /> New Task
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4">
          {/* Sorting Controls Component */}
          <TaskSortingControls
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />
          
          {/* Completed Tasks */}
          {completedTasks.length > 0 ? (
            <div className="space-y-4">
              {completedTasks.map((task) => (
                <TaskItem
                  key={task._id}
                  task={task}
                  onStatusChange={onStatusChange}
                  onEdit={(task) => {
                    onEditTask(task);
                    setEditDialogOpen(true);
                  }}
                  onDelete={onDeleteTask}
                  setEditDialogOpen={setEditDialogOpen}
                  goals={goals}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-medium">No completed tasks</h3>
              <p className="mb-4 text-muted-foreground">
                {searchQuery 
                  ? "No completed tasks match your search criteria." 
                  : "Complete some tasks to see them here."}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
