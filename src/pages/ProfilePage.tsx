import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useMagic10Store } from '../stores/magic10Store';
import { useUserBirthData } from '../queries/auth/authQueries';
import Magic10SimpleDisplay from '../components/Magic10SimpleDisplay';
import BirthDataFormCanonical from '../components/BirthDataFormCanonical';
import apiClient from '../core/api';
import { updateBasicInfoWithCsrf } from '../utils/csrfMutations';
import { useQueryClient } from '@tanstack/react-query';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const { priorities } = useMagic10Store();
  const { data: birthData } = useUserBirthData(user?.id?.toString() || '', !!user?.id);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Initialize form data with user info
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    let completed = 0;
    let total = 5;

    if (user?.first_name) completed++;
    if (user?.last_name) completed++;
    if (user?.email) completed++;
    if (birthData) completed++;
    if (priorities && Object.keys(priorities).length > 0) completed++;

    return Math.round((completed / total) * 100);
  };

  const handleBasicInfoSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // Prepare basic info payload (exclude email - that's handled separately)
      const basicInfoPayload = {
        display_name: formData.display_name || null,
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
        bio: formData.bio || null,
        age: formData.age || null,
        avatar_url: formData.avatar_url || null
      };

      // Save via centralized CSRF wrapper
      const response = await updateBasicInfoWithCsrf(basicInfoPayload);
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setEditingSection(null);
        
        // Invalidate and refetch /api/auth/me (round-trip guarantee)
        await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        await queryClient.refetchQueries({ queryKey: ['auth', 'me'] });
      } else {
        setMessage({ 
          type: 'error', 
          text: response.error || 'Failed to update profile' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to update profile. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔄</div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const completionPercentage = calculateCompletion();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-purple-600 hover:text-purple-700"
            >
              <span>←</span>
              <span>Back to Dashboard</span>
            </button>
            <div className="text-right">
              <div className="text-sm text-gray-500">Profile Completion</div>
              <div className="text-2xl font-bold text-purple-600">{completionPercentage}%</div>
            </div>
          </div>

          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl text-white">
                {user.first_name ? user.first_name.charAt(0).toUpperCase() : '👤'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {user.first_name && user.last_name 
                ? `${user.first_name} ${user.last_name}` 
                : 'Complete Your Profile'}
            </h1>
            <p className="text-gray-600">Manage your GLOW profile and connection preferences</p>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Basic Information Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Basic Information</h2>
            <button
              onClick={() => setEditingSection(editingSection === 'basic' ? null : 'basic')}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              {editingSection === 'basic' ? 'Cancel' : (
                // Single CTA: "Add" if no complete data, "Edit" if data exists
                (user?.first_name && user?.last_name && user?.email) 
                  ? 'Edit' 
                  : 'Add Basic Info'
              )}
            </button>
          </div>

          {editingSection === 'basic' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Tell others about yourself..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleBasicInfoSave}
                  disabled={loading}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditingSection(null)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">First Name</span>
                  <p className="font-medium">{user.first_name || 'Not set'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Last Name</span>
                  <p className="font-medium">{user.last_name || 'Not set'}</p>
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email</span>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Bio</span>
                <p className="font-medium">{formData.bio || 'No bio added yet'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Magic 10 Priorities Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Connection Priorities</h2>
            <button
              onClick={() => navigate('/magic10-setup')}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Edit Priorities
            </button>
          </div>
          
          <Magic10SimpleDisplay />
        </div>

        {/* Birth Data Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Birth Information</h2>
            <button
              onClick={() => setEditingSection(editingSection === 'birth' ? null : 'birth')}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              {editingSection === 'birth' ? 'Cancel' : (
                // Single CTA: "Add" if no complete data, "Edit" if data exists
                (birthData?.date && birthData?.time && birthData?.timezone && birthData?.location) 
                  ? 'Edit' 
                  : 'Add Birth Data'
              )}
            </button>
          </div>

          {editingSection === 'birth' ? (
            <BirthDataFormCanonical 
              onSuccess={() => setEditingSection(null)}
              onCancel={() => setEditingSection(null)}
              submitButtonText="Save Birth Data"
              showCancelButton={true}
              className="shadow-none p-0"
            />
          ) : (
            <div className="space-y-3">
              {birthData ? (
                <>
                  <div>
                    <span className="text-sm text-gray-500">Birth Date</span>
                    <p className="font-medium">{birthData.birth_date}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Birth Time</span>
                    <p className="font-medium">{birthData.birth_time || 'Not set'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Birth Location</span>
                    <p className="font-medium">{birthData.birth_location || 'Not set'}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 mt-4">
                    <p className="text-sm text-purple-700">
                      🔒 Your birth information is private and used only for compatibility calculations
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📅</div>
                  <p className="text-gray-600 mb-4">No birth data added yet</p>
                  <button
                    onClick={() => setEditingSection('birth')}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
                  >
                    Add Birth Information
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Account Settings Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Account Settings</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">Account Status</span>
              <p className="font-medium capitalize">{user.status}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Member Since</span>
              <p className="font-medium">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

