// src/utils/auth.js
import { supabase } from '../config/supabaseClient';

export const logout = async () => {
  try {
    await supabase.auth.signOut();
    // Il reindirizzamento avverrà automaticamente tramite listener in AuthContext
  } catch (error) {
    console.error('Errore durante il logout:', error);
    // Fallback in caso di errore
    localStorage.removeItem('testUser');
    window.location.href = '/login';
  }
};