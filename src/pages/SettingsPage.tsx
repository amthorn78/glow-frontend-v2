// Settings Page - T-UI-001 Settings Route Fix
// Simple settings page with GlobalMenu integration

import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useCurrentUser } from '../queries/auth/authQueries';
import { useQueryClient } from '@tanstack/react-query';
import { mutateWithLakeReflex } from '../utils/csrfMutations';
import { FormEnumSelect } from '../components/FormEnumSelect';

const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { data: authResult } = useCurrentUser(); // Single read surface
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // D2c-SET-hotfix: Single read surface - get current pace from auth/me only
  const currentPace = authResult?.user?.preferences?.preferred_pace || 'medium';

  // D2c-SET-hotfix: Lake-compliant pace change handler
  const handlePaceChange = async (newPace: string) => {
    if (newPace === currentPace || isUpdating) return;
    setIsUpdating(true);
    setMessage(null);
    
    try {
      await mutateWithLakeReflex('PUT', '/api/profile/preferences', { preferred_pace: newPace }, {
        queryKeys: ['auth', 'me'],
        onSuccess: () => {
          // No optimistic updates - success UI fires AFTER refetch completes
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

          {/* FE-01: Preferences Section with FormEnumSelect */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Preferences</h2>
            <FormEnumSelect
              label="Preferred pace"
              value={currentPace}
              options={['slow', 'medium', 'fast']}
              onChange={handlePaceChange}
              disabled={isUpdating}
              helpText="Choose how quickly we move you through questions."
              name="preferred_pace"
            />
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

