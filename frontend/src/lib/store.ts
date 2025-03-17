import { create } from 'zustand';
import axios from 'axios';
import { apiEndpoint } from "@/config";

// Define types
export interface Collaborator {
  userId: string;
  role: 'viewer' | 'editor' | 'admin';
  addedAt: string;
  name?: string;
  email?: string;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  tags: string[];
  isArchived: boolean;
  isSacred: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  collaborators?: Collaborator[];
}

interface ProjectsState {
  projects: Project[];
  activeProjects: Project[];
  archivedProjects: Project[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchProjects: (showArchived?: boolean) => Promise<void>;
  updateProject: (projectId: string, projectData: Partial<Project>) => Promise<Project | null>;
  createProject: (projectData: Partial<Project>) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<boolean>;
  toggleArchiveProject: (projectId: string, archive: boolean) => Promise<boolean>;
  reorderProjects: (projectIds: string[]) => Promise<boolean>;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  activeProjects: [],
  archivedProjects: [],
  isLoading: false,
  error: null,
  
  fetchProjects: async (showArchived = false) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        set({ error: "Authentication token not found" });
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Fetch active projects
      const activeResponse = await axios.get(apiEndpoint("projects"), config);
      const activeProjects = activeResponse.data;
      
      // Fetch archived projects if needed
      let archivedProjects: Project[] = [];
      if (showArchived) {
        const archivedResponse = await axios.get(apiEndpoint("projects/archived"), config);
        archivedProjects = archivedResponse.data;
      }
      
      // Set all projects
      set({
        projects: [...activeProjects, ...archivedProjects],
        activeProjects,
        archivedProjects: showArchived ? archivedProjects : [],
        isLoading: false
      });
    } catch (error) {
      console.error("Error fetching projects:", error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : "Failed to load projects" 
      });
    }
  },
  
  updateProject: async (projectId, projectData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.put(
        apiEndpoint(`projects/${projectId}`), 
        projectData, 
        config
      );

      const updatedProject = response.data;
      
      // Update projects in the store
      set(state => ({
        projects: state.projects.map(project => 
          project._id === projectId ? updatedProject : project
        ),
        activeProjects: state.activeProjects.map(project => 
          project._id === projectId ? updatedProject : project
        ),
        archivedProjects: state.archivedProjects.map(project => 
          project._id === projectId ? updatedProject : project
        )
      }));
      
      return updatedProject;
    } catch (error) {
      console.error("Error updating project:", error);
      return null;
    }
  },
  
  createProject: async (projectData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.post(
        apiEndpoint("projects"), 
        projectData, 
        config
      );

      const newProject = response.data;
      
      // Add the new project to the store
      set(state => ({
        projects: [...state.projects, newProject],
        activeProjects: [...state.activeProjects, newProject]
      }));
      
      return newProject;
    } catch (error) {
      console.error("Error creating project:", error);
      return null;
    }
  },
  
  deleteProject: async (projectId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return false;

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      await axios.delete(apiEndpoint(`projects/${projectId}`), config);
      
      // Remove the project from the store
      set(state => ({
        projects: state.projects.filter(project => project._id !== projectId),
        activeProjects: state.activeProjects.filter(project => project._id !== projectId),
        archivedProjects: state.archivedProjects.filter(project => project._id !== projectId)
      }));
      
      return true;
    } catch (error) {
      console.error("Error deleting project:", error);
      return false;
    }
  },
  
  toggleArchiveProject: async (projectId, archive) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return false;

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      
      await axios.put(
        apiEndpoint(`projects/${projectId}/archive`),
        { isArchived: archive },
        config
      );
      
      // Update the project in the store
      const { projects } = get();
      const projectToUpdate = projects.find(p => p._id === projectId);
      
      if (projectToUpdate) {
        const updatedProject = { ...projectToUpdate, isArchived: archive };
        
        set(state => {
          // If archiving, move from active to archived
          if (archive) {
            return {
              activeProjects: state.activeProjects.filter(p => p._id !== projectId),
              archivedProjects: [...state.archivedProjects, updatedProject],
              projects: state.projects.map(p => p._id === projectId ? updatedProject : p)
            };
          } 
          // If restoring, move from archived to active
          else {
            return {
              archivedProjects: state.archivedProjects.filter(p => p._id !== projectId),
              activeProjects: [...state.activeProjects, updatedProject],
              projects: state.projects.map(p => p._id === projectId ? updatedProject : p)
            };
          }
        });
      }
      
      return true;
    } catch (error) {
      console.error(`Error ${archive ? "archiving" : "restoring"} project:`, error);
      return false;
    }
  },
  
  reorderProjects: async (projectIds) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return false;

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      
      // Send the reorder request to the server
      const response = await axios.put(
        apiEndpoint("projects/reorder"),
        { projectIds },
        config
      );
      
      // The server returns the updated projects with the new order
      const updatedProjects = response.data;
      
      // Update the store with the server response
      set(state => {
        // Create a map of all projects for easy lookup
        const projectMap = new Map<string, Project>();
        state.projects.forEach((project: Project) => {
          projectMap.set(project._id, project);
        });
        
        // Update the map with the new order from the server
        updatedProjects.forEach((project: Project) => {
          projectMap.set(project._id, project);
        });
        
        // Separate active and archived projects
        const active: Project[] = [];
        const archived: Project[] = [];
        
        // First add all projects in the new order
        projectIds.forEach(id => {
          const project = projectMap.get(id);
          if (project && !project.isArchived) {
            active.push(project);
          }
        });
        
        // Then add any other active projects not in the reordered list
        state.activeProjects.forEach(project => {
          if (!projectIds.includes(project._id) && !project.isArchived) {
            active.push(project);
          }
        });
        
        // Add all archived projects
        state.archivedProjects.forEach(project => {
          archived.push(project);
        });
        
        // Return the updated state
        return {
          activeProjects: active,
          archivedProjects: archived,
          projects: [...active, ...archived]
        };
      });
      
      return true;
    } catch (error) {
      console.error("Error reordering projects:", error);
      return false;
    }
  }
}));
