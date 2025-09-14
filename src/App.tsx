// App - Auth v2 Integration
// Phase 2B: DISSOLUTION - Intelligence Interface

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider } from './providers/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicOnlyRoute } from './components/PublicOnlyRoute';
import { useAuthContext } from './providers/AuthProvider';

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
import ResonanceTenSetupPage from './pages/ResonanceTenSetupPage';
import DiscoveryPage from './pages/DiscoveryPage';

// Components
import { ModalRoot } from './components/modals';
import { NotificationContainer } from './components/notifications';
import { GlobalMenu } from './components/GlobalMenu';
import { AuthNavigationHandler } from './components/AuthNavigationHandler';
import ThemeTestComponent from './components/ThemeTestComponent';

import './App.css';

// ============================================================================
// APP LOADING COMPONENT
// ============================================================================

const AppLoading: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-pink-600 mb-4">✨ GLOW ✨</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
        <p className="text-gray-600 mt-4">Initializing your connection journey...</p>
      </div>
    </div>
  );
};

// ============================================================================
// APP ROUTES COMPONENT
// ============================================================================

const AppRoutes: React.FC = () => {
  const { isInitialized, isLoading } = useAuthContext();

  // Show loading while initializing authentication
  if (!isInitialized || isLoading) {
    return <AppLoading />;
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Public Only Routes (redirect if authenticated) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
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
          path="/birth-data" 
          element={
            <ProtectedRoute>
              <BirthDataPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/birth-data-comparison" 
          element={
            <ProtectedRoute>
              <BirthDataComparisonPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/enhanced-birth-data" 
          element={
            <ProtectedRoute>
              <EnhancedBirthDataPage />
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
          path="/resonance-ten-setup" 
          element={
            <ProtectedRoute>
              <ResonanceTenSetupPage />
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
        
        {/* Development Routes */}
        {process.env.NODE_ENV === 'development' && (
          <Route 
            path="/theme-test" 
            element={
              <ProtectedRoute>
                <ThemeTestComponent />
              </ProtectedRoute>
            } 
          />
        )}
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Global Components */}
      <AuthNavigationHandler />
      <GlobalMenu />
      <ModalRoot />
      <NotificationContainer />
    </Router>
  );
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

const App: React.FC = () => {
  return (
    <QueryProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </QueryProvider>
  );
};

export default App;

