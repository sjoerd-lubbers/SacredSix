"use client"

import { useState, useEffect } from "react"
import { Key, Plus, Trash2, Copy, AlertTriangle } from "lucide-react"
import { useApiKeyStore, ApiKey } from "@/lib/apiKeyStore"
import { useProjectsStore } from "@/lib/store"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { apiEndpoint } from "@/config";

const apiKeyFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  projectId: z.string().min(1, {
    message: "Project is required.",
  }),
})

type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>

export default function ApiKeysTab() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [newApiKey, setNewApiKey] = useState<ApiKey | null>(null)
  
  const { apiKeys, fetchApiKeys, createApiKey, deactivateApiKey, deleteApiKey } = useApiKeyStore()
  const { activeProjects, fetchProjects } = useProjectsStore()
  
  const apiKeyForm = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeyFormSchema),
    defaultValues: {
      name: "",
      projectId: "",
    },
  })
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await fetchProjects()
      await fetchApiKeys()
      setIsLoading(false)
    }
    
    loadData()
  }, [fetchProjects, fetchApiKeys])
  
  const onCreateApiKey = async (data: ApiKeyFormValues) => {
    setIsSaving(true)
    try {
      // Find the project name from the activeProjects list
      const project = activeProjects.find(p => p._id === data.projectId)
      const projectName = project ? project.name : undefined
      
      // Pass the project name to createApiKey
      const newKey = await createApiKey(data.name, data.projectId, projectName)
      
      if (newKey) {
        setNewApiKey(newKey)
        apiKeyForm.reset({
          name: "",
          projectId: "",
        })
        
        toast({
          title: "API key created",
          description: "Your API key has been created successfully. Copy it now as it won't be shown again.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create API key. Please try again.",
        })
      }
    } catch (error) {
      console.error("Error creating API key:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create API key. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleCopyApiKey = () => {
    if (newApiKey?.key) {
      navigator.clipboard.writeText(newApiKey.key)
      toast({
        title: "API key copied",
        description: "The API key has been copied to your clipboard.",
      })
    }
  }
  
  const handleDeactivateApiKey = async (apiKeyId: string) => {
    try {
      const success = await deactivateApiKey(apiKeyId)
      
      if (success) {
        toast({
          title: "API key deactivated",
          description: "Your API key has been deactivated successfully.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to deactivate API key. Please try again.",
        })
      }
    } catch (error) {
      console.error("Error deactivating API key:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to deactivate API key. Please try again.",
      })
    }
  }
  
  const handleDeleteApiKey = async (apiKeyId: string) => {
    try {
      const success = await deleteApiKey(apiKeyId)
      
      if (success) {
        toast({
          title: "API key deleted",
          description: "Your API key has been deleted successfully.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete API key. Please try again.",
        })
      }
    } catch (error) {
      console.error("Error deleting API key:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete API key. Please try again.",
      })
    }
  }
  
  if (isLoading) {
    return <div className="flex h-full items-center justify-center">Loading API keys...</div>
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Key className="h-5 w-5 mr-2 text-purple-500" />
          API Keys
        </CardTitle>
        <CardDescription>
          Create and manage API keys for external applications like Magic Mirror.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Your API Keys</h3>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New API Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New API Key</DialogTitle>
                <DialogDescription>
                  Create an API key to allow external applications to access your tasks.
                </DialogDescription>
              </DialogHeader>
              <Form {...apiKeyForm}>
                  <form onSubmit={apiKeyForm.handleSubmit((data) => {
                    // Find the project name from the activeProjects list
                    const project = activeProjects.find(p => p._id === data.projectId)
                    const projectName = project ? project.name : undefined
                    
                    // Call the onCreateApiKey function with the data
                    onCreateApiKey(data);
                  })} className="space-y-4">
                  <FormField
                    control={apiKeyForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key Name</FormLabel>
                        <FormDescription>
                          Give your API key a descriptive name to identify its purpose.
                        </FormDescription>
                        <FormControl>
                          <Input placeholder="e.g., Magic Mirror" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={apiKeyForm.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project</FormLabel>
                        <FormDescription>
                          Select which project's tasks this API key can access.
                        </FormDescription>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {activeProjects.map((project) => (
                              <SelectItem key={project._id} value={project._id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? "Creating..." : "Create API Key"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        {newApiKey && newApiKey.key && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 mr-2" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-400">New API Key Created</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 mb-2">
                  Copy this key now. You won't be able to see it again!
                </p>
                <div className="flex items-center mt-2">
                  <code className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded font-mono text-sm break-all">
                    {newApiKey.key}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    onClick={handleCopyApiKey}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {apiKeys.length > 0 ? (
          <div className="border rounded-md">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left font-medium">Name</th>
                  <th className="px-4 py-2 text-left font-medium">Project</th>
                  <th className="px-4 py-2 text-left font-medium">Created</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                  <th className="px-4 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((apiKey) => (
                  <tr key={apiKey._id} className="border-b">
                    <td className="px-4 py-2">{apiKey.name}</td>
                    <td className="px-4 py-2">{apiKey.projectName}</td>
                    <td className="px-4 py-2">{new Date(apiKey.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        apiKey.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                      }`}>
                        {apiKey.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      {apiKey.isActive ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeactivateApiKey(apiKey._id)}
                          className="mr-2"
                        >
                          Deactivate
                        </Button>
                      ) : null}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this API key? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteApiKey(apiKey._id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 border rounded-md">
            <Key className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-lg font-medium">No API keys yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create your first API key to allow external applications to access your tasks.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" /> Create API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New API Key</DialogTitle>
                  <DialogDescription>
                    Create an API key to allow external applications to access your tasks.
                  </DialogDescription>
                </DialogHeader>
                <Form {...apiKeyForm}>
                  <form onSubmit={apiKeyForm.handleSubmit((data) => {
                    // Find the project name from the activeProjects list
                    const project = activeProjects.find(p => p._id === data.projectId)
                    const projectName = project ? project.name : undefined
                    
                    // Call the onCreateApiKey function with the data
                    onCreateApiKey(data);
                  })} className="space-y-4">
                    <FormField
                      control={apiKeyForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Key Name</FormLabel>
                          <FormDescription>
                            Give your API key a descriptive name to identify its purpose.
                          </FormDescription>
                          <FormControl>
                            <Input placeholder="e.g., Magic Mirror" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={apiKeyForm.control}
                      name="projectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project</FormLabel>
                          <FormDescription>
                            Select which project's tasks this API key can access.
                          </FormDescription>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a project" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {activeProjects.map((project) => (
                                <SelectItem key={project._id} value={project._id}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? "Creating..." : "Create API Key"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        )}
        
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-medium">API Usage Instructions</h3>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Use your API key to access your tasks from external applications like Magic Mirror.
            </p>
            <div className="space-y-2">
              <h4 className="font-medium">Endpoints:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><code className="bg-muted px-1 py-0.5 rounded">GET /api/api-keys/tasks</code> - Get all incomplete tasks for the project</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">GET /api/api-keys/today-tasks</code> - Get today's Sacred Six tasks</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Authentication:</h4>
              <p className="text-sm text-muted-foreground">
                Include your API key in the request header: <code className="bg-muted px-1 py-0.5 rounded">X-API-Key: your-api-key</code>
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Example:</h4>
              <pre className="bg-muted p-2 rounded-md text-xs overflow-x-auto">
                {`fetch(apiEndpoint("api-keys/today-tasks"), {
  headers: {
    'X-API-Key': 'your-api-key-here'
  }
})
.then(response => response.json())
.then(tasks => {
  // Display tasks in your Magic Mirror module
});`}
              </pre>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
