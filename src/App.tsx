// GLOW Dating App - Main Application Component
// Phase 2: DISSOLUTION - Adaptive State Management Integration

import React, { useEffect } from 'react';
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider, useAuth, AuthGuard } from './core/auth/AuthContext';
import AppLayout from './shared/layouts/AppLayout';
import { ResponsiveContainer, TouchButton } from './shared/layouts/AppLayout';
import { useUIStore } from './stores/uiStore';
import { useAuthStore } from './stores/authStore';
import { default as useEnhancedAuth } from './hooks/useAuth';
import './App.css';

// ============================================================================
// PAGE COMPONENTS
// ============================================================================

// Landing Page with UI Store Integration
const LandingPage: React.FC = () => {
  const { setCurrentRoute } = useUIStore();
  
  useEffect(() => {
    setCurrentRoute('/');
  }, [setCurrentRoute]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-pink-600 mb-4">✨ GLOW ✨</h1>
        <p className="text-lg text-gray-700 mb-8">
          Find your perfect match through Human Design compatibility
        </p>
        
        <div className="space-y-4">
          <TouchButton
            onClick={() => window.location.href = '/login'}
            variant="primary"
            size="lg"
            className="w-full"
          >
            Sign In
          </TouchButton>
          
          <TouchButton
            onClick={() => window.location.href = '/register'}
            variant="outline"
            size="lg"
            className="w-full"
          >
            Create Account
          </TouchButton>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>Discover your Magic 10 compatibility dimensions</p>
          <p>Based on Human Design principles</p>
        </div>
      </div>
    </div>
  );
};

// Enhanced Login Page with React Query
const LoginPage: React.FC = () => {
  const { login, isLoggingIn, error, clearError } = useEnhancedAuth();
  const { setCurrentRoute } = useUIStore();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  useEffect(() => {
    setCurrentRoute('/login');
    clearError(); // Clear any previous errors
  }, [setCurrentRoute, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login failed:', error);
      // Error is automatically handled by the auth store
    }
  };

  return (
    <AppLayout showNavigation={false}>
      <ResponsiveContainer className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-pink-600 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to find your perfect match</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Enter your email"
                required
                disabled={isLoggingIn}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Enter your password"
                required
                disabled={isLoggingIn}
              />
            </div>

            <TouchButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? 'Signing In...' : 'Sign In'}
            </TouchButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="/register" className="text-pink-600 hover:text-pink-700 font-medium">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </ResponsiveContainer>
    </AppLayout>
  );
};

// Enhanced Register Page with React Query
const RegisterPage: React.FC = () => {
  const { register, isRegistering, error, clearError } = useEnhancedAuth();
  const { setCurrentRoute } = useUIStore();
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
  });

  useEffect(() => {
    setCurrentRoute('/register');
    clearError(); // Clear any previous errors
  }, [setCurrentRoute, clearError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
      });
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Registration failed:', error);
      // Error is automatically handled by the auth store
    }
  };

  return (
    <AppLayout showNavigation={false}>
      <ResponsiveContainer className="min-h-screen flex items-center justify-center py-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-pink-600 mb-2">Join GLOW</h1>
            <p className="text-gray-600">Create your account to start matching</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                  disabled={isRegistering}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                  disabled={isRegistering}
                />
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
                disabled={isRegistering}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
                disabled={isRegistering}
              />
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
                disabled={isRegistering}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
                disabled={isRegistering}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
                disabled={isRegistering}
              />
            </div>

            <TouchButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isRegistering}
            >
              {isRegistering ? 'Creating Account...' : 'Create Account'}
            </TouchButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="text-pink-600 hover:text-pink-700 font-medium">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </ResponsiveContainer>
    </AppLayout>
  );
};

// Enhanced Dashboard with State Management
const DashboardPage: React.FC = () => {
  const { user, profileCompletionPercentage, userName } = useEnhancedAuth();
  const { setCurrentRoute, addNotification } = useUIStore();

  useEffect(() => {
    setCurrentRoute('/dashboard');
    
    // Welcome notification for new users
    if (user && profileCompletionPercentage < 50) {
      addNotification({
        type: 'info',
        title: 'Welcome to GLOW!',
        message: 'Complete your profile to get better matches',
        duration: 5000,
      });
    }
  }, [setCurrentRoute, user, profileCompletionPercentage, addNotification]);

  return (
    <AppLayout>
      <ResponsiveContainer>
        <div className="py-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome, {userName}! 👋
            </h1>
            <p className="text-gray-600">Ready to find your perfect match?</p>
          </div>

          <div className="space-y-4">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg p-6 text-white">
              <h2 className="text-xl font-bold mb-2">Complete Your Profile</h2>
              <p className="mb-4">Add your birth data to unlock Human Design compatibility</p>
              <div className="mb-4">
                <div className="bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-white rounded-full h-2 transition-all duration-300"
                    style={{ width: `${profileCompletionPercentage}%` }}
                  />
                </div>
                <p className="text-sm mt-1">{profileCompletionPercentage}% complete</p>
              </div>
              <TouchButton
                onClick={() => window.location.href = '/profile'}
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-pink-600"
              >
                Complete Profile
              </TouchButton>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-center">
                  <div className="text-2xl mb-2">🔍</div>
                  <h3 className="font-medium text-gray-900">Discover</h3>
                  <p className="text-sm text-gray-600">Find new matches</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-center">
                  <div className="text-2xl mb-2">💕</div>
                  <h3 className="font-medium text-gray-900">Matches</h3>
                  <p className="text-sm text-gray-600">View your matches</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Magic 10 Dimensions</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>• Physical Attraction</div>
                <div>• Emotional Connection</div>
                <div>• Intellectual Compatibility</div>
                <div>• Spiritual Alignment</div>
                <div>• Lifestyle Compatibility</div>
                <div>• Communication Style</div>
                <div>• Conflict Resolution</div>
                <div>• Intimacy Potential</div>
                <div>• Long-term Potential</div>
                <div>• Overall Compatibility</div>
              </div>
            </div>
          </div>
        </div>
      </ResponsiveContainer>
    </AppLayout>
  );
};

// ============================================================================
// ENHANCED ROUTER WITH STATE MANAGEMENT
// ============================================================================

const AppRouter: React.FC = () => {
  const { isAuthenticated, isLoading } = useEnhancedAuth();
  const { theme, isDarkMode, setTheme, setDarkMode } = useUIStore();
  const path = window.location.pathname;

  // Initialize theme
  useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setDarkMode(e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      setDarkMode(mediaQuery.matches);
      
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, setDarkMode]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Show loading while initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">✨</div>
          <p className="text-gray-600">Loading GLOW...</p>
        </div>
      </div>
    );
  }

  // Route handling
  switch (path) {
    case '/login':
      return (
        <AuthGuard requireAuth={false}>
          <LoginPage />
        </AuthGuard>
      );
    
    case '/register':
      return (
        <AuthGuard requireAuth={false}>
          <RegisterPage />
        </AuthGuard>
      );
    
    case '/dashboard':
    case '/profile':
    case '/discovery':
    case '/matches':
    case '/messages':
      return (
        <AuthGuard requireAuth={true}>
          <DashboardPage />
        </AuthGuard>
      );
    
    case '/':
    default:
      return isAuthenticated ? (
        <AuthGuard requireAuth={true}>
          <DashboardPage />
        </AuthGuard>
      ) : (
        <AuthGuard requireAuth={false}>
          <LandingPage />
        </AuthGuard>
      );
  }
};

// ============================================================================
// MAIN APP COMPONENT WITH PROVIDERS
// ============================================================================

const App: React.FC = () => {
  return (
    <QueryProvider>
      <AuthProvider>
        <div className="App">
          <AppRouter />
        </div>
      </AuthProvider>
    </QueryProvider>
  );
};

export default App;

