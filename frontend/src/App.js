// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeContextProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

// Importa gli stili - l'ordine è importante!
import './styles/globals.css';
import './styles/login-scope.css';

// Pages & Components
import Dashboard from './pages/Dashboard';
import Multiagent from './components/multiagent/Multiagent';
import ProfileSection from './components/profile/ProfileSection';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import SupabaseTest from './pages/SupabaseTest';

// Auth Guard Component
const PrivateRoute = ({ children }) => {
  // Verifica autenticazione usando localStorage per retrocompatibilità
  const isAuthenticated = localStorage.getItem('testUser') ? true : false;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <ThemeContextProvider>
      <div className="app-root full-width full-height">
        <Router>
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
        </Router>
      </div>
    </ThemeContextProvider>
  );
}

export default App;