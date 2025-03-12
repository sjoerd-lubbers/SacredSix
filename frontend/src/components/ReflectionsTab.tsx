"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import axios from "axios"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { z } from "zod"

// Import our custom components
import { ReflectionCard } from "./reflection/ReflectionCard"
import { ReflectionDetailDialog } from "./reflection/ReflectionDetailDialog"
import { ReflectionEditDialog } from "./reflection/ReflectionEditDialog"
import { NewReflectionDialog } from "./reflection/NewReflectionDialog"

interface Reflection {
  _id: string
  content?: string
  type: 'daily' | 'weekly'
  questionAnswers?: {
    question: string;
    answer: string;
  }[];
  isStructured?: boolean;
  aiAnalysis?: string
  aiSuggestions?: string[]
  createdAt: string
  updatedAt: string
}

// Update the schema to include questionAnswers
const reflectionSchema = z.object({
  content: z.string().optional(),
  type: z.enum(["daily", "weekly"]),
  questionAnswers: z.array(
    z.object({
      question: z.string(),
      answer: z.string()
    })
  ).optional()
})

type ReflectionFormValues = z.infer<typeof reflectionSchema>

export default function ReflectionsTab() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingReflection, setEditingReflection] = useState<Reflection | null>(null)
  const [selectedReflection, setSelectedReflection] = useState<Reflection | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    fetchReflections()
    
    // Check for query parameters to open the new reflection dialog
    const newParam = searchParams.get('new')
    if (newParam === 'daily' || newParam === 'weekly') {
      setIsNewDialogOpen(true)
    }
  }, [searchParams])

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

      console.log("Creating reflection with data:", data);

      const response = await axios.post(
        "http://localhost:5000/api/reflections", 
        data, 
        config
      )

      setReflections(prev => [response.data, ...prev])

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

    console.log("Updating reflection with data:", data);
    console.log("Original reflection:", editingReflection);

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      // Make sure we're sending the complete data
      const updateData = {
        type: data.type,
        questionAnswers: data.questionAnswers
      };
      
      console.log("Sending update data to server:", updateData);

      const response = await axios.put(
        `http://localhost:5000/api/reflections/${editingReflection._id}`, 
        updateData, 
        config
      )

      console.log("Server response:", response.data);

      // Update the reflections state with the updated reflection
      setReflections(prev => 
        prev.map(reflection => 
          reflection._id === editingReflection._id ? response.data : reflection
        )
      )
      
      // If this reflection is currently selected, update it too
      if (selectedReflection && selectedReflection._id === editingReflection._id) {
        setSelectedReflection(response.data);
      }
      
      setEditingReflection(null)
      setIsEditDialogOpen(false)

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

      // Send the reflection ID to the AI analyzer
      const requestData = {
        reflectionId: reflection._id
      };
      
      console.log("Sending reflection for analysis:", requestData);

      const response = await axios.post(
        "http://localhost:5000/api/ai/analyze-reflection", 
        requestData, 
        config
      )

      // Update the reflection with AI analysis
      const updatedReflection = response.data.reflection;
      
      setReflections(prev => 
        prev.map(r => 
          r._id === reflection._id ? updatedReflection : r
        )
      )

      // Update the selected reflection to show the analysis
      setSelectedReflection(updatedReflection)

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

  const handleViewReflection = (reflection: Reflection) => {
    setSelectedReflection(reflection);
    setIsDetailDialogOpen(true);
  };

  const handleEditReflection = (reflection: Reflection) => {
    setEditingReflection(reflection);
    setIsEditDialogOpen(true);
  };

  const renderEmptyState = (type?: 'daily' | 'weekly') => (
    <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
      <h3 className="text-lg font-medium">
        {type 
          ? `No ${type} reflections yet` 
          : "No reflections yet"}
      </h3>
      <p className="mt-2 text-muted-foreground">
        {type === 'daily'
          ? "Daily reflections help you track your progress and identify patterns."
          : type === 'weekly'
          ? "Weekly reflections help you see the bigger picture and plan for improvement."
          : "Start recording your thoughts and insights to track your productivity journey."}
      </p>
      <Button 
        className="mt-4"
        onClick={() => {
          setIsNewDialogOpen(true);
        }}
      >
        <Plus className="mr-2 h-4 w-4" /> 
        {type ? `Create ${type.charAt(0).toUpperCase() + type.slice(1)} Reflection` : "Create Reflection"}
      </Button>
    </div>
  );

  if (isLoading) {
    return <div className="flex h-full items-center justify-center">Loading reflections...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Reflections</h2>
          <p className="text-muted-foreground">Record and analyze your productivity journey</p>
        </div>
        <Button onClick={() => setIsNewDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Reflection
        </Button>
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
              {reflections.map(reflection => (
                <ReflectionCard
                  key={reflection._id}
                  reflection={reflection}
                  onView={handleViewReflection}
                  onEdit={handleEditReflection}
                  onDelete={onDeleteReflection}
                />
              ))}
            </div>
          ) : renderEmptyState()}
        </TabsContent>
        
        <TabsContent value="daily" className="mt-6">
          {reflections.filter(r => r.type === 'daily').length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reflections
                .filter(reflection => reflection.type === 'daily')
                .map(reflection => (
                  <ReflectionCard
                    key={reflection._id}
                    reflection={reflection}
                    onView={handleViewReflection}
                    onEdit={handleEditReflection}
                    onDelete={onDeleteReflection}
                  />
                ))}
            </div>
          ) : renderEmptyState('daily')}
        </TabsContent>
        
        <TabsContent value="weekly" className="mt-6">
          {reflections.filter(r => r.type === 'weekly').length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reflections
                .filter(reflection => reflection.type === 'weekly')
                .map(reflection => (
                  <ReflectionCard
                    key={reflection._id}
                    reflection={reflection}
                    onView={handleViewReflection}
                    onEdit={handleEditReflection}
                    onDelete={onDeleteReflection}
                  />
                ))}
            </div>
          ) : renderEmptyState('weekly')}
        </TabsContent>
      </Tabs>

      {/* New Reflection Dialog */}
      <NewReflectionDialog
        isOpen={isNewDialogOpen}
        onOpenChange={setIsNewDialogOpen}
        onCreate={onCreateReflection}
        isSubmitting={isSubmitting}
      />

      {/* View Reflection Dialog */}
      <ReflectionDetailDialog
        reflection={selectedReflection}
        isOpen={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        onEdit={handleEditReflection}
        isAnalyzing={isAnalyzing}
        onAnalyze={analyzeReflection}
      />

      {/* Edit Reflection Dialog */}
      <ReflectionEditDialog
        reflection={editingReflection}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onUpdate={onUpdateReflection}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
