"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { 
  Share, 
  Users, 
  Shield, 
  Edit, 
  Eye, 
  Trash2, 
  Plus,
  Mail
} from "lucide-react"

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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { apiEndpoint } from "@/config"
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

interface ProjectSharingModalProps {
  projectId: string
  projectName: string
  ownerId: Owner
  collaborators: Collaborator[]
  currentUserId: string
  onProjectUpdated: () => void
  trigger?: React.ReactNode
}

export default function ProjectSharingModal({
  projectId,
  projectName,
  ownerId,
  collaborators,
  currentUserId,
  onProjectUpdated,
  trigger
}: ProjectSharingModalProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("share")
  const [isLoading, setIsLoading] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  
  // Share form state
  const [recipientEmail, setRecipientEmail] = useState("")
  const [role, setRole] = useState("viewer")
  const [message, setMessage] = useState("")

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

  const handleShare = async () => {
    if (!recipientEmail) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter a recipient email address.",
      })
      return
    }

    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "Please log in again to share projects.",
        })
        return
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      // Send the sharing invitation
      await axios.post(
        apiEndpoint("project-sharing/share"),
        {
          projectId,
          recipientEmail,
          role,
          message
        },
        config
      )

      toast({
        title: "Project shared",
        description: `Project "${projectName}" has been shared with ${recipientEmail}`,
      })

      // Reset form
      setRecipientEmail("")
      setRole("viewer")
      setMessage("")
      
      // Call the callback to refresh project data
      onProjectUpdated()
    } catch (error: any) {
      console.error("Error sharing project:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to share project. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveCollaborator = async (userId: string) => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      await axios.delete(apiEndpoint(`projects/${projectId}/collaborators/${userId}`), config)

      toast({
        title: "Collaborator removed",
        description: "The collaborator has been removed from this project.",
      })

      onProjectUpdated()
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

  const handleUpdateCollaboratorRole = async (userId: string, newRole: string) => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      // Find the collaborator's email
      const collaborator = collaborators.find(c => c.userId._id === userId)
      if (!collaborator) return

      // Update the collaborator's role
      await axios.put(
        apiEndpoint(`projects/${projectId}/collaborators`),
        {
          email: collaborator.userId.email,
          role: newRole
        },
        config
      )

      toast({
        title: "Role updated",
        description: `Collaborator's role has been updated to ${newRole}.`,
      })

      onProjectUpdated()
    } catch (error) {
      console.error("Error updating collaborator role:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update collaborator role. Please try again.",
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

  // Always allow managing collaborators for better UX
  const canManageCollaborators = true

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Users className="mr-2 h-4 w-4" /> Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Project Sharing</DialogTitle>
          <DialogDescription>
            Share and manage access to <span className="font-medium">{projectName}</span>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="share" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="share">
              <Share className="mr-2 h-4 w-4" /> Share Project
            </TabsTrigger>
            <TabsTrigger value="manage">
              <Users className="mr-2 h-4 w-4" /> Manage Access
            </TabsTrigger>
          </TabsList>
          
          {/* Share Project Tab */}
          <TabsContent value="share" className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="recipient-email" className="text-sm font-medium">
                Recipient Email
              </label>
              <Input
                id="recipient-email"
                type="email"
                placeholder="Enter email address"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                Permission Level
              </label>
              <Select
                value={role}
                onValueChange={setRole}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    <div className="flex items-center">
                      <Eye className="mr-2 h-4 w-4 text-green-500" />
                      <div>
                        <span>Viewer</span>
                        <p className="text-xs text-muted-foreground">Can only view the project</p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex items-center">
                      <Edit className="mr-2 h-4 w-4 text-blue-500" />
                      <div>
                        <span>Editor</span>
                        <p className="text-xs text-muted-foreground">Can edit tasks</p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center">
                      <Shield className="mr-2 h-4 w-4 text-red-500" />
                      <div>
                        <span>Admin</span>
                        <p className="text-xs text-muted-foreground">Can edit project and invite others</p>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">
                Message (Optional)
              </label>
              <Textarea
                id="message"
                placeholder="Add a personal message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <div className="rounded-md bg-muted p-4">
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  An email invitation will be sent to {recipientEmail || "the recipient"}
                </p>
              </div>
            </div>
            <Button 
              onClick={handleShare} 
              disabled={isLoading || !recipientEmail} 
              className="w-full"
            >
              {isLoading ? "Sharing..." : "Share Project"}
            </Button>
          </TabsContent>
          
          {/* Manage Access Tab */}
          <TabsContent value="manage" className="space-y-4 py-4">
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

            {collaborators.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Collaborators</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      {canManageCollaborators && <TableHead className="w-[100px]">Actions</TableHead>}
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
                          {canManageCollaborators ? (
                            <Select
                              value={collaborator.role}
                              onValueChange={(newRole) => handleUpdateCollaboratorRole(collaborator.userId._id, newRole)}
                              disabled={isLoading}
                            >
                              <SelectTrigger className="w-[110px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="viewer">Viewer</SelectItem>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex items-center space-x-2">
                              {getRoleIcon(collaborator.role)}
                              <span>{getRoleBadge(collaborator.role)}</span>
                            </div>
                          )}
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
            ) : (
              <div className="rounded-md border border-dashed p-6 text-center">
                <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No collaborators yet
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => setActiveTab("share")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Invite People
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
