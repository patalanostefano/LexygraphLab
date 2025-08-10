import axios from 'axios';
import { supabase } from '../config/supabaseClient';

// This points to YOUR API GATEWAY, not Supabase directly
const API_BASE_URL = 'http://localhost:8080'; // Your API Gateway

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Get current user ID helper - CALLS SUPABASE AUTH DIRECTLY FROM FRONTEND
export const getCurrentUserId = async () => {
  try {
    // This is a direct call to Supabase Auth API (not your backend)
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user?.id || null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

// Request interceptor - Add user ID to requests instead of JWT
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get user ID from Supabase Auth (frontend call)
      const userId = await getCurrentUserId();
      
      if (userId) {
        // ALL THESE REQUESTS GO TO YOUR API GATEWAY (localhost:8080)
        // NOT to Supabase directly
        
        // Add userId to URL params for GET requests
        if (config.method === 'get') {
          config.params = { ...config.params, userId };
        } 
        // Add userId to request body for POST/PUT requests
        else if (config.data && !(config.data instanceof FormData)) {
          config.data = { ...config.data, userId };
        }
        // For FormData, append userId
        else if (config.data instanceof FormData) {
          config.data.append('userId', userId);
        }
        
        console.log(`API Request to Gateway: ${config.method?.toUpperCase()} ${config.url} with userId: ${userId}`);
      } else {
        console.warn('No authenticated user found for API request');
        return Promise.reject(new Error('User not authenticated'));
      }
      
      return config;
    } catch (error) {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Success: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    
    if (error.response) {
      console.error('Error details:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;