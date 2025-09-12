import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

interface BirthDataFormProps {
  initialData?: {
    birthDate?: string;
    birthTime?: string;
    birthLocation?: string;
  };
  onSubmit: (data: BirthDataFormData) => Promise<void>;
  onCancel?: () => void;
  submitButtonText?: string;
  showCancelButton?: boolean;
  isRequired?: boolean;
}

interface BirthDataFormData {
  day: string;
  month: string;
  year: string;
  hours: string;
  minutes: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

const BirthDataForm: React.FC<BirthDataFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  submitButtonText = "Save Birth Data",
  showCancelButton = false,
  isRequired = true
}) => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState<BirthDataFormData>({
    day: '',
    month: '',
    year: '',
    hours: '',
    minutes: '',
    location: ''
  });
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  // Generate dropdown options
  const days = Array.from({ length: 31 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: String(i + 1)
  }));

  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1924 + 1 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i)
  }));

  const hours = Array.from({ length: 24 }, (_, i) => ({
    value: String(i).padStart(2, '0'),
    label: `${String(i).padStart(2, '0')}:00`
  }));

  const minutes = Array.from({ length: 60 }, (_, i) => ({
    value: String(i).padStart(2, '0'),
    label: String(i).padStart(2, '0')
  }));

  // Initialize form with existing data
  useEffect(() => {
    if (initialData) {
      // Parse existing birth date (dd/mmm/yyyy format)
      if (initialData.birthDate) {
        const [day, monthName, year] = initialData.birthDate.split('/');
        const monthIndex = new Date(`${monthName} 1, 2000`).getMonth() + 1;
        setFormData(prev => ({
          ...prev,
          day: day.padStart(2, '0'),
          month: String(monthIndex).padStart(2, '0'),
          year: year
        }));
      }

      // Parse existing birth time (HH:MM format)
      if (initialData.birthTime) {
        const [hours, minutes] = initialData.birthTime.split(':');
        setFormData(prev => ({
          ...prev,
          hours: hours.padStart(2, '0'),
          minutes: minutes.padStart(2, '0')
        }));
      }

      // Set existing location
      if (initialData.birthLocation) {
        setFormData(prev => ({
          ...prev,
          location: initialData.birthLocation
        }));
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

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate date
    if (!formData.day) newErrors.day = 'Day is required';
    if (!formData.month) newErrors.month = 'Month is required';
    if (!formData.year) newErrors.year = 'Year is required';

    // Validate date is valid
    if (formData.day && formData.month && formData.year) {
      const date = new Date(parseInt(formData.year), parseInt(formData.month) - 1, parseInt(formData.day));
      if (date.getDate() !== parseInt(formData.day)) {
        newErrors.day = 'Invalid date';
      }

      // Check age (must be 18+)
      const today = new Date();
      const birthDate = new Date(parseInt(formData.year), parseInt(formData.month) - 1, parseInt(formData.day));
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (age < 18 || (age === 18 && monthDiff < 0) || (age === 18 && monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        newErrors.age = 'You must be 18 or older to use GLOW';
      }
    }

    // Validate time
    if (!formData.hours) newErrors.hours = 'Hour is required';
    if (!formData.minutes) newErrors.minutes = 'Minute is required';

    // Validate location
    if (!formData.location.trim()) newErrors.location = 'Birth location is required';

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
        {/* Birth Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Birth Date <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {/* Day */}
            <div>
              <select
                value={formData.day}
                onChange={(e) => setFormData(prev => ({ ...prev, day: e.target.value }))}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.day ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Day</option>
                {days.map(day => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
              {errors.day && <p className="text-red-500 text-xs mt-1">{errors.day}</p>}
            </div>

            {/* Month */}
            <div>
              <select
                value={formData.month}
                onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.month ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Month</option>
                {months.map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
              {errors.month && <p className="text-red-500 text-xs mt-1">{errors.month}</p>}
            </div>

            {/* Year */}
            <div>
              <select
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.year ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Year</option>
                {years.map(year => (
                  <option key={year.value} value={year.value}>{year.label}</option>
                ))}
              </select>
              {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
            </div>
          </div>
          {errors.age && <p className="text-red-500 text-sm mt-2">{errors.age}</p>}
        </div>

        {/* Birth Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Birth Time <span className="text-red-500">*</span>
          </label>
          <p className="text-gray-500 text-xs mb-3">
            Birth time is required for accurate Human Design compatibility
          </p>
          <div className="grid grid-cols-2 gap-3">
            {/* Hours */}
            <div>
              <select
                value={formData.hours}
                onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.hours ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Hour</option>
                {hours.map(hour => (
                  <option key={hour.value} value={hour.value}>{hour.label}</option>
                ))}
              </select>
              {errors.hours && <p className="text-red-500 text-xs mt-1">{errors.hours}</p>}
            </div>

            {/* Minutes */}
            <div>
              <select
                value={formData.minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, minutes: e.target.value }))}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.minutes ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Minute</option>
                {minutes.map(minute => (
                  <option key={minute.value} value={minute.value}>{minute.label}</option>
                ))}
              </select>
              {errors.minutes && <p className="text-red-500 text-xs mt-1">{errors.minutes}</p>}
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
              onChange={(e) => handleLocationChange(e.target.value)}
              placeholder="Start typing your birth city..."
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                errors.location ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {isLoadingLocation && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full"></div>
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
                    className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-800">{suggestion.city}</div>
                    <div className="text-sm text-gray-600">{suggestion.display_name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
        </div>

        {/* Age Confirmation (for registration) */}
        {isRequired && (
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">
                I confirm that I am 18 years or older
              </span>
            </label>
            {errors.ageConfirm && <p className="text-red-500 text-xs mt-1">{errors.ageConfirm}</p>}
          </div>
        )}

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
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
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

export default BirthDataForm;

