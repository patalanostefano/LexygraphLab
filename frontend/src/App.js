// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeContextProvider } from './context/ThemeContext';

// Pages & Components
import Dashboard from './pages/Dashboard';
import Multiagent from './components/multiagent/Multiagent';
import ProfileSection from './components/profile/ProfileSection';

// Auth Guard Component
const PrivateRoute = ({ children }) => {
  // Per semplificare il test, consideriamo tutti autenticati
  return children;
  
  // In implementazione reale:
  // const isAuthenticated = localStorage.getItem('access_token');
  // return isAuthenticated ? children : <Navigate to="/" />;
};

function App() {
  return (
    <ThemeContextProvider>
      <Router>
        <Routes>
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
      </Router>
    </ThemeContextProvider>
  );
}

export default App;