// src/pages/AuthCallback.jsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';

const AuthCallback = () => {
  const [redirectTo, setRedirectTo] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Recupera la sessione al caricamento della pagina
    const handleAuthCallback = async () => {
      try {
        // Controlla se siamo in un callback OAuth
        const params = new URLSearchParams(location.hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        if (accessToken) {
          // Elabora il callback OAuth
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) {
            console.error('Errore nell\'elaborazione del callback:', error);
          }
        }
        
        setRedirectTo('/');
      } catch (error) {
        console.error('Errore nel callback di autenticazione:', error);
        setRedirectTo('/login');
      }
    };

    handleAuthCallback();
  }, [location]);

  if (redirectTo) {
    return <Navigate to={redirectTo} />;
  }

  // Mostra un semplice messaggio di caricamento durante l'elaborazione
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <div className="loading-spinner"></div>
      <p>Autenticazione in corso...</p>
    </div>
  );
};

export default AuthCallback;