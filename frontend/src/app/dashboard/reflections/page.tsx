"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import axios from "axios"
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

interface Reflection {
  _id: string
  content: string
  type: 'daily' | 'weekly'
  aiAnalysis?: string
  aiSuggestions?: string[]
  createdAt: string
  updatedAt: string
}

const reflectionSchema = z.object({
  content: z.string().min(1, "Reflection content is required"),
  type: z.enum(["daily", "weekly"]),
})

type ReflectionFormValues = z.infer<typeof reflectionSchema>

export default function ReflectionsPage() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingReflection, setEditingReflection] = useState<Reflection | null>(null)
  const [selectedReflection, setSelectedReflection] = useState<Reflection | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)

  const newReflectionForm = useForm<ReflectionFormValues>({
    resolver: zodResolver(reflectionSchema),
    defaultValues: {
      content: "",
      type: "daily",
    },
  })

  const editReflectionForm = useForm<ReflectionFormValues>({
    resolver: zodResolver(reflectionSchema),
    defaultValues: {
      content: "",
      type: "daily",
    },
  })

  useEffect(() => {
    fetchReflections()
    
    // Check for query parameters to open the new reflection dialog
    const newParam = searchParams.get('new')
    if (newParam === 'daily' || newParam === 'weekly') {
      setIsNewDialogOpen(true)
      newReflectionForm.reset({
        content: "",
        type: newParam
      })
    }
  }, [searchParams, newReflectionForm])

  useEffect(() => {
    if (editingReflection) {
      editReflectionForm.reset({
        content: editingReflection.content,
        type: editingReflection.type,
      })
    }
  }, [editingReflection, editReflectionForm])

  const fetchReflections = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      const response = await axios.get("http://localhost:5000/api/reflections", config)
      setReflections(response.data)
    } catch (error) {
      console.error("Error fetching reflections:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load reflections. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onCreateReflection = async (data: ReflectionFormValues) => {
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      const response = await axios.post(
        "http://localhost:5000/api/reflections", 
        data, 
        config
      )

      setReflections(prev => [response.data, ...prev])
      
      newReflectionForm.reset({
        content: "",
        type: "daily",
      })

      toast({
        title: "Reflection created",
        description: "Your reflection has been saved successfully.",
      })
      
      // Close the dialog
      setIsNewDialogOpen(false)
    } catch (error) {
      console.error("Error creating reflection:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create reflection. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const onUpdateReflection = async (data: ReflectionFormValues) => {
    if (!editingReflection) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      const response = await axios.put(
        `http://localhost:5000/api/reflections/${editingReflection._id}`, 
        data, 
        config
      )

      setReflections(prev => 
        prev.map(reflection => 
          reflection._id === editingReflection._id ? response.data : reflection
        )
      )
      
      setEditingReflection(null)

      toast({
        title: "Reflection updated",
        description: "Your reflection has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating reflection:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update reflection. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const onDeleteReflection = async (reflectionId: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      await axios.delete(`http://localhost:5000/api/reflections/${reflectionId}`, config)

      setReflections(prev => prev.filter(reflection => reflection._id !== reflectionId))

      toast({
        title: "Reflection deleted",
        description: "Your reflection has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting reflection:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete reflection. Please try again.",
      })
    }
  }

  const analyzeReflection = async (reflection: Reflection) => {
    setIsAnalyzing(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      const response = await axios.post(
        "http://localhost:5000/api/ai/analyze-reflection", 
        {
          content: reflection.content,
          type: reflection.type
        }, 
        config
      )

      // Update the reflection with AI analysis
      setReflections(prev => 
        prev.map(r => 
          r._id === reflection._id ? response.data.reflection : r
        )
      )

      // Set the selected reflection to show the analysis
      setSelectedReflection(response.data.reflection)

      toast({
        title: "Analysis complete",
        description: "AI has analyzed your reflection.",
      })
    } catch (error) {
      console.error("Error analyzing reflection:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to analyze reflection. Please try again.",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "PPP")
  }

  const renderReflectionCard = (reflection: Reflection) => (
    <Card key={reflection._id} className="flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant={reflection.type === 'daily' ? 'default' : 'secondary'}>
            {reflection.type === 'daily' ? 'Daily' : 'Weekly'}
          </Badge>
          <div className="text-xs text-muted-foreground">
            {formatDate(reflection.createdAt)}
          </div>
        </div>
        <CardTitle className="mt-2 line-clamp-1">
          {reflection.content ? reflection.content.split('\n')[0] : 
           reflection.questionAnswers && reflection.questionAnswers.length > 0 ? 
           reflection.questionAnswers[0].question : "Reflection"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {reflection.content}
        </p>
        {reflection.aiAnalysis && (
          <div className="mt-2">
            <Badge variant="outline" className="bg-primary/10">AI Analyzed</Badge>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setSelectedReflection(reflection)}
        >
          <BookOpen className="mr-2 h-4 w-4" /> View
        </Button>
        <div className="space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditingReflection(reflection)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Reflection</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this reflection? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDeleteReflection(reflection._id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  )

  const renderNewReflectionForm = (defaultType = "daily") => (
    <Form {...newReflectionForm}>
      <form onSubmit={newReflectionForm.handleSubmit(onCreateReflection)} className="space-y-4">
        <FormField
          control={newReflectionForm.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reflection Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={defaultType}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={newReflectionForm.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reflection</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="What went well today? What could be improved? What did you learn?" 
                  className="min-h-[200px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Reflection"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )

  if (isLoading) {
    return <div className="flex h-full items-center justify-center">Loading reflections...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Reflections</h1>
          <p className="text-muted-foreground">Record and analyze your productivity journey</p>
        </div>
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Reflection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Reflection</DialogTitle>
            </DialogHeader>
            {renderNewReflectionForm(newReflectionForm.getValues().type)}
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Reflections</TabsTrigger>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {reflections.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reflections.map(reflection => renderReflectionCard(reflection))}
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
              <h3 className="text-lg font-medium">No reflections yet</h3>
              <p className="mt-2 text-muted-foreground">
                Start recording your thoughts and insights to track your productivity journey.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" /> Create Reflection
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Reflection</DialogTitle>
                  </DialogHeader>
                  {renderNewReflectionForm()}
                </DialogContent>
              </Dialog>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="daily" className="mt-6">
          {reflections.filter(r => r.type === 'daily').length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reflections
                .filter(reflection => reflection.type === 'daily')
                .map(reflection => renderReflectionCard(reflection))}
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
              <h3 className="text-lg font-medium">No daily reflections yet</h3>
              <p className="mt-2 text-muted-foreground">
                Daily reflections help you track your progress and identify patterns.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" /> Create Daily Reflection
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Reflection</DialogTitle>
                  </DialogHeader>
                  {renderNewReflectionForm("daily")}
                </DialogContent>
              </Dialog>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="weekly" className="mt-6">
          {reflections.filter(r => r.type === 'weekly').length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reflections
                .filter(reflection => reflection.type === 'weekly')
                .map(reflection => renderReflectionCard(reflection))}
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
              <h3 className="text-lg font-medium">No weekly reflections yet</h3>
              <p className="mt-2 text-muted-foreground">
                Weekly reflections help you see the bigger picture and plan for improvement.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" /> Create Weekly Reflection
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Reflection</DialogTitle>
                  </DialogHeader>
                  {renderNewReflectionForm("weekly")}
                </DialogContent>
              </Dialog>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Reflection Dialog */}
      {editingReflection && (
        <Dialog open={!!editingReflection} onOpenChange={(open) => !open && setEditingReflection(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Reflection</DialogTitle>
            </DialogHeader>
            <Form {...editReflectionForm}>
              <form onSubmit={editReflectionForm.handleSubmit(onUpdateReflection)} className="space-y-4">
                <FormField
                  control={editReflectionForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reflection Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editReflectionForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reflection</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="What went well? What could be improved? What did you learn?" 
                          className="min-h-[200px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditingReflection(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Updating..." : "Update Reflection"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* View Reflection Dialog */}
      {selectedReflection && (
        <Dialog open={!!selectedReflection} onOpenChange={(open) => !open && setSelectedReflection(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <Badge variant={selectedReflection.type === 'daily' ? 'default' : 'secondary'}>
                  {selectedReflection.type === 'daily' ? 'Daily' : 'Weekly'} Reflection
                </Badge>
                <div className="text-sm text-muted-foreground">
                  {formatDate(selectedReflection.createdAt)}
                </div>
              </div>
              <DialogTitle className="mt-2">
                {selectedReflection.content.split('\n')[0]}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div>
                <h4 className="mb-2 font-medium">Reflection</h4>
                <div className="rounded-md bg-muted p-4">
                  <p className="whitespace-pre-wrap text-sm">
                    {selectedReflection.content}
                  </p>
                </div>
              </div>
              
              {selectedReflection.aiAnalysis ? (
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">AI Analysis</h4>
                    <Badge variant="outline" className="bg-primary/10">AI Insights</Badge>
                  </div>
                  <div className="mt-2 rounded-md bg-muted p-4">
                    <p className="whitespace-pre-wrap text-sm">
                      {selectedReflection.aiAnalysis}
                    </p>
                  </div>
                  
                  {selectedReflection.aiSuggestions && selectedReflection.aiSuggestions.length > 0 && (
                    <div className="mt-4">
                      <h4 className="mb-2 font-medium">Suggestions</h4>
                      <ul className="space-y-2">
                        {selectedReflection.aiSuggestions.map((suggestion, index) => (
                          <li key={index} className="rounded-md bg-muted p-3 text-sm">
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-md border border-dashed p-6 text-center">
                  <h4 className="mb-2 font-medium">Get AI Insights</h4>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Let AI analyze your reflection to provide insights and suggestions.
                  </p>
                  <Button 
                    onClick={() => analyzeReflection(selectedReflection)} 
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? "Analyzing..." : "Analyze with AI"}
                  </Button>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedReflection(null)}>
                Close
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingReflection(selectedReflection);
                  setSelectedReflection(null);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
