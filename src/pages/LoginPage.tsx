// Login Page - Auth v2 Cookie Model with Deterministic Handshake
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useLoginMutation } from '../queries/auth/authQueries';
import { PublicOnlyRoute } from '../components/PublicOnlyRoute';
import apiClient from '../core/api';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const loginMutation = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('auth.login.submit', { email: formData.email, path: window.location.pathname });
      
      const response = await loginMutation.mutateAsync(formData);
      
      if (response.ok) {
        console.log('auth.login.success', { hasUser: !!response.user });
        
        // FE-AUTH-ORCH-01: Deterministic Login Handshake
        // Step 1: Store returnTo for navigation
        const searchParams = new URLSearchParams(location.search);
        const returnTo = searchParams.get('returnTo');
        
        if (returnTo) {
          try {
            const decodedReturnTo = decodeURIComponent(returnTo);
            // Validate returnTo is a relative path
            if (decodedReturnTo.startsWith('/') && !decodedReturnTo.startsWith('//')) {
              sessionStorage.setItem('auth-returnTo', decodedReturnTo);
            }
          } catch (error) {
            console.warn('Invalid returnTo parameter:', returnTo);
          }
        }
        
        // Step 2: Await real GET /api/auth/me (200) before navigation
        await performDeterministicHandshake();
      }
    } catch (error) {
      console.error('auth.login.error', error);
    }
  };

  const performDeterministicHandshake = async () => {
    const HANDSHAKE_TIMEOUT = 2000; // 2 seconds as per spec
    const startTime = Date.now();
    
    console.log('auth.me.probe.start', { timeout: HANDSHAKE_TIMEOUT });
    
    try {
      // Direct /api/auth/me call with timeout
      const meResponse = await Promise.race([
        apiClient.getCurrentUser(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Handshake timeout')), HANDSHAKE_TIMEOUT)
        )
      ]) as any;
      
      const elapsed = Date.now() - startTime;
      
      if (meResponse.data?.auth === 'authenticated' && meResponse.data?.user) {
        console.log('auth.me.200', { 
          userId: meResponse.data.user.id, 
          isAdmin: meResponse.data.user.is_admin,
          elapsed 
        });
        
        // FE-ADMIN-BP-02: Admin Bypass Logic
        const targetPath = determineNavigationTarget(meResponse.data.user);
        
        console.log('auth.navigate.begin', { 
          target: targetPath, 
          reason: 'handshake_success' 
        });
        
        // Hard navigate as per spec
        window.location.assign(targetPath);
        
      } else {
        console.log('auth.me.401', { elapsed });
        throw new Error('Authentication failed during handshake');
      }
      
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.log('auth.me.timeout', { elapsed, error: error.message });
      
      // Break-glass: hard reload once
      console.log('auth.reload.breakglass', { reason: 'handshake_failed' });
      window.location.reload();
    }
  };

  const determineNavigationTarget = (user: any): string => {
    // FE-ADMIN-BP-02: Admin always goes to dashboard
    if (user.is_admin) {
      return '/dashboard';
    }
    
    // Check for stored returnTo
    const returnTo = sessionStorage.getItem('auth-returnTo');
    if (returnTo) {
      sessionStorage.removeItem('auth-returnTo');
      return returnTo;
    }
    
    // Non-admin without birth data goes to birth-data page
    // This will be handled by ProtectedRoute guard
    return '/dashboard';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <PublicOnlyRoute>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-pink-600 mb-2">✨ GLOW ✨</h1>
            <p className="text-gray-600">Welcome back to your connection journey</p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Sign In</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
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
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              {/* Password Field */}
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
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>

              {/* Error Display */}
              {loginMutation.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">
                    {loginMutation.error.message || 'Login failed. Please try again.'}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Links */}
            <div className="mt-6 text-center space-y-2">
              <Link 
                to="/forgot-password" 
                className="text-pink-600 hover:text-pink-700 text-sm font-medium"
              >
                Forgot your password?
              </Link>
              
              <div className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <Link 
                  to="/register" 
                  className="text-pink-600 hover:text-pink-700 font-medium"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Link 
              to="/" 
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </PublicOnlyRoute>
  );
};

export default LoginPage;

