/**
 * Application configuration
 * 
 * This file centralizes all configuration settings for the application.
 * Environment variables are accessed here to provide a single source of truth.
 */

// API configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Helper function to construct API endpoints
export const apiEndpoint = (path: string): string => {
  // Ensure path starts with /api/
  const apiPath = path.startsWith('/api/') ? path : `/api${path.startsWith('/') ? path : `/${path}`}`;
  return `${API_URL}${apiPath}`;
};
