// FE-3: Mapping-driven settings page with conditional preferred_pace editing

import React, { useState } from 'react';
import { useCurrentUser } from '../queries/auth/authQueries';
import { useQueryClient } from '@tanstack/react-query';
import ReadOnlyField from '../components/ReadOnlyField';
import { FormEnumSelect } from '../components/FormEnumSelect';
import { mutateWithLakeReflex } from '../utils/csrfMutations';
import { queryKeys } from '../providers/QueryProvider';
import { FLAGS } from '../lib/flags';
import mapping from '../contracts/registry/mapping';

// Local enum options for preferred_pace
const PACE_OPTIONS = ["slow", "medium", "fast"] as const;

// Helper to get nested value from object using dot notation
const getNestedValue = (obj: any, path: string): string | undefined => {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

// Helper to get display label for field
const getFieldLabel = (field: string): string => {
  const labels: Record<string, string> = {
    preferred_pace: "Preferred Pace",
    connection_purpose: "Connection Purpose"
  };
  return labels[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Single read surface - GET /api/auth/me only
  const { data: authResult } = useCurrentUser();
  


  const handlePreferredPaceChange = async (newValue: string) => {
    setIsUpdating(true);
    
    try {
      // Use shared reflex helper: PUT → CSRF retry → refetch ['auth','me']
      await mutateWithLakeReflex(
        'PUT',
        '/api/profile/preferences',
        { preferred_pace: newValue },
        {
          queryKeys: queryKeys.auth.me,
          onSuccess: () => {
            setIsUpdating(false);
          },
          onError: (error: string) => {
            console.error('Failed to update preferred_pace:', error);
            setIsUpdating(false);
          }
        },
        queryClient
      );
    } catch (error) {
      console.error('Failed to update preferred_pace:', error);
      setIsUpdating(false);
    }
  };

  const renderField = (entry: any) => {
    const value = getNestedValue(authResult, entry.read_path);
    const displayValue = value || undefined; // Let ReadOnlyField handle "Not set"
    
    // Precise gating: editable only when all conditions met
    const isPaceEditable = 
      entry.field === 'preferred_pace' &&
      entry.writer === 'preferences' &&
      FLAGS.PACE_WRITE;
    
    if (isPaceEditable) {
      return (
        <div key={entry.field} className="py-4 border-b border-gray-200 last:border-b-0">
          <div className="flex items-center">
            <FormEnumSelect
              label={getFieldLabel(entry.field)}
              value={value || 'medium'}
              options={[...PACE_OPTIONS]}
              onChange={handlePreferredPaceChange}
              disabled={isUpdating}
            />
            {FLAGS.DEBUG_FLAGS && (
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-gray-200">
                PACE_WRITE:{String(FLAGS.PACE_WRITE)}
              </span>
            )}
          </div>
        </div>
      );
    }
    
    // Default to read-only for all other cases
    return (
      <div key={entry.field} className="flex items-center">
        <ReadOnlyField 
          label={getFieldLabel(entry.field)} 
          value={displayValue}
        />
        {entry.field === 'preferred_pace' && FLAGS.DEBUG_FLAGS && (
          <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-gray-200">
            PACE_WRITE:{String(FLAGS.PACE_WRITE)}
          </span>
        )}
      </div>
    );
  };

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
              {mapping.map(renderField)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
