// src/App.js - Simplified version without AuthCallback
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeContextProvider } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';

import './styles/globals.css';
import './styles/login-scope.css';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

const PrivateRoute = ({ children }) => {
  const { loading, isAuthenticated } = useAuth();
  
  // Show loader while checking authentication
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#f5f5f5'
      }}>
        <div className="loading-spinner" style={{
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
      </div>
    );
  }
  
  if (!isAuthenticated()) {
    console.log('PrivateRoute: User not authenticated, redirecting to login');
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <ThemeContextProvider>
      <div className="app-root full-width full-height">
        <div className="app-container full-width full-height">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </ThemeContextProvider>
  );
}

export default App;