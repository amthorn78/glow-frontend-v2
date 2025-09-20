// FE-P0: Reader-first reflex + enum control with correlation ID and enhanced error handling

import React, { useState } from 'react';
import { useCurrentUser } from '../queries/auth/authQueries';
import { useQueryClient } from '@tanstack/react-query';
import ReadOnlyField from '../components/ReadOnlyField';
import { FormEnumSelect } from '../components/FormEnumSelect';
import { mutateWithCsrf } from '../utils/csrfMutations';
import { postSaveReflex } from '../lib/reflex';
import { FLAGS } from '../lib/flags';
import mapping from '../contracts/registry/mapping';

// Canonical pace enum and options
const PACE = ['slow', 'medium', 'fast'] as const;
const PACE_OPTS = PACE.map(v => v.charAt(0).toUpperCase() + v.slice(1));

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
  const [validationError, setValidationError] = useState('');
  
  // Single read surface - GET /api/auth/me only with strict options
  const { data: authResult } = useCurrentUser();
  


  const handlePreferredPaceChange = async (raw: string) => {
    const currentValue = getNestedValue(authResult, 'user.preferences.preferred_pace');
    const canonical = raw.toLowerCase();
    
    if (!PACE.includes(canonical as any)) return;
    if (canonical === (currentValue ?? '').toLowerCase()) return;
    
    setIsUpdating(true);
    setValidationError('');
    
    try {
      // Generate correlation ID for request tracing
      const correlationId = crypto.randomUUID();
      
      // Optional dev logging
      if (process.env.NODE_ENV === 'development') {
        console.debug('cid', correlationId);
      }
      
      // Direct PUT with correlation ID
      const response = await mutateWithCsrf('PUT', '/api/profile/preferences', { 
        preferred_pace: canonical 
      });
      
      if (response.ok) {
        // Success: use postSaveReflex for consistent reader-first behavior
        await postSaveReflex(queryClient, correlationId);
        setIsUpdating(false);
      } else {
        // Handle typed errors
        if (response.code === 'validation_error' && response.details?.preferred_pace) {
          const allowedValues = response.details.preferred_pace.allowed || PACE;
          setValidationError(`Choose one of: ${allowedValues.join(', ')}.`);
        } else if (response.error?.includes('Session security')) {
          setValidationError('Session security check failed—please reload.');
        } else {
          setValidationError('We couldn\'t save. Please try again.');
        }
        setIsUpdating(false);
      }
    } catch (error) {
      console.error('Failed to update preferred_pace:', error);
      setValidationError('We couldn\'t save. Please try again.');
      setIsUpdating(false);
    }
  };

  const renderField = (entry: any) => {
    const value = getNestedValue(authResult, entry.read_path);
    const displayValue = value || undefined; // Let ReadOnlyField handle "Not set"
    
    // Special handling for preferred_pace
    if (entry.field === 'preferred_pace') {
      const preferredPace = getNestedValue(authResult, 'user.preferences.preferred_pace');
      const isEditable = entry.field === 'preferred_pace' && entry.writer === 'preferences' && FLAGS.PACE_WRITE;
      
      if (isEditable) {
        return (
          <div key={entry.field} className="py-4 border-b border-gray-200 last:border-b-0">
            <div className="flex items-center">
              <FormEnumSelect
                label={getFieldLabel(entry.field)}
                value={(preferredPace ?? 'medium').charAt(0).toUpperCase() + (preferredPace ?? 'medium').slice(1)}
                options={PACE_OPTS}
                onChange={handlePreferredPaceChange}
                disabled={isUpdating}
              />
              {FLAGS.DEBUG_FLAGS && (
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-gray-200 font-mono">
                  PACE_WRITE:{FLAGS.PACE_WRITE ? 'true' : 'false'}
                </span>
              )}
            </div>
            {validationError && (
              <div 
                className="mt-2 text-sm text-red-600" 
                aria-live="polite"
                role="alert"
              >
                {validationError}
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div key={entry.field} className="py-4 border-b border-gray-200 last:border-b-0">
            <div className="flex items-center">
              <ReadOnlyField 
                label={getFieldLabel(entry.field)} 
                value={preferredPace}
              />
              <span className="ml-2 text-xs text-gray-500">
                (Read-only)
              </span>
              {FLAGS.DEBUG_FLAGS && (
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-gray-200 font-mono">
                  PACE_WRITE:{FLAGS.PACE_WRITE ? 'true' : 'false'}
                </span>
              )}
            </div>
          </div>
        );
      }
    }
    
    // Default to read-only for all other cases
    return (
      <ReadOnlyField 
        key={entry.field}
        label={getFieldLabel(entry.field)} 
        value={displayValue}
      />
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
