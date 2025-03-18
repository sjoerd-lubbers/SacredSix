/**
 * Application configuration
 * 
 * This file centralizes all configuration settings for the application.
 * Environment variables are accessed here to provide a single source of truth.
 */

// API configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Environment detection
export type Environment = 'development' | 'test' | 'production';

export const getEnvironment = (): Environment => {
  // Determine environment based on API URL
  const apiUrl = API_URL.toLowerCase();
  
  if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
    return 'development';
  } else if (
    apiUrl.includes('test') || 
    apiUrl.includes('staging') || 
    apiUrl.includes('uat') ||
    apiUrl.includes('acceptance')
  ) {
    return 'test';
  } else {
    return 'production';
  }
};

// Environment display settings
export const ENVIRONMENT_DISPLAY = {
  development: {
    name: 'Development',
    color: 'bg-green-500',
    textColor: 'text-white',
    shortName: 'DEV'
  },
  test: {
    name: 'Test',
    color: 'bg-amber-500',
    textColor: 'text-white',
    shortName: 'TEST'
  },
  production: {
    name: 'Production',
    color: 'bg-red-500',
    textColor: 'text-white',
    shortName: 'PROD'
  }
};

// Helper function to construct API endpoints
export const apiEndpoint = (path: string): string => {
  // Ensure path starts with /api/
  const apiPath = path.startsWith('/api/') ? path : `/api${path.startsWith('/') ? path : `/${path}`}`;
  return `${API_URL}${apiPath}`;
};
