"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { UserPlus, X, Shield, Edit, Eye, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
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

interface Collaborator {
  userId: {
    _id: string
    name: string
    email: string
  }
  role: string
  addedAt: string
}

interface Owner {
  _id: string
  name: string
  email: string
}

interface ManageCollaboratorsDialogProps {
  projectId: string
  projectName: string
  ownerId: Owner
  collaborators: Collaborator[]
  currentUserId: string
  onCollaboratorsUpdated: () => void
}

export default function ManageCollaboratorsDialog({
  projectId,
  projectName,
  ownerId,
  collaborators,
  currentUserId,
  onCollaboratorsUpdated
}: ManageCollaboratorsDialogProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    // Determine the current user's role
    if (ownerId._id === currentUserId) {
      setUserRole('owner')
    } else {
      const collaborator = collaborators.find(c => c.userId._id === currentUserId)
      if (collaborator) {
        setUserRole(collaborator.role)
      }
    }
  }, [ownerId, collaborators, currentUserId])

  const handleRemoveCollaborator = async (userId: string) => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      await axios.delete(`http://localhost:5000/api/projects/${projectId}/collaborators/${userId}`, config)

      toast({
        title: "Collaborator removed",
        description: "The collaborator has been removed from this project.",
      })

      onCollaboratorsUpdated()
      setIsOpen(false) // Close the dialog after successful removal
    } catch (error) {
      console.error("Error removing collaborator:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove collaborator. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500">{role}</Badge>
      case 'editor':
        return <Badge className="bg-blue-500">{role}</Badge>
      case 'viewer':
        return <Badge className="bg-green-500">{role}</Badge>
      default:
        return <Badge>{role}</Badge>
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-500" />
      case 'editor':
        return <Edit className="h-4 w-4 text-blue-500" />
      case 'viewer':
        return <Eye className="h-4 w-4 text-green-500" />
      default:
        return null
    }
  }

  // Check if user can manage collaborators (owner or admin)
  const canManageCollaborators = userRole === 'owner' || userRole === 'admin'

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Manage Collaborators
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Collaborators</DialogTitle>
          <DialogDescription>
            View and manage who has access to <span className="font-medium">{projectName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Project Owner</h3>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center space-x-3">
                <Avatar name={ownerId.name} size="sm" />
                <div>
                  <p className="font-medium">{ownerId.name}</p>
                  <p className="text-xs text-muted-foreground">{ownerId.email}</p>
                </div>
              </div>
              <Badge>Owner</Badge>
            </div>
          </div>

          {collaborators.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Collaborators</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    {canManageCollaborators && <TableHead className="w-[80px]">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collaborators.map((collaborator) => (
                    <TableRow key={collaborator.userId._id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Avatar name={collaborator.userId.name} size="sm" />
                          <span className="font-medium">{collaborator.userId.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{collaborator.userId.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getRoleIcon(collaborator.role)}
                          <span>{getRoleBadge(collaborator.role)}</span>
                        </div>
                      </TableCell>
                      {canManageCollaborators && (
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={isLoading}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Collaborator</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {collaborator.userId.name} from this project?
                                  They will no longer have access to this project.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveCollaborator(collaborator.userId._id)}
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {collaborators.length === 0 && (
            <div className="rounded-md border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No collaborators yet. Share this project to collaborate with others.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
