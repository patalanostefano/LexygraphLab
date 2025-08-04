// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    console.log("AuthProvider mounted");
    
    // Get session on load
    const getSession = async () => {
      console.log('Checking for existing session...');
      setLoading(true);
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
      
        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
          setSession(null);
        } else if (session) {
          console.log('Active session found:', session.user.email);
          setSession(session);
          setUser(session.user);
          
          // Salva in localStorage per compatibilità
          localStorage.setItem('testUser', 'true');
          
          // Se l'utente è sulla pagina di login, reindirizza
          if (window.location.pathname === '/login') {
            console.log('Redirecting from login to home (session found)');
            window.location.href = '/';
          }
        } else {
          console.log('No active session');
          setUser(null);
          setSession(null);
          
          // Se l'utente è già su una pagina protetta, reindirizza al login
          const isProtectedRoute = window.location.pathname !== '/login' && 
                                   window.location.pathname !== '/auth/callback' &&
                                   window.location.pathname !== '/reset-password';
          
          if (isProtectedRoute) {
            console.log('No session, redirecting to login');
            window.location.href = '/login';
          }
        }
      } catch (e) {
        console.error('Session check error:', e);
      } finally {
        setLoading(false);
      }
    };
    
    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`Auth state change: ${event}, User: ${session?.user?.email || 'none'}`);
        
        if (event === 'SIGNED_IN') {
          console.log('User signed in');
          setSession(session);
          setUser(session?.user ?? null);
          
          // Salva in localStorage per compatibilità
          localStorage.setItem('testUser', 'true');
          
          // Reindirizza a home se sulla pagina di login
          if (window.location.pathname === '/login') {
            console.log('Redirecting from login to home after sign in');
            setTimeout(() => window.location.href = '/', 300);
          }
        } 
        else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setUser(null);
          setSession(null);
          
          // Rimuovi da localStorage
          localStorage.removeItem('testUser');
          
          // Reindirizza a login
          console.log('Redirecting to login after sign out');
          window.location.href = '/login';
        } 
        else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed');
          setSession(session);
          setUser(session?.user ?? null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      console.log('Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  // Reimplementazione di PrivateRoute direttamente nel contesto
  const isAuthenticated = () => {
    // Controlla sia lo stato user sia localStorage per compatibilità
    return !!user || !!localStorage.getItem('testUser');
  };

  const value = {
    user,
    session,
    loading,
    isAuthenticated,
    signIn: async (options) => {
      console.log(`Attempting to sign in with method: ${options.provider ? 'OAuth' : 'Password'}`);
      setLoading(true);
      
      try {
        let response;
        
        if (options.provider) {
          // Social login with correct redirect URL
          response = await supabase.auth.signInWithOAuth({
            provider: options.provider,
            options: {
              redirectTo: `${window.location.origin}/`
            }
          });
        } else {
          // Email password login
          response = await supabase.auth.signInWithPassword({
            email: options.email,
            password: options.password
          });
        }
        
        console.log('Sign in response:', response);
        
        if (response.error) {
          console.error('Login error:', response.error);
          setLoading(false);
          return response;
        }
        
        if (response.data.user) {
          console.log('Sign in successful, user:', response.data.user.email);
          setUser(response.data.user);
          setSession(response.data.session);
          
          // Salva in localStorage per compatibilità
          localStorage.setItem('testUser', 'true');
          
          // Reindirizza dopo un breve delay
          if (window.location.pathname === '/login') {
            setTimeout(() => window.location.href = '/', 500);
          }
        }
        
        setLoading(false);
        return response;
      } catch (err) {
        console.error('Sign in error:', err);
        setLoading(false);
        return { error: err };
      }
    },
    signUp: async (options) => {
      console.log(`Attempting to sign up with email: ${options.email}`);
      setLoading(true);
      
      try {
        const response = await supabase.auth.signUp({
          email: options.email,
          password: options.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        
        console.log('Sign up response:', response);
        
        if (response.error) {
          console.error('Sign up error:', response.error);
          setLoading(false);
          return response;
        }
        
        // Se non richiede conferma email, registra l'utente
        if (response.data.user && !response.data.session) {
          console.log('Sign up successful, email confirmation required');
        } else if (response.data.session) {
          console.log('Sign up and auto-login successful');
          setUser(response.data.user);
          setSession(response.data.session);
          
          // Salva in localStorage per compatibilità
          localStorage.setItem('testUser', 'true');
          
          // Reindirizza alla home
          if (window.location.pathname === '/login') {
            setTimeout(() => window.location.href = '/', 500);
          }
        }
        
        setLoading(false);
        return response;
      } catch (err) {
        console.error('Sign up error:', err);
        setLoading(false);
        return { error: err };
      }
    },
    signOut: async () => {
      console.log('Signing out user');
      setLoading(true);
      
      try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          console.error('Error signing out:', error);
          setLoading(false);
          throw error;
        }
        
        console.log('Sign out successful');
        
        // Pulisci manualmente lo stato e localStorage
        setUser(null);
        setSession(null);
        localStorage.removeItem('testUser');
        
        // Forza la navigazione a /login
        window.location.href = '/login';
        
        setLoading(false);
        return { error: null };
      } catch (err) {
        console.error('Sign out error:', err);
        setLoading(false);
        
        // Fallback in caso di errore
        localStorage.removeItem('testUser');
        window.location.href = '/login';
        
        return { error: err };
      }
    },
    resetPassword: async (email) => {
      console.log(`Attempting password reset for: ${email}`);
      
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`
        });
        
        if (error) throw error;
        
        console.log('Password reset email sent');
        return { error: null };
      } catch (err) {
        console.error('Password reset error:', err);
        return { error: err };
      }
    },
    updatePassword: async (newPassword) => {
      console.log('Attempting to update password');
      
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });
        
        if (error) throw error;
        
        console.log('Password updated successfully');
        return { error: null };
      } catch (err) {
        console.error('Password update error:', err);
        return { error: err };
      }
    },
    getToken: async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }
        return data.session?.access_token;
      } catch (error) {
        console.error('Error getting token:', error);
        return null;
      }
    },
    refreshSession: async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error('Session refresh error:', error);
          return { error };
        }
        
        console.log('Session refreshed successfully');
        setSession(data.session);
        setUser(data.user);
        
        return { data, error: null };
      } catch (err) {
        console.error('Session refresh error:', err);
        return { error: err };
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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};