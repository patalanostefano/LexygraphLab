// src/pages/AuthCallback.jsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';

const AuthCallback = () => {
  const [redirectTo, setRedirectTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('AuthCallback: Processing auth callback...');
        
        // Handle the auth callback from Supabase
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthCallback: Error getting session:', error);
          setRedirectTo('/login');
          return;
        }

        if (data?.session) {
          console.log('AuthCallback: Session found, user authenticated');
          setRedirectTo('/');
        } else {
          console.log('AuthCallback: No session found, redirecting to login');
          setRedirectTo('/login');
        }
      } catch (error) {
        console.error('AuthCallback: Error in callback processing:', error);
        setRedirectTo('/login');
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to ensure URL hash is processed
    const timer = setTimeout(handleAuthCallback, 100);
    
    return () => clearTimeout(timer);
  }, [location]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px',
        background: '#f5f5f5'
      }}>
        <div style={{
          border: '4px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '50%',
          borderTop: '4px solid #3498db',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite'
        }}>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
        <p style={{ margin: 0, color: '#666' }}>Completing authentication...</p>
      </div>
    );
  }

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return null;
};

export default AuthCallback;