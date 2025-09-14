// Authenticated Layout - T-UI-001 Phase 6
// Persistent shell for authenticated pages with hybrid global menu

import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { useAuthContext } from '../providers/AuthProvider';
import { GlobalMenu } from './GlobalMenu';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ children }) => {
  const { isInitialized } = useAuthContext();
  const { isAuthenticated } = useAuthStore();

  // Only render if initialized and authenticated
  // (ProtectedRoute should handle the guards, this is just a safety check)
  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        <span className="ml-2 text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* GM-1: Global Menu Shell - Hybrid UI (persistent bar desktop, hamburger mobile) */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-bold text-pink-600">✨ GLOW</h1>
          </div>
          
          <GlobalMenu />
        </div>
      </header>
      
      <main>
        {children}
      </main>
    </div>
  );
};

export default AuthenticatedLayout;

