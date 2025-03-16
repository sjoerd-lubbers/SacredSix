import { create } from 'zustand';
import axios from 'axios';
import { apiEndpoint } from "@/config";

// Define types
export interface ApiKey {
  _id: string;
  name: string;
  key?: string; // Only available when first created
  projectId: string;
  projectName?: string;
  createdAt: string;
  lastUsed?: string;
  isActive: boolean;
}

interface ApiKeyState {
  apiKeys: ApiKey[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchApiKeys: () => Promise<void>;
  createApiKey: (name: string, projectId: string, projectName?: string) => Promise<ApiKey | null>;
  deactivateApiKey: (apiKeyId: string) => Promise<boolean>;
  deleteApiKey: (apiKeyId: string) => Promise<boolean>;
}

export const useApiKeyStore = create<ApiKeyState>((set) => ({
  apiKeys: [],
  isLoading: false,
  error: null,
  
  fetchApiKeys: async () => {
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

      const response = await axios.get(apiEndpoint("api-keys"), config);
      
      // Transform the data to extract project name from populated projectId
      const transformedApiKeys = response.data.map((apiKey: any) => {
        // If projectId is populated as an object with a name property
        if (apiKey.projectId && typeof apiKey.projectId === 'object' && apiKey.projectId.name) {
          return {
            ...apiKey,
            projectName: apiKey.projectId.name,
            projectId: apiKey.projectId._id || apiKey.projectId
          };
        }
        return apiKey;
      });
      
      set({
        apiKeys: transformedApiKeys,
        isLoading: false
      });
    } catch (error) {
      console.error("Error fetching API keys:", error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : "Failed to load API keys" 
      });
    }
  },
  
  createApiKey: async (name, projectId, projectName) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // If projectName is not provided, try to fetch it
      let resolvedProjectName = projectName || "";
      if (!resolvedProjectName) {
        try {
          const projectResponse = await axios.get(apiEndpoint(`projects/${projectId}`), config);
          resolvedProjectName = projectResponse.data.name;
        } catch (error) {
          console.error("Error fetching project name:", error);
          // Continue even if we can't get the project name
        }
      }

      const response = await axios.post(
        apiEndpoint("api-keys"), 
        { name, projectId }, 
        config
      );

      const newApiKey = {
        ...response.data,
        projectName: resolvedProjectName // Add the project name to the new API key
      };
      
      // Add the new API key to the store
      set(state => ({
        apiKeys: [...state.apiKeys, newApiKey]
      }));
      
      return newApiKey;
    } catch (error) {
      console.error("Error creating API key:", error);
      return null;
    }
  },
  
  deactivateApiKey: async (apiKeyId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return false;

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      await axios.put(apiEndpoint(`api-keys/${apiKeyId}/deactivate`), {}, config);
      
      // Update the API key in the store
      set(state => ({
        apiKeys: state.apiKeys.map(apiKey => 
          apiKey._id === apiKeyId ? { ...apiKey, isActive: false } : apiKey
        )
      }));
      
      return true;
    } catch (error) {
      console.error("Error deactivating API key:", error);
      return false;
    }
  },
  
  deleteApiKey: async (apiKeyId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return false;

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      await axios.delete(apiEndpoint(`api-keys/${apiKeyId}`), config);
      
      // Remove the API key from the store
      set(state => ({
        apiKeys: state.apiKeys.filter(apiKey => apiKey._id !== apiKeyId)
      }));
      
      return true;
    } catch (error) {
      console.error("Error deleting API key:", error);
      return false;
    }
  }
}));
