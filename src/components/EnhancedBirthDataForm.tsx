import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

interface EnhancedBirthDataFormProps {
  initialData?: {
    birthDate?: string;
    birthTime?: string;
    birthLocation?: string;
  };
  onSubmit: (data: EnhancedBirthDataFormData) => Promise<void>;
  onCancel?: () => void;
  submitButtonText?: string;
  showCancelButton?: boolean;
  isRequired?: boolean;
}

interface EnhancedBirthDataFormData {
  birthDate: string;    // YYYY-MM-DD format from HTML5 date input
  birthTime: string;    // HH:MM format from HTML5 time input
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

const EnhancedBirthDataForm: React.FC<EnhancedBirthDataFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  submitButtonText = "Save Birth Data",
  showCancelButton = false,
  isRequired = true
}) => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState<EnhancedBirthDataFormData>({
    birthDate: '',
    birthTime: '',
    location: ''
  });
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  // Calculate max date for 18+ validation
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
    .toISOString().split('T')[0];
  const minDate = '1924-01-01'; // Reasonable minimum birth year

  // Initialize form with existing data
  useEffect(() => {
    if (initialData) {
      // Convert existing birth date from dd/mmm/yyyy to yyyy-mm-dd if needed
      if (initialData.birthDate) {
        let dateValue = initialData.birthDate;
        
        // Check if it's in dd/mmm/yyyy format and convert
        if (initialData.birthDate.includes('/')) {
          const [day, monthName, year] = initialData.birthDate.split('/');
          const monthIndex = new Date(`${monthName} 1, 2000`).getMonth();
          const fullYear = year.length === 2 ? `20${year}` : year;
          dateValue = `${fullYear}-${String(monthIndex + 1).padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        setFormData(prev => ({ ...prev, birthDate: dateValue }));
      }

      // Set existing birth time (should already be in HH:MM format)
      if (initialData.birthTime) {
        setFormData(prev => ({ ...prev, birthTime: initialData.birthTime }));
      }

      // Set existing location
      if (initialData.birthLocation) {
        setFormData(prev => ({ ...prev, location: initialData.birthLocation }));
      }
    }
  }, [initialData]);

  // Location autocomplete using OpenStreetMap Nominatim API
  const searchLocations = async (query: string) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    setIsLoadingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      const data = await response.json();
      
      const suggestions = data.map((item: any) => ({
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        city: item.address?.city || item.address?.town || item.address?.village || '',
        country: item.address?.country || ''
      }));
      
      setLocationSuggestions(suggestions);
    } catch (error) {
      console.error('Location search error:', error);
      setLocationSuggestions([]);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Handle location input change
  const handleLocationChange = (value: string) => {
    setFormData(prev => ({ ...prev, location: value }));
    searchLocations(value);
  };

  // Handle location selection
  const handleLocationSelect = (suggestion: any) => {
    setFormData(prev => ({
      ...prev,
      location: suggestion.display_name,
      coordinates: {
        lat: suggestion.lat,
        lng: suggestion.lng
      }
    }));
    setLocationSuggestions([]);
  };

  // Calculate age from birth date
  const calculateAge = (birthDate: string): number => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate birth date
    if (!formData.birthDate) {
      newErrors.birthDate = 'Birth date is required';
    } else {
      const age = calculateAge(formData.birthDate);
      if (age < 18) {
        newErrors.birthDate = 'You must be 18 or older to use GLOW';
      }
    }

    // Validate birth time
    if (!formData.birthTime) {
      newErrors.birthTime = 'Birth time is required';
    }

    // Validate location
    if (!formData.location.trim()) {
      newErrors.location = 'Birth location is required';
    }

    // Age confirmation for registration
    if (isRequired && !ageConfirmed) {
      newErrors.ageConfirm = 'You must confirm you are 18 or older';
    }

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
    } catch (error) {
      console.error('Birth data submission error:', error);
      setErrors({ submit: 'Failed to save birth data. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Birth Date - Native HTML5 Date Input */}
        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
            Birth Date <span className="text-red-500">*</span>
          </label>
          <input
            id="birthDate"
            type="date"
            value={formData.birthDate}
            onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
            min={minDate}
            max={maxDate}
            className={`w-full p-4 text-lg border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.birthDate ? 'border-red-500' : 'border-gray-300'
            }`}
            style={{ minHeight: '56px' }} // Large touch target for mobile
          />
          {errors.birthDate && <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>}
          <p className="text-gray-500 text-xs mt-1">
            Must be 18 or older to use GLOW
          </p>
        </div>

        {/* Birth Time - Native HTML5 Time Input */}
        <div>
          <label htmlFor="birthTime" className="block text-sm font-medium text-gray-700 mb-2">
            Birth Time <span className="text-red-500">*</span>
          </label>
          <p className="text-gray-500 text-xs mb-3">
            Birth time is required for accurate Human Design compatibility
          </p>
          <input
            id="birthTime"
            type="time"
            value={formData.birthTime}
            onChange={(e) => setFormData(prev => ({ ...prev, birthTime: e.target.value }))}
            className={`w-full p-4 text-lg border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.birthTime ? 'border-red-500' : 'border-gray-300'
            }`}
            style={{ minHeight: '56px' }} // Large touch target for mobile
          />
          {errors.birthTime && <p className="text-red-500 text-sm mt-1">{errors.birthTime}</p>}
          <p className="text-gray-500 text-xs mt-1">
            Use 24-hour format (e.g., 14:30 for 2:30 PM)
          </p>
        </div>

        {/* Birth Location - Enhanced Autocomplete */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Birth Location <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => handleLocationChange(e.target.value)}
              placeholder="Start typing your birth city..."
              className={`w-full p-4 text-lg border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                errors.location ? 'border-red-500' : 'border-gray-300'
              }`}
              style={{ minHeight: '56px' }} // Large touch target for mobile
            />
            {isLoadingLocation && (
              <div className="absolute right-4 top-4">
                <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
              </div>
            )}
            
            {/* Location suggestions */}
            {locationSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {locationSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleLocationSelect(suggestion)}
                    className="w-full text-left p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-purple-50 focus:outline-none"
                  >
                    <div className="font-medium text-gray-800">{suggestion.city}</div>
                    <div className="text-sm text-gray-600">{suggestion.display_name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
        </div>

        {/* Age Confirmation (for registration) */}
        {isRequired && (
          <div>
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="w-5 h-5 mt-0.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                I confirm that I am 18 years or older and agree to provide accurate birth information for compatibility matching
              </span>
            </label>
            {errors.ageConfirm && <p className="text-red-500 text-sm mt-1">{errors.ageConfirm}</p>}
          </div>
        )}

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{errors.submit}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
          {showCancelButton && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:flex-1 py-4 px-6 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full sm:flex-1 py-4 px-6 rounded-lg text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600'
            }`}
            style={{ minHeight: '56px' }} // Large touch target for mobile
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Saving...</span>
              </div>
            ) : (
              submitButtonText
            )}
          </button>
        </div>
      </form>

      {/* Mobile UX Enhancement Note */}
      <div className="mt-6 p-4 bg-purple-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <div className="text-purple-500 mt-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-purple-700 font-medium">Mobile-Optimized Experience</p>
            <p className="text-xs text-purple-600 mt-1">
              This form uses native date and time pickers for the best mobile experience. 
              On mobile devices, you'll see native date wheels and time selectors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBirthDataForm;

