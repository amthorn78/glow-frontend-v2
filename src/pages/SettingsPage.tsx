// Settings Page - T-UI-001 Settings Route Fix
// Simple settings page with GlobalMenu integration

import React from 'react';
import { useAuthStore } from '../stores/authStore';

const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
        
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

          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Preferences</h2>
            <p className="text-sm text-gray-600">App preferences and customization options will be available here.</p>
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

