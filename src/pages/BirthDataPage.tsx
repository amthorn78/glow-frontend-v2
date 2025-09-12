import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUpdateBirthDataMutation } from '../queries/auth/authQueries';
import BirthDataForm from '../components/BirthDataForm';

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

const BirthDataPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const updateBirthDataMutation = useUpdateBirthDataMutation();

  // Convert form data to API format
  const formatBirthData = (formData: BirthDataFormData) => {
    // Convert to dd/mmm/yyyy format
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const monthName = monthNames[parseInt(formData.month) - 1];
    const birthDate = `${formData.day}/${monthName}/${formData.year}`;
    
    // Convert to HH:MM format
    const birthTime = `${formData.hours}:${formData.minutes}`;
    
    return {
      birth_date: birthDate,
      birth_time: birthTime,
      birth_location: formData.location,
      birth_coordinates: formData.coordinates ? {
        latitude: formData.coordinates.lat,
        longitude: formData.coordinates.lng
      } : undefined
    };
  };

  const handleSubmit = async (formData: BirthDataFormData) => {
    try {
      const birthData = formatBirthData(formData);
      
      // Save birth data and trigger HD calculation
      await updateBirthDataMutation.mutateAsync(birthData);
      
      // Navigate to next step in registration (Magic 10 setup)
      navigate('/magic10-setup');
    } catch (error) {
      console.error('Failed to save birth data:', error);
      throw error; // Let the form handle the error display
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

        {/* Birth Data Form */}
        <BirthDataForm
          onSubmit={handleSubmit}
          submitButtonText="Continue to Magic 10"
          isRequired={true}
        />

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

export default BirthDataPage;

