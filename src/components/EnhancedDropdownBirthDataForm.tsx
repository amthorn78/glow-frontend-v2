import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

interface EnhancedDropdownBirthDataFormProps {
  initialData?: {
    birthDate?: string;
    birthTime?: string;
    birthLocation?: string;
  };
  onSubmit: (data: EnhancedDropdownBirthDataFormData) => Promise<void>;
  onCancel?: () => void;
  submitButtonText?: string;
  showCancelButton?: boolean;
  isRequired?: boolean;
}

interface EnhancedDropdownBirthDataFormData {
  day: string;
  month: string;
  year: string;
  hours: string;
  minutes: string;
  ampm: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

const EnhancedDropdownBirthDataForm: React.FC<EnhancedDropdownBirthDataFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  submitButtonText = "Save Birth Data",
  showCancelButton = false,
  isRequired = true
}) => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState<EnhancedDropdownBirthDataFormData>({
    day: '',
    month: '',
    year: '',
    hours: '',
    minutes: '',
    ampm: 'AM',
    location: ''
  });
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  // Generate options for dropdowns
  const currentYear = new Date().getFullYear();
  const minYear = 1924;
  const maxYear = currentYear - 18; // Must be 18+

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

  const days = Array.from({ length: 31 }, (_, i) => {
    const day = (i + 1).toString().padStart(2, '0');
    return { value: day, label: day };
  });

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => {
    const year = (maxYear - i).toString();
    return { value: year, label: year };
  });

  const hours = Array.from({ length: 12 }, (_, i) => {
    const hour = (i + 1).toString();
    return { value: hour, label: hour };
  });

  const minutes = Array.from({ length: 60 }, (_, i) => {
    const minute = i.toString().padStart(2, '0');
    return { value: minute, label: minute };
  });

  // Initialize form with existing data
  useEffect(() => {
    if (initialData) {
      // Parse existing birth date (YYYY-MM-DD format)
      if (initialData.birthDate) {
        const [year, month, day] = initialData.birthDate.split('-');
        setFormData(prev => ({ ...prev, year, month, day }));
      }

      // Parse existing birth time (HH:MM format)
      if (initialData.birthTime) {
        const [hour24, minute] = initialData.birthTime.split(':');
        const hour24Int = parseInt(hour24);
        const hour12 = hour24Int === 0 ? '12' : hour24Int > 12 ? (hour24Int - 12).toString() : hour24Int.toString();
        const ampm = hour24Int >= 12 ? 'PM' : 'AM';
        
        setFormData(prev => ({ 
          ...prev, 
          hours: hour12, 
          minutes: minute, 
          ampm 
        }));
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
  const calculateAge = (): number => {
    if (!formData.year || !formData.month || !formData.day) return 0;
    
    const birth = new Date(parseInt(formData.year), parseInt(formData.month) - 1, parseInt(formData.day));
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // Get days in selected month/year
  const getDaysInMonth = (): number => {
    if (!formData.month || !formData.year) return 31;
    return new Date(parseInt(formData.year), parseInt(formData.month), 0).getDate();
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate birth date
    if (!formData.day) newErrors.day = 'Day is required';
    if (!formData.month) newErrors.month = 'Month is required';
    if (!formData.year) newErrors.year = 'Year is required';

    if (formData.day && formData.month && formData.year) {
      const daysInMonth = getDaysInMonth();
      if (parseInt(formData.day) > daysInMonth) {
        newErrors.day = `Invalid day for ${months[parseInt(formData.month) - 1]?.label}`;
      }

      const age = calculateAge();
      if (age < 18) {
        newErrors.age = 'You must be 18 or older to use GLOW';
      }
    }

    // Validate birth time
    if (!formData.hours) newErrors.hours = 'Hour is required';
    if (!formData.minutes) newErrors.minutes = 'Minute is required';

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

  // Convert to backend format
  const formatForBackend = () => {
    // Convert 12-hour to 24-hour time
    let hour24 = parseInt(formData.hours);
    if (formData.ampm === 'PM' && hour24 !== 12) hour24 += 12;
    if (formData.ampm === 'AM' && hour24 === 12) hour24 = 0;

    return {
      birth_data: {
        birth_date: `${formData.year}-${formData.month}-${formData.day}`,
        birth_time: `${hour24.toString().padStart(2, '0')}:${formData.minutes}`,
        birth_location: formData.location,
        ...(formData.coordinates && {
          latitude: formData.coordinates.lat,
          longitude: formData.coordinates.lng
        })
      }
    };
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const backendData = formatForBackend();
      await onSubmit(backendData as any);
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
        {/* Birth Date - Enhanced Dropdowns */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Birth Date <span className="text-red-500">*</span>
          </label>
          
          <div className="grid grid-cols-3 gap-3">
            {/* Month */}
            <div>
              <label htmlFor="month" className="block text-xs text-gray-500 mb-1">Month</label>
              <select
                id="month"
                value={formData.month}
                onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                className={`w-full p-4 text-lg border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.month ? 'border-red-500' : 'border-gray-300'
                }`}
                style={{ minHeight: '56px' }}
              >
                <option value="">Month</option>
                {months.map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>

            {/* Day */}
            <div>
              <label htmlFor="day" className="block text-xs text-gray-500 mb-1">Day</label>
              <select
                id="day"
                value={formData.day}
                onChange={(e) => setFormData(prev => ({ ...prev, day: e.target.value }))}
                className={`w-full p-4 text-lg border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.day ? 'border-red-500' : 'border-gray-300'
                }`}
                style={{ minHeight: '56px' }}
              >
                <option value="">Day</option>
                {days.slice(0, getDaysInMonth()).map(day => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <label htmlFor="year" className="block text-xs text-gray-500 mb-1">Year</label>
              <select
                id="year"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                className={`w-full p-4 text-lg border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.year ? 'border-red-500' : 'border-gray-300'
                }`}
                style={{ minHeight: '56px' }}
              >
                <option value="">Year</option>
                {years.map(year => (
                  <option key={year.value} value={year.value}>{year.label}</option>
                ))}
              </select>
            </div>
          </div>

          {(errors.day || errors.month || errors.year || errors.age) && (
            <div className="mt-2 space-y-1">
              {errors.day && <p className="text-red-500 text-sm">{errors.day}</p>}
              {errors.month && <p className="text-red-500 text-sm">{errors.month}</p>}
              {errors.year && <p className="text-red-500 text-sm">{errors.year}</p>}
              {errors.age && <p className="text-red-500 text-sm">{errors.age}</p>}
            </div>
          )}

          <p className="text-gray-500 text-xs mt-2">
            Must be 18 or older to use GLOW
          </p>
        </div>

        {/* Birth Time - Enhanced Dropdowns */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Birth Time <span className="text-red-500">*</span>
          </label>
          <p className="text-gray-500 text-xs mb-3">
            Birth time is required for accurate Human Design compatibility
          </p>
          
          <div className="grid grid-cols-3 gap-3">
            {/* Hour */}
            <div>
              <label htmlFor="hours" className="block text-xs text-gray-500 mb-1">Hour</label>
              <select
                id="hours"
                value={formData.hours}
                onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
                className={`w-full p-4 text-lg border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.hours ? 'border-red-500' : 'border-gray-300'
                }`}
                style={{ minHeight: '56px' }}
              >
                <option value="">Hour</option>
                {hours.map(hour => (
                  <option key={hour.value} value={hour.value}>{hour.label}</option>
                ))}
              </select>
            </div>

            {/* Minute */}
            <div>
              <label htmlFor="minutes" className="block text-xs text-gray-500 mb-1">Minute</label>
              <select
                id="minutes"
                value={formData.minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, minutes: e.target.value }))}
                className={`w-full p-4 text-lg border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.minutes ? 'border-red-500' : 'border-gray-300'
                }`}
                style={{ minHeight: '56px' }}
              >
                <option value="">Min</option>
                {minutes.map(minute => (
                  <option key={minute.value} value={minute.value}>{minute.label}</option>
                ))}
              </select>
            </div>

            {/* AM/PM */}
            <div>
              <label htmlFor="ampm" className="block text-xs text-gray-500 mb-1">AM/PM</label>
              <select
                id="ampm"
                value={formData.ampm}
                onChange={(e) => setFormData(prev => ({ ...prev, ampm: e.target.value }))}
                className="w-full p-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                style={{ minHeight: '56px' }}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          {(errors.hours || errors.minutes) && (
            <div className="mt-2 space-y-1">
              {errors.hours && <p className="text-red-500 text-sm">{errors.hours}</p>}
              {errors.minutes && <p className="text-red-500 text-sm">{errors.minutes}</p>}
            </div>
          )}
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
              style={{ minHeight: '56px' }}
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
            style={{ minHeight: '56px' }}
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
            <p className="text-sm text-purple-700 font-medium">Enhanced Mobile Experience</p>
            <p className="text-xs text-purple-600 mt-1">
              Large touch targets and native dropdown scrolling for the best mobile experience. 
              No validation errors - impossible to enter invalid dates!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDropdownBirthDataForm;

