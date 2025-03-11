"use client"

import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TaskSortingControlsProps {
  sortBy: string
  setSortBy: (value: string) => void
  sortOrder: "asc" | "desc"
  setSortOrder: (value: "asc" | "desc") => void
}

export function TaskSortingControls({
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder
}: TaskSortingControlsProps) {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Sort by:</span>
        <Select
          value={sortBy}
          onValueChange={setSortBy}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="dueDate">Due Date</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
      >
        <ArrowUpDown className="mr-2 h-4 w-4" />
        {sortOrder === "asc" ? "Ascending" : "Descending"}
      </Button>
    </div>
  )
}
