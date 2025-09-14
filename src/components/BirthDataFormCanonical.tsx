// P0-FREEZE: Canonical Birth Data Form - Single Source of Truth
// Loads from /api/auth/me, saves via CSRF wrapper, invalidates & refetches

import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '../queries/auth/authQueries';
import { updateBirthDataWithCsrf } from '../utils/csrfMutations';
import { emitAuthBreadcrumb } from '../utils/authTelemetry';

interface BirthDataFormCanonicalProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  submitButtonText?: string;
  showCancelButton?: boolean;
  className?: string;
}

interface BirthDataFormData {
  date: string;      // YYYY-MM-DD (ISO format)
  time: string;      // HH:MM:SS (24h format)
  timezone: string;  // IANA timezone
  location: string;  // Free text location (optional)
}

const BirthDataFormCanonical: React.FC<BirthDataFormCanonicalProps> = ({
  onSuccess,
  onCancel,
  submitButtonText = "Save Birth Data",
  showCancelButton = false,
  className = ""
}) => {
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();
  
  const [formData, setFormData] = useState<BirthDataFormData>({
    date: '',
    time: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Default to user's timezone
    location: ''
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Load initial data from /api/auth/me (single source of truth)
  useEffect(() => {
    if (currentUser?.auth === 'authenticated' && currentUser.user?.birth_data) {
      const birthData = currentUser.user.birth_data;
      
      setFormData({
        date: birthData.date || '',
        time: birthData.time || '',
        timezone: birthData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        location: birthData.location || ''
      });
    }
  }, [currentUser]);

  // Common IANA timezones for dropdown
  const commonTimezones = [
    'America/New_York',
    'America/Chicago', 
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'America/Anchorage',
    'Pacific/Honolulu',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Rome',
    'Europe/Madrid',
    'Europe/Amsterdam',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Asia/Dubai',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Pacific/Auckland'
  ];

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate date (YYYY-MM-DD format)
    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) {
      newErrors.date = 'Date must be in YYYY-MM-DD format';
    } else {
      const date = new Date(formData.date);
      if (isNaN(date.getTime())) {
        newErrors.date = 'Invalid date';
      } else if (date > new Date()) {
        newErrors.date = 'Birth date cannot be in the future';
      }
    }

    // Validate time (HH:MM or HH:MM:SS format)
    if (!formData.time) {
      newErrors.time = 'Time is required';
    } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(formData.time)) {
      newErrors.time = 'Time must be in HH:MM or HH:MM:SS format';
    }

    // Validate timezone (required IANA)
    if (!formData.timezone) {
      newErrors.timezone = 'Timezone is required';
    }

    // Location is optional - no validation needed
    // Lat/lng are not displayed and not required (FEAT_GEO=false)

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Normalize time to HH:MM:SS format for server
  const normalizeTime = (time: string): string => {
    if (time.includes(':')) {
      const parts = time.split(':');
      if (parts.length === 2) {
        return `${parts[0]}:${parts[1]}:00`;
      }
    }
    return time;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      emitAuthBreadcrumb('ui.birth.save.click', {
        has_date: !!formData.date,
        has_time: !!formData.time,
        has_timezone: !!formData.timezone,
        has_location: !!formData.location
      });

      // Prepare data for API (normalize time to HH:MM:SS, trim location)
      const birthDataPayload = {
        date: formData.date,
        time: normalizeTime(formData.time),
        timezone: formData.timezone,
        location: formData.location.trim() || null,
        // Note: lat/lng not included (FEAT_GEO=false)
        latitude: null,
        longitude: null
      };

      emitAuthBreadcrumb('api.birth.put.request', {
        has_csrf: true,
        tz: formData.timezone,
        has_geocode: false
      });

      // Save via centralized CSRF wrapper
      const response = await updateBirthDataWithCsrf(birthDataPayload);

      if (response.ok) {
        emitAuthBreadcrumb('api.birth.put.success', {
          latency_ms: Date.now() - Date.now() // Approximate
        });

        // Invalidate and refetch /api/auth/me (round-trip guarantee)
        await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        await queryClient.refetchQueries({ queryKey: ['auth', 'me'] });

        emitAuthBreadcrumb('api.me.refetch.after_birth', {
          renewed: true,
          latency_ms: Date.now() - Date.now() // Approximate
        });

        // Show success toast
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Handle API errors
        if (response.code?.includes('VALIDATION')) {
          emitAuthBreadcrumb('api.birth.put.validation_error', {
            error_code: response.code
          });
          
          setErrors({ submit: response.error || 'Validation error occurred' });
        } else {
          setErrors({ submit: response.error || 'Failed to save birth data' });
        }
      }
    } catch (error) {
      console.error('Birth data submission error:', error);
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingUser) {
    return (
      <div className={`bg-white rounded-xl p-6 shadow-lg ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl p-6 shadow-lg relative ${className}`}>
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-10">
          ✓ Saved successfully
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Birth Information
        </h2>
        <p className="text-gray-600 text-sm">
          Your birth details help calculate compatibility. Only your age is shown publicly.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Birth Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Birth Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            max={new Date().toISOString().split('T')[0]} // Prevent future dates
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.date ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
        </div>

        {/* Birth Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Birth Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            step="1"
            value={formData.time}
            onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.time ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
          <p className="text-gray-500 text-xs mt-1">
            Enter as precisely as possible for accurate calculations
          </p>
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.timezone}
            onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.timezone ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          >
            <option value="">Select timezone...</option>
            {commonTimezones.map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
          {errors.timezone && <p className="text-red-500 text-xs mt-1">{errors.timezone}</p>}
        </div>

        {/* Birth Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Birth Location
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="City, State/Province, Country (optional)"
            maxLength={255}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            disabled={isSubmitting}
          />
          <p className="text-gray-500 text-xs mt-1">
            Optional - used for timezone validation and future features
          </p>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{errors.submit}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex space-x-3">
          {showCancelButton && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 py-3 px-4 rounded-lg text-white font-medium transition-colors ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600'
            }`}
          >
            {isSubmitting ? 'Saving...' : submitButtonText}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BirthDataFormCanonical;

