import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Magic10PrioritySlider } from '../components/Magic10PrioritySlider';
import { useMagic10Store } from '../stores/magic10Store';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../core/api';

const MAGIC_10_DIMENSIONS = [
  { key: 'love', label: 'Love', icon: '💕', description: 'Romantic connection and passion' },
  { key: 'intimacy', label: 'Intimacy', icon: '🤗', description: 'Physical and emotional closeness' },
  { key: 'communication', label: 'Communication', icon: '💬', description: 'How you connect and share' },
  { key: 'friendship', label: 'Friendship', icon: '👫', description: 'Foundation of companionship' },
  { key: 'collaboration', label: 'Collaboration', icon: '🤝', description: 'Working together as a team' },
  { key: 'lifestyle', label: 'Lifestyle', icon: '🏠', description: 'Daily life compatibility' },
  { key: 'decisions', label: 'Decisions', icon: '⚖️', description: 'How you make choices together' },
  { key: 'support', label: 'Support', icon: '🛡️', description: 'Being there for each other' },
  { key: 'growth', label: 'Growth', icon: '🌱', description: 'Personal development together' },
  { key: 'space', label: 'Space', icon: '🌌', description: 'Independence and boundaries' }
];

const Magic10SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { priorities, setPriority } = useMagic10Store();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);

  // Load existing priorities
  const { data: existingPriorities } = useQuery({
    queryKey: ['magic10-priorities'],
    queryFn: () => apiClient.getMagic10Priorities(),
    enabled: !!user
  });

  // Save priorities mutation
  const savePrioritiesMutation = useMutation({
    mutationFn: (priorities: Record<string, number>) => 
      apiClient.updateMagic10Priorities(priorities),
    onSuccess: () => {
      navigate('/discovery');
    }
  });

  const handlePriorityChange = (dimension: string, value: number) => {
    setPriority(dimension, value);
  };

  const handleNext = () => {
    if (currentStep < MAGIC_10_DIMENSIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save all priorities
      savePrioritiesMutation.mutate(priorities);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentDimension = MAGIC_10_DIMENSIONS[currentStep];
  const progress = ((currentStep + 1) / MAGIC_10_DIMENSIONS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-pink-600 mb-2">✨ Magic 10 Setup</h1>
          <p className="text-gray-600">Set your relationship priorities for better matches</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Step {currentStep + 1} of {MAGIC_10_DIMENSIONS.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current Dimension */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">{currentDimension.icon}</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {currentDimension.label}
            </h2>
            <p className="text-gray-600">{currentDimension.description}</p>
          </div>

          <Magic10PrioritySlider
            dimension={currentDimension.key}
            label={currentDimension.label}
            value={priorities[currentDimension.key] || 5}
            onChange={(value) => handlePriorityChange(currentDimension.key, value)}
            showLabel={false}
          />

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              How important is {currentDimension.label.toLowerCase()} in your ideal relationship?
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-6 py-3 border-2 border-gray-300 text-gray-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200"
          >
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={savePrioritiesMutation.isPending}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
          >
            {currentStep === MAGIC_10_DIMENSIONS.length - 1 
              ? (savePrioritiesMutation.isPending ? 'Saving...' : 'Complete Setup')
              : 'Next'
            }
          </button>
        </div>

        {/* Skip Option */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/discovery')}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Skip for now (use default priorities)
          </button>
        </div>
      </div>
    </div>
  );
};

export default Magic10SetupPage;

