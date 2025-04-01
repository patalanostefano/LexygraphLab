// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../../../../LexygraphLab-fedf0d2dd232066d92eb7a8e8a9d4787cfd35c36/LexygraphLab-fedf0d2dd232066d92eb7a8e8a9d4787cfd35c36/frontend/src/config/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Get session on load
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };
    
    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    loading,
    signIn: async (options) => {
      if (options.provider) {
        // Social login with correct redirect URL
        return await supabase.auth.signInWithOAuth({
          provider: options.provider,
          options: {
            redirectTo: window.location.origin + '/auth/callback',
          }
        });
      } else {
        // Email password login
        return await supabase.auth.signInWithPassword({
          email: options.email,
          password: options.password
        });
      }
    },
    signOut: () => supabase.auth.signOut(),
    getToken: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        throw error;
      }
      return data.session?.access_token;
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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
