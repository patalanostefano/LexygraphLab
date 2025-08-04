// src/App.js (modificato)
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeContextProvider } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';

// Importa gli stili - l'ordine è importante!
import './styles/globals.css';
import './styles/login-scope.css';

// Pages & Components
import Dashboard from './pages/Dashboard';
import Multiagent from './components/multiagent/multiagentconst/main/Multiagent';
import ProfileSection from './components/profile/ProfileSection';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import SupabaseTest from './pages/SupabaseTest';

// Auth Guard Component migliorato
const PrivateRoute = ({ children }) => {
  const { loading, isAuthenticated } = useAuth();
  
  // Visualizza un loader mentre controlliamo l'autenticazione
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
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/supabase-test" element={<SupabaseTest />} />
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/multiagente" 
              element={
                <PrivateRoute>
                  <Multiagent />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <PrivateRoute>
                  <ProfileSection />
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
