// src/context/AuthContext.js - versione semplificata
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../config/supabaseClient';

// Crea il context con valori di default
export const AuthContext = createContext({
  session: null,
  user: null,
  loading: true,
  isAuthenticated: false,
  signOut: () => {}
});

// Hook personalizzato per utilizzare il context
export const useAuth = () => useContext(AuthContext);

// Provider per l'autenticazione
export const AuthProvider = ({ children }) => {
  // Stati per gestire l'autenticazione
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Funzione per recuperare la sessione
    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Errore durante il recupero della sessione:', error);
        } else if (data && data.session) {
          setSession(data.session);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Errore:', error);
        setLoading(false);
      }
    };
    
    getSession();
    
    // Listener per i cambiamenti di autenticazione
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setLoading(false);
    });
    
    return () => {
      if (data && data.subscription) {
        data.subscription.unsubscribe();
      }
    };
  }, []);
  
  // Valori da fornire al context
  const value = {
    session,
    user: session?.user || null,
    loading,
    isAuthenticated: !!session,
    signOut: () => supabase.auth.signOut()
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};