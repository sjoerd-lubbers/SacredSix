import { create } from 'zustand';
import axios from 'axios';
import { apiEndpoint } from "@/config";

// Define types
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  mission: string;
  values: string[];
  alignment: string;
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loadUser: () => Promise<boolean>;
  updateSacredSix: (data: { mission?: string; values?: string[]; alignment?: string }) => Promise<boolean>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(apiEndpoint("auth/login"), {
        email,
        password
      });
      
      const { token, user } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      set({
        user,
        isAuthenticated: true,
        isLoading: false
      });
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed'
      });
      return false;
    }
  },
  
  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(apiEndpoint("auth/register"), {
        name,
        email,
        password
      });
      
      const { token, user } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      set({
        user,
        isAuthenticated: true,
        isLoading: false
      });
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      });
      return false;
    }
  },
  
  logout: () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    set({
      user: null,
      isAuthenticated: false
    });
  },
  
  loadUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return false;
    }
    
    set({ isLoading: true });
    
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      
      const response = await axios.get(apiEndpoint("auth/user"), config);
      
      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false
      });
      
      return true;
    } catch (error) {
      console.error('Error loading user:', error);
      localStorage.removeItem('token');
      
      set({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load user'
      });
      
      return false;
    }
  },
  
  updateSacredSix: async (data) => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ error: 'Not authenticated' });
      return false;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      
      const response = await axios.put(
        apiEndpoint("auth/sacred-six"),
        data,
        config
      );
      
      set({
        user: response.data,
        isLoading: false
      });
      
      return true;
    } catch (error) {
      console.error('Error updating Sacred Six:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update Sacred Six'
      });
      
      return false;
    }
  }
}));
