"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, Send, Loader2, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { apiEndpoint } from "@/config"

interface LogEntry {
  _id?: string
  content: string
  createdAt: string
  userId: string
  userName: string
}

interface Task {
  _id: string
  name: string
  logs?: LogEntry[]
}

interface TaskLogDialogProps {
  task: Task
  onLogAdded?: () => void
  trigger?: React.ReactNode
}

export function TaskLogDialog({ task, onLogAdded, trigger }: TaskLogDialogProps) {
  const { toast } = useToast()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [newLog, setNewLog] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>("")
  
  // Use a ref to preserve the dialog state across re-renders
  const dialogStateRef = useRef(isOpen)
  
  // Update the ref when isOpen changes
  useEffect(() => {
    dialogStateRef.current = isOpen
  }, [isOpen])

  // Fetch logs when component mounts
  useEffect(() => {
    fetchLogs()
  }, [task._id])

  // Get current user ID from JWT token
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      try {
        // JWT tokens are in the format: header.payload.signature
        // We need to decode the payload part (index 1)
        const payload = token.split('.')[1]
        const decodedPayload = JSON.parse(atob(payload))
        setCurrentUserId(decodedPayload.id)
      } catch (error) {
        console.error("Error decoding JWT token:", error)
      }
    }
  }, [])

  const fetchLogs = async () => {
    if (!task._id) return
    
    setIsFetching(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      const response = await axios.get(apiEndpoint(`tasks/${task._id}/logs`), config)
      setLogs(response.data)
    } catch (error) {
      console.error("Error fetching logs:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load task logs. Please try again.",
      })
    } finally {
      setIsFetching(false)
    }
  }

  // Fetch logs when component mounts and when task changes
  useEffect(() => {
    fetchLogs()
  }, [task._id])
  
  // Also fetch logs when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchLogs()
    }
  }, [isOpen])

  const handleAddLog = async () => {
    if (!newLog.trim()) return
    
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      await axios.post(
        apiEndpoint(`tasks/${task._id}/logs`),
        { content: newLog },
        config
      )

      // Clear the input and refresh logs
      setNewLog("")
      
      // Fetch updated logs
      const response = await axios.get(apiEndpoint(`tasks/${task._id}/logs`), config)
      setLogs(response.data)
      
      // Notify parent component if needed, but use setTimeout to avoid immediate re-render
      // that might cause the dialog to close
      if (onLogAdded) {
        // Store the current dialog state
        const wasOpen = dialogStateRef.current
        
        setTimeout(() => {
          onLogAdded()
          
          // If the dialog was open before, make sure it stays open
          if (wasOpen) {
            setIsOpen(true)
          }
        }, 100)
      }

      toast({
        title: "Log added",
        description: "Your log entry has been added to the task.",
      })
    } catch (error) {
      console.error("Error adding log:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add log. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteLog = async (logId: string) => {
    if (!logId) return
    
    setIsDeleting(logId)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      await axios.delete(
        apiEndpoint(`tasks/${task._id}/logs/${logId}`),
        config
      )

      // Fetch updated logs
      const response = await axios.get(apiEndpoint(`tasks/${task._id}/logs`), config)
      setLogs(response.data)
      
      // Notify parent component if needed, but use setTimeout to avoid immediate re-render
      // that might cause the dialog to close
      if (onLogAdded) {
        // Store the current dialog state
        const wasOpen = dialogStateRef.current
        
        setTimeout(() => {
          onLogAdded()
          
          // If the dialog was open before, make sure it stays open
          if (wasOpen) {
            setIsOpen(true)
          }
        }, 100)
      }

      toast({
        title: "Log deleted",
        description: "Your log entry has been removed.",
      })
    } catch (error) {
      console.error("Error deleting log:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete log. Please try again.",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return `${formatDistanceToNow(date, { addSuffix: true })} (${date.toLocaleString()})`
    } catch (error) {
      return dateString
    }
  }

  // Handle dialog open/close
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    dialogStateRef.current = open
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="secondary" size="sm" className="w-full gap-1 relative">
            <MessageSquare className="h-4 w-4" />
            <span>Task Logs</span>
            {logs.length > 0 && (
              <span className="ml-1 bg-gray-600 text-white text-xs rounded-full px-1.5 py-0.5 inline-flex items-center justify-center">
                {logs.length}
              </span>
            )}
            {isFetching && (
              <span className="ml-1 animate-pulse">...</span>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Task Logs: {task.name}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-[300px] max-h-[400px]">
          {isFetching ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length > 0 ? (
            logs.map((log, index) => (
              <div key={log._id || index} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar name={log.userName} size="sm" />
                    <div>
                      <p className="text-sm font-medium">{log.userName}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</p>
                    </div>
                  </div>
                  {log._id && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 flex items-center gap-1" 
                      onClick={() => handleDeleteLog(log._id!)}
                      disabled={isDeleting === log._id}
                    >
                      {isDeleting === log._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 text-red-500" />
                          <span>Delete</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{log.content}</p>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-2 opacity-20" />
              <p>No logs yet</p>
              <p className="text-sm">Add your first log entry below</p>
            </div>
          )}
        </div>
        
        <div className="border-t pt-4">
          <div className="flex items-start gap-2">
            <Textarea
              placeholder="Add a log entry... (discoveries, progress updates, notes, etc.)"
              value={newLog}
              onChange={(e) => setNewLog(e.target.value)}
              className="flex-1 min-h-[80px]"
            />
            <Button 
              onClick={handleAddLog} 
              disabled={isLoading || !newLog.trim()}
              className="mt-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
