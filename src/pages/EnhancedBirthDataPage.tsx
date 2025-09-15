import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { updateBirthDataWithCsrf } from '../utils/csrfMutations';
import EnhancedBirthDataForm from '../components/EnhancedBirthDataForm';

interface EnhancedBirthDataFormData {
  birthDate: string;    // YYYY-MM-DD format from HTML5 date input
  birthTime: string;    // HH:MM format from HTML5 time input
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

const EnhancedBirthDataPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Convert enhanced form data to API format
  const formatBirthData = (formData: EnhancedBirthDataFormData) => {
    // The backend expects this format for the /api/profile/update-birth-data endpoint
    return {
      birth_data: {
        birth_date: formData.birthDate,        // YYYY-MM-DD (backend will store as DATE)
        birth_time: formData.birthTime,        // HH:MM (backend will store as TIME)
        birth_location: formData.location,
        // Include coordinates if available
        ...(formData.coordinates && {
          latitude: formData.coordinates.lat,
          longitude: formData.coordinates.lng
        })
      }
    };
  };

  const handleSubmit = async (formData: EnhancedBirthDataFormData) => {
    try {
      const birthData = formatBirthData(formData);
      
      console.log('save.birth.put.sent', { 
        path: '/api/profile/birth-data', 
        method: 'PUT', 
        hasCookieHeader: true 
      });
      
      // FE-CSRF-PIPE-02: Use centralized CSRF wrapper
      const response = await updateBirthDataWithCsrf(birthData);
      
      if (response.ok) {
        console.log('save.birth.put.200', { success: true });
        // Navigate to next step in registration (Magic 10 setup)
        navigate('/magic10-setup');
      } else {
        console.error('save.birth.put.error', response);
        throw new Error(response.error || 'Failed to save birth data');
      }
    } catch (error) {
      console.error('Failed to save birth data:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-pink-600 mb-2">✨ GLOW ✨</h1>
          <p className="text-gray-600">Step 2 of 4: Birth Information</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Account</span>
            <span className="font-medium text-purple-600">Birth Data</span>
            <span>Priorities</span>
            <span>Profile</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full w-1/2"></div>
          </div>
        </div>

        {/* Enhanced Birth Data Form */}
        <EnhancedBirthDataForm
          onSubmit={handleSubmit}
          submitButtonText="Continue to Magic 10"
          isRequired={true}
        />

        {/* Mobile UX Information */}
        <div className="mt-8 p-4 bg-white rounded-lg shadow-sm border border-purple-100">
          <div className="text-center">
            <div className="text-purple-500 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-800 mb-1">Enhanced Mobile Experience</h3>
            <p className="text-xs text-gray-600">
              This form is optimized for mobile devices with native date and time pickers. 
              On mobile, you'll see device-native controls for the best user experience.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            ✨ GLOW - Where compatibility meets chemistry ✨
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBirthDataPage;

