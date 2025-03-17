"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { Check, X, Users, Clock, CheckCircle, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiEndpoint } from "@/config";

interface SharedProject {
  _id: string
  projectId: {
    _id: string
    name: string
    description?: string
    tags: string[]
    isArchived: boolean
  }
  ownerId: {
    _id: string
    name: string
    email: string
  }
  recipientEmail: string
  recipientId?: {
    _id: string
    name: string
    email: string
  }
  status: string
  message: string
  createdAt: string
  updatedAt: string
}

export default function SharedProjectsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [sharedWithMe, setSharedWithMe] = useState<SharedProject[]>([])
  const [sharedByMe, setSharedByMe] = useState<SharedProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true)
      try {
        await fetchSharedProjects()
      } catch (error) {
        console.error("Error initializing data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load data. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    initializeData()
  }, [])

  const fetchSharedProjects = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      // Fetch projects shared with me
      const sharedWithMeResponse = await axios.get(
        apiEndpoint("project-sharing/shared-with-me"), 
        config
      )
      setSharedWithMe(sharedWithMeResponse.data)

      // Fetch projects shared by me
      const sharedByMeResponse = await axios.get(
        apiEndpoint("project-sharing/shared-by-me"), 
        config
      )
      setSharedByMe(sharedByMeResponse.data)
    } catch (error) {
      console.error("Error fetching shared projects:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load shared projects. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccept = async (sharedProjectId: string) => {
    setIsProcessing(prev => ({ ...prev, [sharedProjectId]: true }))
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      const response = await axios.put(
        apiEndpoint(`project-sharing/accept/${sharedProjectId}`),
        {},
        config
      )

      toast({
        title: "Project accepted",
        description: "The project has been added to your projects.",
      })

      // Update the local state
      setSharedWithMe(prev => 
        prev.map(project => 
          project._id === sharedProjectId 
            ? { ...project, status: 'accepted' } 
            : project
        )
      )

      // Navigate to the new project
      if (response.data.project?._id) {
        router.push(`/dashboard/projects/${response.data.project._id}`)
      }
    } catch (error) {
      console.error("Error accepting project:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to accept project. Please try again.",
      })
    } finally {
      setIsProcessing(prev => ({ ...prev, [sharedProjectId]: false }))
    }
  }

  const handleReject = async (sharedProjectId: string) => {
    setIsProcessing(prev => ({ ...prev, [sharedProjectId]: true }))
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      await axios.put(
        apiEndpoint(`project-sharing/reject/${sharedProjectId}`),
        {},
        config
      )

      toast({
        title: "Project rejected",
        description: "The project invitation has been rejected.",
      })

      // Update the local state
      setSharedWithMe(prev => 
        prev.map(project => 
          project._id === sharedProjectId 
            ? { ...project, status: 'rejected' } 
            : project
        )
      )
    } catch (error) {
      console.error("Error rejecting project:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject project. Please try again.",
      })
    } finally {
      setIsProcessing(prev => ({ ...prev, [sharedProjectId]: false }))
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pending</Badge>
      case "accepted":
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Accepted</Badge>
      case "rejected":
        return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Rejected</Badge>
      case "revoked":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">Revoked</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center">Loading shared projects...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Shared Projects</h1>
        <p className="text-muted-foreground">Manage projects shared with you and by you</p>
      </div>

      <Tabs defaultValue="shared-with-me">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shared-with-me">
            Shared With Me
            <Badge variant="outline" className="ml-2">{sharedWithMe.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="shared-by-me">
            Shared By Me
            <Badge variant="outline" className="ml-2">{sharedByMe.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shared-with-me" className="mt-6">
          {sharedWithMe.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sharedWithMe.map((project) => (
                <Card key={project._id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="truncate">
                        {project.projectId ? project.projectId.name : 'Unknown Project'}
                      </CardTitle>
                      {getStatusBadge(project.status)}
                    </div>
                    <CardDescription>
                      Shared by {project.ownerId.name} ({project.ownerId.email})
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {project.projectId?.description && (
                        <p className="text-sm text-muted-foreground">{project.projectId.description}</p>
                      )}
                      {project.message && (
                        <div className="mt-2 rounded-md bg-muted p-3">
                          <p className="text-sm italic">"{project.message}"</p>
                        </div>
                      )}
                      {project.projectId?.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.projectId.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Shared on {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                  {project.status === "pending" && (
                    <CardFooter className="flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(project._id)}
                        disabled={isProcessing[project._id]}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAccept(project._id)}
                        disabled={isProcessing[project._id]}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Accept
                      </Button>
                    </CardFooter>
                  )}
                  {project.status === "accepted" && (
                    <CardFooter>
                      <Button
                        className="w-full"
                      onClick={() => project.projectId ? router.push(`/dashboard/projects/${project.projectId._id}`) : null}
                      >
                        View Project
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No projects shared with you</h3>
              <p className="mt-2 text-muted-foreground">
                When someone shares a project with you, it will appear here.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="shared-by-me" className="mt-6">
          {sharedByMe.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sharedByMe.map((project) => (
                <Card key={project._id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="truncate">
                        {project.projectId ? project.projectId.name : 'Unknown Project'}
                      </CardTitle>
                      {getStatusBadge(project.status)}
                    </div>
                    <CardDescription>
                      Shared with {project.recipientId?.name || project.recipientEmail}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {project.projectId?.description && (
                        <p className="text-sm text-muted-foreground">{project.projectId.description}</p>
                      )}
                      {project.message && (
                        <div className="mt-2 rounded-md bg-muted p-3">
                          <p className="text-sm italic">"{project.message}"</p>
                        </div>
                      )}
                      <div className="flex items-center mt-2">
                        {project.status === "pending" && (
                          <>
                            <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className="text-sm text-muted-foreground">Waiting for response</span>
                          </>
                        )}
                        {project.status === "accepted" && (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-sm text-muted-foreground">Accepted on {new Date(project.updatedAt).toLocaleDateString()}</span>
                          </>
                        )}
                        {project.status === "rejected" && (
                          <>
                            <XCircle className="h-4 w-4 text-red-500 mr-1" />
                            <span className="text-sm text-muted-foreground">Rejected on {new Date(project.updatedAt).toLocaleDateString()}</span>
                          </>
                        )}
                        {project.status === "revoked" && (
                          <>
                            <XCircle className="h-4 w-4 text-purple-500 mr-1" />
                            <span className="text-sm text-muted-foreground">Access revoked on {new Date(project.updatedAt).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Shared on {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => project.projectId ? router.push(`/dashboard/projects/${project.projectId._id}`) : null}
                    >
                      View Original Project
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No projects shared by you</h3>
              <p className="mt-2 text-muted-foreground">
                When you share a project with someone, it will appear here.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
