import React, { useState } from 'react';
import { useUserBirthData, useUpdateBirthDataMutation } from '../queries/auth/authQueries';
import BirthDataForm from './BirthDataForm';

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

const ProfileBirthDataSection: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { data: birthData, isLoading } = useUserBirthData();
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
      const birthDataFormatted = formatBirthData(formData);
      
      // Save birth data and trigger HD recalculation
      await updateBirthDataMutation.mutateAsync(birthDataFormatted);
      
      // Exit edit mode
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update birth data:', error);
      throw error; // Let the form handle the error display
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // Calculate age from birth data
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    
    try {
      const [day, monthName, year] = birthDate.split('/');
      const monthIndex = new Date(`${monthName} 1, 2000`).getMonth();
      const birth = new Date(parseInt(year), monthIndex, parseInt(day));
      const today = new Date();
      
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <BirthDataForm
        initialData={{
          birthDate: birthData?.birth_date,
          birthTime: birthData?.birth_time,
          birthLocation: birthData?.birth_location
        }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitButtonText="Update Birth Data"
        showCancelButton={true}
        isRequired={false}
      />
    );
  }

  const age = birthData?.birth_date ? calculateAge(birthData.birth_date) : null;

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Birth Information</h2>
        <button
          onClick={() => setIsEditing(true)}
          className="text-purple-600 hover:text-purple-700 text-sm font-medium"
        >
          Edit
        </button>
      </div>

      {birthData ? (
        <div className="space-y-4">
          {/* Age Display */}
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🎂</div>
            <div>
              <p className="font-medium text-gray-800">Age</p>
              <p className="text-gray-600">{age ? `${age} years old` : 'Age not calculated'}</p>
            </div>
          </div>

          {/* Birth Date */}
          <div className="flex items-center space-x-3">
            <div className="text-2xl">📅</div>
            <div>
              <p className="font-medium text-gray-800">Birth Date</p>
              <p className="text-gray-600">{birthData.birth_date || 'Not set'}</p>
            </div>
          </div>

          {/* Birth Time */}
          <div className="flex items-center space-x-3">
            <div className="text-2xl">⏰</div>
            <div>
              <p className="font-medium text-gray-800">Birth Time</p>
              <p className="text-gray-600">{birthData.birth_time || 'Not set'}</p>
            </div>
          </div>

          {/* Birth Location */}
          <div className="flex items-center space-x-3">
            <div className="text-2xl">📍</div>
            <div>
              <p className="font-medium text-gray-800">Birth Location</p>
              <p className="text-gray-600">{birthData.birth_location || 'Not set'}</p>
            </div>
          </div>

          {/* Human Design Status */}
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="text-lg">✨</div>
              <div>
                <p className="text-sm font-medium text-purple-700">Human Design Enhanced</p>
                <p className="text-xs text-purple-600">
                  Your compatibility scores are enhanced with Human Design intelligence
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📅</div>
          <p className="text-gray-600 mb-4">Birth information not set</p>
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200"
          >
            Add Birth Information
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileBirthDataSection;

