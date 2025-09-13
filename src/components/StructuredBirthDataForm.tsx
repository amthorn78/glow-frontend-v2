import React, { useState, useEffect } from 'react';

interface BirthFormData {
  year: number | null;
  month: number | null; // 1-12
  day: number | null;   // 1-31
  hour: number | null;  // 0-23 or null if unknown
  minute: number | null;// 0-59 or null if unknown
  unknownTime: boolean;
  tz: string;           // IANA TZ (e.g. "America/New_York")
  lat: number | null;
  lng: number | null;
  location: string;     // Display name for location
}

interface StructuredBirthDataFormProps {
  initialData?: {
    birthDate?: string;
    birthTime?: string;
    birthLocation?: string;
    latitude?: number;
    longitude?: number;
  };
  onSubmit: (data: BirthFormData) => Promise<void>;
  onCancel?: () => void;
  submitButtonText?: string;
  showCancelButton?: boolean;
  isRequired?: boolean;
}

const StructuredBirthDataForm: React.FC<StructuredBirthDataFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  submitButtonText = "Save Birth Data",
  showCancelButton = false,
  isRequired = true
}) => {
  const [formData, setFormData] = useState<BirthFormData>({
    year: null,
    month: null,
    day: null,
    hour: null,
    minute: null,
    unknownTime: false,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    lat: null,
    lng: null,
    location: ''
  });

  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data from props
  useEffect(() => {
    if (initialData) {
      const newFormData: BirthFormData = { ...formData };
      
      // Parse birth date (YYYY-MM-DD)
      if (initialData.birthDate) {
        const dateParts = initialData.birthDate.split('-');
        if (dateParts.length === 3) {
          newFormData.year = parseInt(dateParts[0]);
          newFormData.month = parseInt(dateParts[1]);
          newFormData.day = parseInt(dateParts[2]);
        }
      }
      
      // Parse birth time (HH:MM or HH:MM:SS)
      if (initialData.birthTime) {
        const timeParts = initialData.birthTime.split(':');
        if (timeParts.length >= 2) {
          newFormData.hour = parseInt(timeParts[0]);
          newFormData.minute = parseInt(timeParts[1]);
          newFormData.unknownTime = false;
        }
      } else {
        newFormData.unknownTime = true;
      }
      
      // Set location data
      if (initialData.birthLocation) {
        newFormData.location = initialData.birthLocation;
      }
      if (initialData.latitude && initialData.longitude) {
        newFormData.lat = initialData.latitude;
        newFormData.lng = initialData.longitude;
      }
      
      setFormData(newFormData);
    }
  }, [initialData]);

  // Helper function to get days in month (handles leap years)
  const daysInMonth = (year: number, month: number): number => {
    return new Date(year, month, 0).getDate(); // month is 1-12, but Date constructor expects 0-11
  };

  // Generate arrays for dropdowns
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 18 - i);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];
  
  // Dynamic days based on selected year and month
  const days = formData.year && formData.month 
    ? Array.from({ length: daysInMonth(formData.year, formData.month) }, (_, i) => i + 1)
    : [];

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  // Location search with debouncing
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

  // Client-side validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.year) newErrors.year = "Select a year";
    if (!formData.month) newErrors.month = "Select a month";
    if (!formData.day) newErrors.day = "Select a day";
    
    // Validate day is valid for selected month/year
    if (formData.year && formData.month && formData.day) {
      const maxDays = daysInMonth(formData.year, formData.month);
      if (formData.day > maxDays) {
        newErrors.day = `Invalid day for ${months.find(m => m.value === formData.month)?.label} ${formData.year}`;
      }
    }

    // Time validation (always required)
    if (formData.hour === null) newErrors.hour = "Select an hour";
    if (formData.minute === null) newErrors.minute = "Select a minute";

    // Location validation
    if (!formData.location.trim()) newErrors.location = "Enter your birth location";
    if (!formData.lat || !formData.lng) newErrors.coordinates = "Select a location from the suggestions";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error: any) {
      console.error('Birth data submission error:', error);
      
      // Handle server validation errors
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ submit: error.message || 'Failed to save birth data. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle location selection
  const handleLocationSelect = (suggestion: any) => {
    setFormData(prev => ({
      ...prev,
      location: suggestion.display_name,
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon)
    }));
    setLocationSuggestions([]);
    setErrors(prev => ({ ...prev, location: '', coordinates: '' }));
  };

  // Check if form is valid for submission
  const isFormValid = formData.year && formData.month && formData.day && 
    formData.location.trim() && formData.lat && formData.lng &&
    formData.hour !== null && formData.minute !== null;

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {isRequired ? 'Complete Your Profile' : 'Update Birth Information'}
        </h2>
        <p className="text-gray-600 text-sm">
          We need your exact birth date, time, and location to calculate compatibility matches
        </p>
        <p className="text-gray-500 text-xs mt-1">
          Your birth details are private - only your age is shown on your profile
        </p>
      </div>

      {errors.submit && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{errors.submit}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Birth Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Birth Date <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {/* Year */}
            <div>
              <select
                value={formData.year || ''}
                onChange={(e) => {
                  const year = e.target.value ? parseInt(e.target.value) : null;
                  setFormData(prev => ({ 
                    ...prev, 
                    year,
                    day: null // Reset day when year changes (for leap year handling)
                  }));
                  setErrors(prev => ({ ...prev, year: '', day: '' }));
                }}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base ${
                  errors.year ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Year</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
            </div>

            {/* Month */}
            <div>
              <select
                value={formData.month || ''}
                onChange={(e) => {
                  const month = e.target.value ? parseInt(e.target.value) : null;
                  setFormData(prev => ({ 
                    ...prev, 
                    month,
                    day: null // Reset day when month changes
                  }));
                  setErrors(prev => ({ ...prev, month: '', day: '' }));
                }}
                disabled={!formData.year}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base ${
                  errors.month ? 'border-red-500' : 'border-gray-300'
                } ${!formData.year ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">Month</option>
                {months.map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
              {errors.month && <p className="text-red-500 text-xs mt-1">{errors.month}</p>}
            </div>

            {/* Day */}
            <div>
              <select
                value={formData.day || ''}
                onChange={(e) => {
                  const day = e.target.value ? parseInt(e.target.value) : null;
                  setFormData(prev => ({ ...prev, day }));
                  setErrors(prev => ({ ...prev, day: '' }));
                }}
                disabled={!formData.year || !formData.month}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base ${
                  errors.day ? 'border-red-500' : 'border-gray-300'
                } ${!formData.year || !formData.month ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">Day</option>
                {days.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
              {errors.day && <p className="text-red-500 text-xs mt-1">{errors.day}</p>}
            </div>
          </div>
        </div>

        {/* Birth Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Birth Time <span className="text-red-500">*</span>
          </label>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Hour */}
            <div>
              <select
                value={formData.hour !== null ? formData.hour : ''}
                onChange={(e) => {
                  const hour = e.target.value !== '' ? parseInt(e.target.value) : null;
                  setFormData(prev => ({ ...prev, hour }));
                  setErrors(prev => ({ ...prev, hour: '' }));
                }}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base ${
                  errors.hour ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Hour</option>
                {hours.map(hour => (
                  <option key={hour} value={hour}>
                    {hour.toString().padStart(2, '0')}:00 ({hour === 0 ? '12' : hour > 12 ? hour - 12 : hour} {hour < 12 ? 'AM' : 'PM'})
                  </option>
                ))}
              </select>
              {errors.hour && <p className="text-red-500 text-xs mt-1">{errors.hour}</p>}
            </div>

            {/* Minute */}
            <div>
              <select
                value={formData.minute !== null ? formData.minute : ''}
                onChange={(e) => {
                  const minute = e.target.value !== '' ? parseInt(e.target.value) : null;
                  setFormData(prev => ({ ...prev, minute }));
                  setErrors(prev => ({ ...prev, minute: '' }));
                }}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base ${
                  errors.minute ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Minute</option>
                {minutes.map(minute => (
                  <option key={minute} value={minute}>
                    :{minute.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
              {errors.minute && <p className="text-red-500 text-xs mt-1">{errors.minute}</p>}
            </div>
          </div>
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
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base ${
                errors.location || errors.coordinates ? 'border-red-500' : 'border-gray-300'
              }`}
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
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`flex-1 py-3 px-6 rounded-lg font-medium text-base transition-colors ${
              isFormValid && !isSubmitting
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Saving...' : submitButtonText}
          </button>
          
          {showCancelButton && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-base"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default StructuredBirthDataForm;

