"use client"

import { useEffect, useState } from "react"
import { Plus, Search, X, ArrowUp, ArrowDown, Pencil, Trash2, Archive, Users, Share, Flame } from "lucide-react"

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
import { useProjectsStore, Project } from "@/lib/store"
import { useUserStore } from "@/lib/userStore"
import ProjectForm, { ProjectFormValues } from "@/components/ProjectForm"
import ProjectCard from "@/components/ProjectCard"
import ProjectSharingModal from "@/components/ProjectSharingModal"

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
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [sacredProjectsCount, setSacredProjectsCount] = useState<number>(0)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

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
  
  // Count sacred projects when the create or edit dialog is opened
  useEffect(() => {
    if (isCreateDialogOpen || isEditDialogOpen) {
      // Count sacred projects excluding the currently edited project if it's sacred
      const count = activeProjects.filter(project => 
        project.isSacred && (!editingProject || project._id !== editingProject._id)
      ).length
      setSacredProjectsCount(count)
    }
  }, [isCreateDialogOpen, isEditDialogOpen, activeProjects, editingProject])
  
  // Filter projects based on search query and selected tag
  const filteredActiveProjects = activeProjects.filter(project => {
    // Ensure project has all required properties
    if (!project || !project.name) {
      return false;
    }
    
    const matchesSearch = searchQuery === "" || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTag = selectedTag === null || (project.tags && project.tags.includes(selectedTag));
    
    return matchesSearch && matchesTag;
  });
  
  const filteredArchivedProjects = archivedProjects.filter(project => {
    // Ensure project has all required properties
    if (!project || !project.name) {
      return false;
    }
    
    const matchesSearch = searchQuery === "" || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTag = selectedTag === null || (project.tags && project.tags.includes(selectedTag));
    
    return matchesSearch && matchesTag;
  });
  
  // Get all unique tags from all projects
  const allTags = Array.from(new Set(
    projects
      .filter(project => project && project.tags) // Filter out projects with missing tags
      .flatMap(project => project.tags)
  )).sort();
  
  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null); // Deselect if already selected
    } else {
      setSelectedTag(tag); // Select the tag
    }
  };
  
  const handleMoveProject = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === filteredActiveProjects.length - 1)
    ) {
      return; // Can't move further in this direction
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Create a copy of the projects array
    const reorderedProjects = [...filteredActiveProjects];
    
    // Swap the projects
    [reorderedProjects[index], reorderedProjects[newIndex]] = 
      [reorderedProjects[newIndex], reorderedProjects[index]];
    
    // Send the new order to the server
    try {
      setIsReordering(true);
      const projectIds = reorderedProjects.map(project => project._id);
      
      const success = await reorderProjects(projectIds);
      
      if (success) {
        toast({
          title: "Projects reordered",
          description: "Your projects have been reordered successfully.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to reorder projects. Please try again.",
        });
        
        // Revert to the original order on error
        fetchProjects(archivedProjects.length > 0);
      }
    } catch (error) {
      console.error("Error reordering projects:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reorder projects. Please try again.",
      });
      
      // Revert to the original order on error
      fetchProjects(archivedProjects.length > 0);
    } finally {
      setIsReordering(false);
    }
  };
  
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
        tags: tagsArray,
        isSacred: data.isSacred
      })

      if (newProject) {
        toast({
          title: "Project created",
          description: "Your project has been created successfully.",
        })
        setIsCreateDialogOpen(false);
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

  const handleUpdateProject = async (data: ProjectFormValues) => {
    if (!editingProject) return;
    
    setIsSubmitting(true);
    try {
      const tagsArray = data.tags 
        ? data.tags.split(",").map(tag => tag.trim()).filter(tag => tag !== "") 
        : [];

      const updatedProject = await updateProject(
        editingProject._id, 
        {
          name: data.name,
          description: data.description,
          tags: tagsArray,
          isSacred: data.isSacred
        }
      );
      
      if (updatedProject) {
        toast({
          title: "Project updated",
          description: "Your project has been updated successfully.",
        });
        setEditingProject(null);
        setIsEditDialogOpen(false);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update project. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update project. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
              disableSacredCheckbox={sacredProjectsCount >= 6}
              disabledSacredMessage="Maximum of 6 sacred projects reached"
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
                  className={`cursor-pointer ${selectedTag === tag ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}
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
              <div className="flex flex-col gap-4 min-h-[200px] p-4 border border-dashed border-gray-300 rounded-lg">
                {filteredActiveProjects.map((project, index) => (
                  <div key={project._id} className="flex w-full">
                    {/* Number and Controls Section */}
                    <div className="flex-none rounded-l-lg border-t border-l border-b bg-card p-4 shadow-sm flex flex-col items-center justify-center min-w-[80px]">
                      <div className={`text-xl font-bold text-center w-8 h-8 rounded-full flex items-center justify-center ${project.isSacred ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400 dark:ring-amber-500' : 'bg-muted'}`}>
                        {index + 1}
                      </div>
                      <div className="flex space-x-1 mt-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => handleMoveProject(index, 'up')}
                          disabled={index === 0 || isReordering}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => handleMoveProject(index, 'down')}
                          disabled={index === filteredActiveProjects.length - 1 || isReordering}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Project Details Section */}
                    <div className="flex-1 rounded-r-lg border-t border-r border-b bg-card p-4 shadow-sm">
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <h3 className="font-medium">{project.name}</h3>
                            {project.collaborators && project.collaborators.length > 0 && (
                              <Badge variant="outline" className="ml-2 flex items-center gap-1" title="Shared with others">
                                <Users className="h-3 w-3" />
                                {project.collaborators.length}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleArchiveToggle(project._id, true)}
                              disabled={isArchiving}
                              title="Archive project"
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                            <Dialog onOpenChange={(open) => {
                              if (open) {
                                setEditingProject(project);
                                // Count sacred projects excluding the currently edited project if it's sacred
                                const count = activeProjects.filter(p => 
                                  p.isSacred && p._id !== project._id
                                ).length;
                                setSacredProjectsCount(count);
                              }
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Project</DialogTitle>
                                </DialogHeader>
                                <ProjectForm
                                  defaultValues={{
                                    name: project.name,
                                    description: project.description || "",
                                    tags: project.tags?.join(", ") || "",
                                    isSacred: project.isSacred || false,
                                  }}
                                  onSubmit={handleUpdateProject}
                                  isSubmitting={isSubmitting}
                                  submitLabel="Update Project"
                                  submittingLabel="Updating..."
                                  disableSacredCheckbox={sacredProjectsCount >= 6 && !project.isSacred}
                                  disabledSacredMessage="Maximum of 6 sacred projects reached"
                                />
                              </DialogContent>
                            </Dialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Project</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this project? This action cannot be undone.
                                    All tasks associated with this project will also be deleted.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteProject(project._id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        
                        {project.description && (
                          <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
                        )}
                        
                        {project.tags && project.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {project.tags.map((tag, tagIndex) => (
                              <Badge
                                key={tagIndex}
                                className={`cursor-pointer hover:bg-primary/20 ${selectedTag === tag ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}
                                onClick={() => handleTagClick(tag)}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex justify-end gap-2 mt-2">
                          {user && (
                            <ProjectSharingModal
                              projectId={project._id}
                              projectName={project.name}
                              ownerId={{ _id: user.id, name: user.name, email: user.email }}
                              collaborators={(project.collaborators || []).map(collab => ({
                                ...collab,
                                userId: typeof collab.userId === 'string' 
                                  ? { _id: collab.userId, name: '', email: '' } 
                                  : collab.userId
                              }))}
                              currentUserId={user.id}
                              onProjectUpdated={() => fetchProjects(true)}
                              trigger={
                                <Button variant="outline" size="sm" className="flex items-center gap-1">
                                  <Share className="h-4 w-4" />
                                  Share
                                </Button>
                              }
                            />
                          )}
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/dashboard/projects/${project._id}`}>View Tasks</a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                    onUpdate={(projectId, data) => {
                      // Create a wrapper function to match the expected signature
                      if (data.isSacred !== undefined) {
                        return updateProject(projectId, data);
                      }
                      return Promise.resolve(null);
                    }}
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
