// Settings Page - T-UI-001 Settings Route Fix
// Simple settings page with GlobalMenu integration

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { mutateWithLakeReflex } from '../utils/csrfMutations';
import apiClient from '../core/api';

const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [currentPace, setCurrentPace] = useState<string>('medium');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // S8-D2c: Load preferences on mount
  useEffect(() => {
    apiClient.get('/api/profile/preferences')
      .then(response => response.data?.preferred_pace && setCurrentPace(response.data.preferred_pace))
      .catch(() => {}); // Default to 'medium'
  }, []);

  // S8-D2c: Handle pace change
  const handlePaceChange = async (newPace: string) => {
    if (newPace === currentPace || isUpdating) return;
    setIsUpdating(true);
    setMessage(null);
    
    try {
      await mutateWithLakeReflex('PUT', '/api/profile/preferences', { preferred_pace: newPace }, {
        queryKeys: ['auth', 'me'],
        onSuccess: () => {
          setCurrentPace(newPace);
          setMessage({ type: 'success', text: 'Preference saved.' });
        },
        onError: (error: string) => setMessage({ type: 'error', text: error })
      }, queryClient);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save preference. Please try again.' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
        
        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}
        
        <div className="space-y-6">
          {/* User Info Section */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{user?.email || 'Not available'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Display Name</label>
                <p className="mt-1 text-sm text-gray-900">{user?.display_name || 'Not set'}</p>
              </div>
            </div>
          </div>

          {/* Placeholder Sections */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Privacy & Security</h2>
            <p className="text-sm text-gray-600">Privacy and security settings will be available here.</p>
          </div>

          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Notifications</h2>
            <p className="text-sm text-gray-600">Notification preferences will be available here.</p>
          </div>

          {/* S8-D2c: Preferences Section */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Preferences</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred pace</label>
              <p className="text-sm text-gray-500 mb-3">Choose how quickly we move you through questions.</p>
              <div className="flex bg-gray-100 rounded-lg p-1 max-w-md">
                {['slow', 'medium', 'fast'].map((pace) => (
                  <button
                    key={pace}
                    onClick={() => handlePaceChange(pace)}
                    disabled={isUpdating}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      currentPace === pace ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {pace.charAt(0).toUpperCase() + pace.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Support</h2>
            <p className="text-sm text-gray-600">Help and support options will be available here.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

