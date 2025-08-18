// api/apiClient.js - Fixed version with consistent session-based auth
import axios from 'axios';
import { supabase } from '../config/supabaseClient';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// FIXED: Use getSession() consistently with AuthContext for speed and reliability
export const getCurrentUserId = async () => {
  try {
    console.log('🔍 getCurrentUserId: Checking Supabase session...');
    
    // Use getSession() for consistency with AuthContext (faster, frontend-safe)
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log('📝 Supabase session response:', {
      session: session ? {
        user_id: session.user?.id,
        user_email: session.user?.email,
        expires_at: session.expires_at,
        access_token: session.access_token ? '[present]' : '[missing]'
      } : null,
      error: error
    });
    
    if (error) {
      console.error('❌ Supabase session error:', error);
      throw error;
    }
    
    if (!session?.user?.id) {
      console.warn('⚠️ No valid session or user found');
      return null;
    }
    
    console.log('✅ User authenticated via session:', session.user.id);
    return session.user.id;
  } catch (error) {
    console.error('💥 Error getting user ID from session:', error);
    return null;
  }
};

// ALTERNATIVE: Synchronous version that uses AuthContext state
// This avoids async calls in every API request
let cachedUserId = null;
let cachedSession = null;

export const setCachedUserData = (userId, session) => {
  cachedUserId = userId;
  cachedSession = session;
  console.log('📥 Cached user data updated:', { userId: userId ? '[present]' : '[none]' });
};

export const getCachedUserId = () => {
  console.log('🏃‍♂️ Using cached user ID:', cachedUserId ? '[present]' : '[none]');
  return cachedUserId;
};

// Request interceptor: Use cached userId when available, fallback to session check
apiClient.interceptors.request.use(
  async (config) => {
    try {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      
      // Try cached first (faster)
      let userId = getCachedUserId();
      
      // Fallback to session check if no cache
      if (!userId) {
        console.log('🔄 No cached user, checking session...');
        userId = await getCurrentUserId();
      }
      
      if (userId) {
        config.headers['X-User-Id'] = userId;
        console.log(`👤 Added user header: ${userId}`);
      } else {
        console.log('⚠️ No user ID available for request');
      }
    } catch (error) {
      console.log('❌ Error in request interceptor:', error);
      // Don't fail the request due to auth issues
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const getUserIdFromContext = (contextUserId) => {
  console.log('⚡ Using AuthContext user ID:', contextUserId ? '[present]' : '[none]');
  return contextUserId;
};

// Response interceptor for logging and auth error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Success: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    
    if (error.response) {
      console.error('📋 Error details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      
      // Handle auth errors by clearing cache
      if (error.response.status === 401) {
        console.log('🔑 Auth error detected, clearing cached user data');
        setCachedUserData(null, null);
      }
    } else if (error.request) {
      console.error('📡 Network error - no response received');
    } else {
      console.error('⚙️ Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;