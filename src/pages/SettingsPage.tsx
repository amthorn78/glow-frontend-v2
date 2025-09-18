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

  // FE-HIDE-01: Feature flag to hide preferences (default OFF)
  const showPreferences = process.env.NEXT_PUBLIC_SHOW_PREFERENCES === '1';
  
  // FE-02: Single read surface - get current pace from auth/me only
  const pace = authResult?.user?.preferences?.preferred_pace ?? "medium";
  const paceOptions = ["slow","medium","fast"] as const;

  // FE-02: Draft state for immediate UI updates
  const [draftPace, setDraftPace] = useState(pace ?? "medium");

  // FE-02: Sync draft with server state
  React.useEffect(() => {
    setDraftPace(pace ?? "medium");
  }, [pace]);

  // FE-02: Dirty detection
  const dirty = draftPace !== pace;

  // FE-02: Lake-compliant save handler with no-op guard
  const handleSave = async () => {
    // FE-HIDE-01: Early return if preferences hidden
    if (!showPreferences || !dirty || isUpdating) return;
    
    setIsUpdating(true);
    setMessage(null);
    
    try {
      await mutateWithLakeReflex({ 
        url: "/api/profile/preferences", 
        method: "PUT", 
        body: { preferred_pace: draftPace } 
      }, {
        queryKeys: ['auth', 'me'],
        onSuccess: () => {
          // No optimistic updates - success UI fires AFTER refetch completes
          setMessage({ type: 'success', text: 'Preference saved.' });
        },
        onError: (error: string) => {
          // Typed error handling for session expiry
          const errorMessage = error.includes('403') || error.includes('Session') 
            ? 'Session expired—please refresh.'
            : error;
          setMessage({ type: 'error', text: errorMessage });
        }
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

          {/* FE-HIDE-01: Preferences Section (hidden by default) */}
          {showPreferences && (
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Preferences</h2>
              <FormEnumSelect
                label="Preferred pace"
                value={draftPace}
                options={paceOptions}
                onChange={setDraftPace}
                disabled={isUpdating}
                helpText="Choose how quickly we move you through questions."
                name="preferred_pace"
              />
              
              {/* FE-02: Save button with dirty guard */}
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!dirty || isUpdating}
                  className={`
                    px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${dirty && !isUpdating 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }
                  `.trim()}
                >
                  {isUpdating ? 'Saving...' : 'Save'}
                </button>
                {dirty && (
                  <span className="text-sm text-gray-500">Unsaved changes</span>
                )}
              </div>
            </div>
          )}

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

