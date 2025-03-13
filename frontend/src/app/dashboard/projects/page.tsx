"use client"

import { useEffect, useState } from "react"
import { Plus, Search, X } from "lucide-react"
import { DragDropContext, Droppable, DropResult } from "react-beautiful-dnd"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useProjectsStore, Project } from "@/lib/store"
import { useUserStore } from "@/lib/userStore"
import ProjectForm, { ProjectFormValues } from "@/components/ProjectForm"
import ProjectCard from "@/components/ProjectCard"
import DraggableProjectCard from "@/components/DraggableProjectCard"

export default function ProjectsPage() {
  const { toast } = useToast()
  const { user } = useUserStore()
  const { 
    projects, 
    activeProjects, 
    archivedProjects, 
    isLoading, 
    fetchProjects, 
    updateProject, 
    createProject, 
    deleteProject, 
    toggleArchiveProject,
    reorderProjects
  } = useProjectsStore()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReordering, setIsReordering] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Load archived projects when component mounts
        await fetchProjects(true)
      } catch (error) {
        console.error("Error initializing data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load projects. Please try again.",
        })
      }
    }
    
    initializeData()
  }, [fetchProjects, toast])
  
  // Filter projects based on search query and selected tag
  const filteredActiveProjects = activeProjects.filter(project => {
    const matchesSearch = searchQuery === "" || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTag = selectedTag === null || project.tags.includes(selectedTag);
    
    return matchesSearch && matchesTag;
  });
  
  const filteredArchivedProjects = archivedProjects.filter(project => {
    const matchesSearch = searchQuery === "" || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTag = selectedTag === null || project.tags.includes(selectedTag);
    
    return matchesSearch && matchesTag;
  });
  
  // Get all unique tags from all projects
  const allTags = Array.from(new Set(
    projects.flatMap(project => project.tags)
  )).sort();
  
  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null); // Deselect if already selected
    } else {
      setSelectedTag(tag); // Select the tag
    }
  };
  
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source } = result
    
    // If dropped outside the list or no movement
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return
    }
    
    // Only handle reordering in the active projects list
    if (source.droppableId !== "active-projects" || 
        destination.droppableId !== "active-projects") {
      return
    }
    
    // Reorder the projects locally
    const reorderedProjects = Array.from(filteredActiveProjects)
    const [removed] = reorderedProjects.splice(source.index, 1)
    reorderedProjects.splice(destination.index, 0, removed)
    
    // Send the new order to the server
    try {
      setIsReordering(true)
      const projectIds = reorderedProjects.map(project => project._id)
      
      const success = await reorderProjects(projectIds)
      
      if (success) {
        toast({
          title: "Projects reordered",
          description: "Your projects have been reordered successfully.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to reorder projects. Please try again.",
        })
        
        // Revert to the original order on error
        fetchProjects(archivedProjects.length > 0)
      }
    } catch (error) {
      console.error("Error reordering projects:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reorder projects. Please try again.",
      })
      
      // Revert to the original order on error
      fetchProjects(archivedProjects.length > 0)
    } finally {
      setIsReordering(false)
    }
  }
  
  const handleArchiveToggle = async (projectId: string, archive: boolean) => {
    try {
      setIsArchiving(true)
      
      const success = await toggleArchiveProject(projectId, archive)
      
      if (success) {
        toast({
          title: archive ? "Project archived" : "Project restored",
          description: archive 
            ? "Your project has been archived successfully." 
            : "Your project has been restored successfully.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to ${archive ? "archive" : "restore"} project. Please try again.`,
        })
      }
    } catch (error) {
      console.error(`Error ${archive ? "archiving" : "restoring"} project:`, error)
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${archive ? "archive" : "restore"} project. Please try again.`,
      })
    } finally {
      setIsArchiving(false)
    }
  }

  const handleCreateProject = async (data: ProjectFormValues) => {
    setIsSubmitting(true)
    try {
      const tagsArray = data.tags 
        ? data.tags.split(",").map(tag => tag.trim()).filter(tag => tag !== "") 
        : []

      const newProject = await createProject({
        name: data.name,
        description: data.description,
        tags: tagsArray
      })

      if (newProject) {
        toast({
          title: "Project created",
          description: "Your project has been created successfully.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create project. Please try again.",
        })
      }
    } catch (error) {
      console.error("Error creating project:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create project. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateProject = async (projectId: string, data: Partial<Project>): Promise<Project | null> => {
    setIsSubmitting(true)
    try {
      const updatedProject = await updateProject(projectId, data)
      
      if (updatedProject) {
        toast({
          title: "Project updated",
          description: "Your project has been updated successfully.",
        })
        return updatedProject
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update project. Please try again.",
        })
        return null
      }
    } catch (error) {
      console.error("Error updating project:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update project. Please try again.",
      })
      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      const success = await deleteProject(projectId)

      if (success) {
        toast({
          title: "Project deleted",
          description: "Your project has been deleted successfully.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete project. Please try again.",
        })
      }
    } catch (error) {
      console.error("Error deleting project:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete project. Please try again.",
      })
    }
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center">Loading projects...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage your projects and tasks</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <ProjectForm
              onSubmit={handleCreateProject}
              isSubmitting={isSubmitting}
              submitLabel="Create Project"
              submittingLabel="Creating..."
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and filter section */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1.5 h-7 w-7"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTag && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedTag(null)}
                className="h-8"
              >
                Clear filter <X className="ml-1 h-3 w-3" />
              </Button>
            )}
            {allTags.map(tag => (
              <Badge
                key={tag}
                className={`cursor-pointer hover:bg-primary/20 ${selectedTag === tag ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {projects.length > 0 ? (
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">
              Active Projects
              <Badge variant="outline" className="ml-2">{filteredActiveProjects.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="archived">
              Archived Projects
              <Badge variant="outline" className="ml-2">{filteredArchivedProjects.length}</Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="mt-6">
            {filteredActiveProjects.length > 0 ? (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="active-projects">
                  {(provided) => (
                    <div 
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="flex flex-col gap-4 min-h-[200px] p-4 border border-dashed border-gray-300 rounded-lg"
                    >
                      {filteredActiveProjects.map((project, index) => (
                        <DraggableProjectCard
                          key={project._id}
                          project={project}
                          index={index}
                          user={user}
                          selectedTag={selectedTag}
                          isArchiving={isArchiving}
                          isSubmitting={isSubmitting}
                          onTagClick={handleTagClick}
                          onArchiveToggle={handleArchiveToggle}
                          onUpdate={handleUpdateProject}
                          onDelete={handleDeleteProject}
                          onProjectUpdated={() => fetchProjects(true)}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
                <h3 className="text-lg font-medium">No active projects found</h3>
                <p className="mt-2 text-muted-foreground">
                  {searchQuery || selectedTag 
                    ? "Try adjusting your search or filter criteria."
                    : "Create your first project to start organizing your tasks."}
                </p>
                {!searchQuery && !selectedTag && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="mt-4">
                        <Plus className="mr-2 h-4 w-4" /> Create Project
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Project</DialogTitle>
                      </DialogHeader>
                      <ProjectForm
                        onSubmit={handleCreateProject}
                        isSubmitting={isSubmitting}
                        submitLabel="Create Project"
                        submittingLabel="Creating..."
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}
          </TabsContent>
          <TabsContent value="archived" className="mt-6">
            {filteredArchivedProjects.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredArchivedProjects.map(project => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    user={user}
                    selectedTag={selectedTag}
                    isArchiving={isArchiving}
                    isSubmitting={isSubmitting}
                    onTagClick={handleTagClick}
                    onArchiveToggle={handleArchiveToggle}
                    onUpdate={handleUpdateProject}
                    onDelete={handleDeleteProject}
                    onProjectUpdated={() => fetchProjects(true)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
                <h3 className="text-lg font-medium">No archived projects found</h3>
                <p className="mt-2 text-muted-foreground">
                  {searchQuery || selectedTag 
                    ? "Try adjusting your search or filter criteria."
                    : "Archived projects will appear here."}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
          <h3 className="text-lg font-medium">No projects yet</h3>
          <p className="mt-2 text-muted-foreground">
            Create your first project to start organizing your tasks.
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Create Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <ProjectForm
                onSubmit={handleCreateProject}
                isSubmitting={isSubmitting}
                submitLabel="Create Project"
                submittingLabel="Creating..."
              />
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
}
