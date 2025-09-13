// GLOW Dating App - Main Application Component
// Phase 2B: DISSOLUTION - Intelligence Interface

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider } from './core/auth/AuthContext';
import { useAuthStore } from './stores/authStore';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BirthDataPage from './pages/BirthDataPage';
import BirthDataComparisonPage from './pages/BirthDataComparisonPage';
import EnhancedBirthDataPage from './pages/EnhancedBirthDataPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import Magic10SetupPage from './pages/Magic10SetupPage';
import DiscoveryPage from './pages/DiscoveryPage';

// Components
import { ModalRoot } from './components/modals';
import { NotificationContainer } from './components/notifications';
import ThemeTestComponent from './components/ThemeTestComponent';

import './App.css';

// ============================================================================
// PROTECTED ROUTE COMPONENT
// ============================================================================

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuthStore();
  
  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

const App: React.FC = () => {
  return (
    <QueryProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/theme-test" element={
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
                  <ThemeTestComponent />
                </div>
              } />
              
              {/* Birth Data Routes */}
              <Route path="/birth-data" element={<BirthDataPage />} />
              <Route path="/birth-data-enhanced" element={<EnhancedBirthDataPage />} />
              <Route path="/birth-data-comparison" element={<BirthDataComparisonPage />} />
              
              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/magic10-setup" 
                element={
                  <ProtectedRoute>
                    <Magic10SetupPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/discovery" 
                element={
                  <ProtectedRoute>
                    <DiscoveryPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Redirect unknown routes to landing */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            {/* Global Modal System */}
            <ModalRoot />
            
            {/* Global Notification System */}
            <NotificationContainer />
          </div>
        </Router>
      </AuthProvider>
    </QueryProvider>
  );
};

export default App;

