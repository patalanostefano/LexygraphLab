// context/AuthContext.js - Updated to sync with apiClient caching
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabaseClient';
import { setCachedUserData } from '../api/apiClient'; // Import the cache setter

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  // Helper to update both local state and apiClient cache
  const updateAuthState = (newSession) => {
    setSession(newSession);
    const newUser = newSession?.user ?? null;
    const newUserId = newUser?.id ?? null;
    setUser(newUser);
    setUserId(newUserId); // ADD THIS LINE
    
    // SYNC with apiClient cache
    setCachedUserData(newUserId, newSession);
    
    console.log('🔄 Auth state updated:', {
      userId: newUserId,
      hasSession: !!newSession,
      email: newUser?.email
    });
  };

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        console.log('🔍 AuthContext: Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Initial session error:', error);
          updateAuthState(null);
        } else {
          console.log('✅ Initial session loaded:', session ? 'authenticated' : 'not authenticated');
          updateAuthState(session);
        }
      } catch (error) {
        console.error('💥 Error getting initial session:', error);
        updateAuthState(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`🔔 Auth event: ${event}`, { 
          hasSession: !!session,
          userId: session?.user?.id
        });
        
        updateAuthState(session);
        setLoading(false);

        // Handle redirects based on auth state
        if (event === 'SIGNED_IN' && window.location.pathname === '/login') {
          console.log('📍 Redirecting to dashboard after sign in');
          window.location.href = '/';
        } else if (event === 'SIGNED_OUT') {
          console.log('📍 Redirecting to login after sign out');
          window.location.href = '/login';
        }
      }
    );

    return () => {
      console.log('🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  // Simple authentication check
  const isAuthenticated = () => !!user;

  const value = {
    user,
    userId,
    session,
    loading,
    isAuthenticated,
    
    // Enhanced auth methods with better error handling
    signIn: async (email, password) => {
      try {
        console.log('🔐 Attempting sign in for:', email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email, 
          password
        });
        
        if (error) {
          console.error('❌ Sign in error:', error);
        } else {
          console.log('✅ Sign in successful');
        }
        
        return { data, error };
      } catch (error) {
        console.error('💥 Sign in exception:', error);
        return { data: null, error };
      }
    },
    
    signUp: async (email, password) => {
      try {
        console.log('📝 Attempting sign up for:', email);
        const { data, error } = await supabase.auth.signUp({
          email, 
          password,
          options: { emailRedirectTo: `${window.location.origin}/` }
        });
        
        if (error) {
          console.error('❌ Sign up error:', error);
        } else {
          console.log('✅ Sign up successful');
        }
        
        return { data, error };
      } catch (error) {
        console.error('💥 Sign up exception:', error);
        return { data: null, error };
      }
    },
    
    signOut: async () => {
      try {
        console.log('👋 Attempting sign out');
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          console.error('❌ Sign out error:', error);
        } else {
          console.log('✅ Sign out successful');
          // Clear cache immediately
          updateAuthState(null);
        }
        
        return { error };
      } catch (error) {
        console.error('💥 Sign out exception:', error);
        return { error };
      }
    },
    
    signInWithOAuth: async (provider) => {
      try {
        console.log('🌐 Attempting OAuth sign in with:', provider);
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo: `${window.location.origin}/` }
        });
        
        if (error) {
          console.error('❌ OAuth sign in error:', error);
        } else {
          console.log('✅ OAuth sign in initiated');
        }
        
        return { data, error };
      } catch (error) {
        console.error('💥 OAuth sign in exception:', error);
        return { data: null, error };
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};