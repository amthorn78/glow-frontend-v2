// Simple settings page with read-only preferences display

import React from 'react';
import { useCurrentUser } from '../queries/auth/authQueries';
import ReadOnlyField from '../components/ReadOnlyField';

const SettingsPage: React.FC = () => {
  // Single read surface - GET /api/auth/me only
  const { data: authResult } = useCurrentUser();
  
  // Extract preferred_pace from server state
  const preferredPace = authResult?.user?.preferences?.preferred_pace;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your account preferences and settings.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Preferences
            </h2>
            
            <div className="space-y-0">
              <ReadOnlyField 
                label="Preferred pace" 
                value={preferredPace}
              />
              <ReadOnlyField 
                label="Connection purpose" 
                showChip={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
