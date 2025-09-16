// P0-FREEZE: Canonical Birth Data Form - Single Source of Truth
// Loads from /api/auth/me, saves via CSRF wrapper, invalidates & refetches

import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '../queries/auth/authQueries';
import { updateBirthDataWithCsrf } from '../utils/csrfMutations';
import { emitAuthBreadcrumb } from '../utils/authTelemetry';
import { formatTimeToHHMM } from '../utils/time';

interface BirthDataFormCanonicalProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  submitButtonText?: string;
  showCancelButton?: boolean;
  className?: string;
}

interface BirthDataFormData {
  date: string;      // YYYY-MM-DD (ISO format)
  time: string;      // HH:MM (24h format, no seconds)
  timezone: string;  // IANA timezone
  location: string;  // Free text location (REQUIRED for HD)
  latitude: number | null;   // Geocoded latitude (required for HD)
  longitude: number | null;  // Geocoded longitude (required for HD)
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
    location: '',
    latitude: null,
    longitude: null
  });
  
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
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
        location: birthData.location || '',
        latitude: birthData.latitude || null,
        longitude: birthData.longitude || null
      });
    }
  }, [currentUser]);

  // Get comprehensive IANA timezone list
  const getTimezoneList = (): string[] => {
    try {
      // Modern browsers: use runtime IANA list
      if ('supportedValuesOf' in Intl) {
        return (Intl as any).supportedValuesOf('timeZone');
      }
    } catch (error) {
      console.warn('Intl.supportedValuesOf not available, using fallback list');
    }
    
    // Fallback: comprehensive IANA timezone list
    return [
      'UTC',
      'America/New_York',
      'America/Chicago', 
      'America/Denver',
      'America/Los_Angeles',
      'America/Phoenix',
      'America/Anchorage',
      'Pacific/Honolulu',
      'America/Toronto',
      'America/Vancouver',
      'America/Montreal',
      'America/Halifax',
      'America/Mexico_City',
      'America/Sao_Paulo',
      'America/Buenos_Aires',
      'America/Lima',
      'America/Bogota',
      'America/Caracas',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Europe/Rome',
      'Europe/Madrid',
      'Europe/Amsterdam',
      'Europe/Brussels',
      'Europe/Vienna',
      'Europe/Zurich',
      'Europe/Stockholm',
      'Europe/Oslo',
      'Europe/Copenhagen',
      'Europe/Helsinki',
      'Europe/Warsaw',
      'Europe/Prague',
      'Europe/Budapest',
      'Europe/Bucharest',
      'Europe/Athens',
      'Europe/Istanbul',
      'Europe/Moscow',
      'Europe/Kiev',
      'Asia/Tokyo',
      'Asia/Seoul',
      'Asia/Shanghai',
      'Asia/Hong_Kong',
      'Asia/Singapore',
      'Asia/Bangkok',
      'Asia/Jakarta',
      'Asia/Manila',
      'Asia/Kuala_Lumpur',
      'Asia/Taipei',
      'Asia/Mumbai',
      'Asia/Kolkata',
      'Asia/Delhi',
      'Asia/Karachi',
      'Asia/Dhaka',
      'Asia/Dubai',
      'Asia/Riyadh',
      'Asia/Tehran',
      'Asia/Baghdad',
      'Asia/Jerusalem',
      'Africa/Cairo',
      'Africa/Lagos',
      'Africa/Nairobi',
      'Africa/Johannesburg',
      'Africa/Casablanca',
      'Australia/Sydney',
      'Australia/Melbourne',
      'Australia/Brisbane',
      'Australia/Perth',
      'Australia/Adelaide',
      'Pacific/Auckland',
      'Pacific/Fiji',
      'Pacific/Tahiti'
    ];
  };

  const timezoneList = getTimezoneList();

  // Location search with debouncing (OpenStreetMap geocoding)
  useEffect(() => {
    if (formData.location.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoadingLocation(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.location)}&limit=5&addressdetails=1`
        );
        const data = await response.json();
        setLocationSuggestions(data);
      } catch (error) {
        console.error('Location search error:', error);
        setLocationSuggestions([]);
      } finally {
        setIsLoadingLocation(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.location]);

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

    // Validate time (HH:MM format only, no seconds)
    if (!formData.time) {
      newErrors.time = 'Time is required';
    } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.time)) {
      newErrors.time = 'Time must be in HH:MM format';
    }

    // Validate timezone (required IANA)
    if (!formData.timezone) {
      newErrors.timezone = 'Timezone is required';
    }

    // Location validation (REQUIRED for Human Design)
    if (!formData.location.trim()) {
      newErrors.location = 'Birth location is required for Human Design calculations';
    }

    // Coordinates validation (REQUIRED for Human Design)
    if (!formData.latitude || !formData.longitude) {
      newErrors.coordinates = 'Please select a location from the suggestions to get coordinates';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

      // Prepare data for API (strict HH:mm format, snake_case keys)
      const birthDataPayload = {
        birth_date: formData.date,
        birth_time: formatTimeToHHMM(formData.time),
        birth_location: formData.location.trim()
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

  // Handle location selection from suggestions
  const handleLocationSelect = (suggestion: any) => {
    setFormData(prev => ({
      ...prev,
      location: suggestion.display_name,
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon)
    }));
    setLocationSuggestions([]);
    setErrors(prev => ({ ...prev, location: '', coordinates: '' }));
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
            {timezoneList.map(tz => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, ' ')} {/* Make timezone names more readable */}
              </option>
            ))}
          </select>
          {errors.timezone && <p className="text-red-500 text-xs mt-1">{errors.timezone}</p>}
        </div>

        {/* Birth Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Birth Location <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.location}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, location: e.target.value }));
                setErrors(prev => ({ ...prev, location: '', coordinates: '' }));
              }}
              placeholder="Enter city, state/province, country"
              maxLength={255}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                errors.location || errors.coordinates ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            
            {/* Location Suggestions */}
            {locationSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {locationSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleLocationSelect(suggestion)}
                    className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="text-sm text-gray-800">{suggestion.display_name}</div>
                  </button>
                ))}
              </div>
            )}
            
            {isLoadingLocation && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
              </div>
            )}
          </div>
          {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
          {errors.coordinates && <p className="text-red-500 text-xs mt-1">{errors.coordinates}</p>}
          <p className="text-gray-500 text-xs mt-1">
            Required for Human Design calculations - select from suggestions for coordinates
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

