import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import Magic10PrioritySlider from '../components/Magic10PrioritySlider';
import { useMagic10Store } from '../stores/magic10Store';
import { useAuthStore } from '../stores/authStore';
import apiClient from '../core/api';

const MAGIC_10_DIMENSIONS = [
  { 
    key: 'physicalAttraction', 
    label: 'Physical Attraction', 
    icon: '💕', 
    description: 'The spark of physical chemistry and romantic attraction',
    explanation: 'That flutter in your stomach, the magnetic pull, the way someone\'s smile makes your heart skip. Physical attraction is about the immediate chemistry that draws you to someone - not just looks, but that indefinable spark that makes you want to be close to them.'
  },
  { 
    key: 'emotionalConnection', 
    label: 'Emotional Connection', 
    icon: '💖', 
    description: 'Deep emotional understanding and vulnerability',
    explanation: 'The safety to be completely yourself, to share your fears and dreams without judgment. It\'s about finding someone who truly sees you, understands your emotional world, and creates space for both joy and tears. This is where souls meet.'
  },
  { 
    key: 'intellectualCompatibility', 
    label: 'Intellectual Compatibility', 
    icon: '🧠', 
    description: 'Mental stimulation and shared curiosity',
    explanation: 'Those conversations that make hours feel like minutes. The excitement of exploring ideas together, challenging each other\'s thinking, and discovering new perspectives. It\'s about finding someone whose mind dances with yours.'
  },
  { 
    key: 'spiritualAlignment', 
    label: 'Spiritual Alignment', 
    icon: '✨', 
    description: 'Shared values, beliefs, and life philosophy',
    explanation: 'The deeper questions of meaning, purpose, and what makes life worth living. Whether through religion, philosophy, or personal beliefs, this is about sharing a similar compass for navigating life\'s biggest questions and finding meaning together.'
  },
  { 
    key: 'communicationStyle', 
    label: 'Communication Style', 
    icon: '💬', 
    description: 'How you express and understand each other',
    explanation: 'The way you speak each other\'s language - whether that\'s through words, touch, actions, or silence. It\'s about feeling heard and understood, resolving conflicts with respect, and knowing you can talk through anything life brings.'
  },
  { 
    key: 'lifestyleCompatibility', 
    label: 'Lifestyle Compatibility', 
    icon: '🏠', 
    description: 'Daily routines, habits, and life preferences',
    explanation: 'The rhythm of everyday life together. Do you both love quiet mornings or energetic starts? Social gatherings or intimate dinners? Adventure or routine? This is about how your daily lives can flow together harmoniously.'
  },
  { 
    key: 'valuesAlignment', 
    label: 'Values Alignment', 
    icon: '⚖️', 
    description: 'Core principles and what matters most',
    explanation: 'The non-negotiables that guide your decisions - how you treat others, what you prioritize, what you stand for. When your core values align, you\'re building on the same foundation, making decisions that honor what you both hold sacred.'
  },
  { 
    key: 'humorCompatibility', 
    label: 'Humor Compatibility', 
    icon: '😄', 
    description: 'Shared laughter and playfulness',
    explanation: 'The ability to find joy together, to laugh until your sides hurt, to be silly and playful. Humor heals, connects, and lightens life\'s heavy moments. It\'s about finding someone who gets your jokes and makes you smile even on tough days.'
  },
  { 
    key: 'ambitionAlignment', 
    label: 'Ambition Alignment', 
    icon: '🎯', 
    description: 'Goals, drive, and future aspirations',
    explanation: 'The dreams you\'re chasing and the energy you bring to pursuing them. This isn\'t about having identical goals, but about supporting each other\'s growth, understanding each other\'s drive, and building a future that honors both of your aspirations.'
  },
  { 
    key: 'familyOrientation', 
    label: 'Family Orientation', 
    icon: '👨‍👩‍👧‍👦', 
    description: 'Approach to family, children, and commitment',
    explanation: 'How you envision building a life together - whether that includes children, how you relate to extended family, what commitment means to you. This is about creating a shared vision for the family you want to build or the partnership you want to nurture.'
  }
];

type SetupPhase = 'welcome' | 'setup' | 'completion';

const Magic10SetupPageEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const { priorities, setPriority, updatePriorities } = useMagic10Store();
  const { user } = useAuthStore();
  const [phase, setPhase] = useState<SetupPhase>('welcome');
  const [currentStep, setCurrentStep] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  // Load existing priorities
  const { data: existingPriorities, isLoading } = useQuery({
    queryKey: ['magic10-priorities'],
    queryFn: () => apiClient.getMagic10Priorities(),
    enabled: !!user
  });

  // Initialize priorities from backend
  useEffect(() => {
    if (existingPriorities && Object.keys(existingPriorities).length > 0) {
      updatePriorities(existingPriorities);
      // If user has existing priorities, skip welcome and go to setup
      setPhase('setup');
      setHasStarted(true);
    }
  }, [existingPriorities, updatePriorities]);

  // Save priorities mutation
  const savePrioritiesMutation = useMutation({
    mutationFn: (priorities: Record<string, number>) => 
      apiClient.updateMagic10Priorities(priorities),
    onSuccess: () => {
      setPhase('completion');
    },
    onError: (error) => {
      console.error('Failed to save priorities:', error);
    }
  });

  const handleStartSetup = () => {
    setPhase('setup');
    setHasStarted(true);
  };

  const handlePriorityChange = (dimension: string, value: number) => {
    setPriority(dimension, value);
  };

  const handleNext = () => {
    if (currentStep < MAGIC_10_DIMENSIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save all priorities
      const prioritiesToSave = MAGIC_10_DIMENSIONS.reduce((acc, dim) => {
        acc[dim.key] = priorities[dim.key] || 5;
        return acc;
      }, {} as Record<string, number>);
      
      savePrioritiesMutation.mutate(prioritiesToSave);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    navigate('/dashboard');
  };

  const handleSkip = () => {
    // Set default priorities (all 5s) and save
    const defaultPriorities = MAGIC_10_DIMENSIONS.reduce((acc, dim) => {
      acc[dim.key] = 5;
      return acc;
    }, {} as Record<string, number>);
    
    savePrioritiesMutation.mutate(defaultPriorities);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your priorities...</p>
        </div>
      </div>
    );
  }

  // Welcome Phase
  if (phase === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <div className="max-w-lg mx-auto pt-16">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-pink-600 mb-2">✨ GLOW ✨</h1>
            <p className="text-gray-600">Step 3 of 4: Magic 10 Priorities</p>
          </div>

          {/* Welcome Content */}
          <div className="bg-white rounded-xl p-8 shadow-lg mb-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Welcome to Magic 10
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Magic 10 controls who you see and who sees you. Set your priorities to weight the matching algorithm - 
                higher priorities mean you'll see more people who value the same things, and they'll see more of you too.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">⚖️</div>
                <div>
                  <h3 className="font-semibold text-gray-800">Weight the Algorithm</h3>
                  <p className="text-sm text-gray-600">Your priorities control who you see and who sees you</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="text-2xl">🎯</div>
                <div>
                  <h3 className="font-semibold text-gray-800">Bidirectional Matching</h3>
                  <p className="text-sm text-gray-600">High priorities = higher visibility both ways</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="text-2xl">✨</div>
                <div>
                  <h3 className="font-semibold text-gray-800">Enhanced with Human Design</h3>
                  <p className="text-sm text-gray-600">Your weights + HD intelligence = better matches</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={handleStartSetup}
                className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Start Setting Your Priorities
              </button>
              
              <button
                onClick={handleSkip}
                className="w-full mt-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
              >
                Skip for now (use balanced defaults)
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              ✨ GLOW - Where compatibility meets chemistry ✨
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Completion Phase
  if (phase === 'completion') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
        <div className="max-w-lg mx-auto pt-16">
          {/* Celebration */}
          <div className="bg-white rounded-xl p-8 shadow-lg text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Magic 10 Complete!
            </h2>
            <p className="text-gray-600 mb-6">
              Your priorities have been saved and your compatibility engine is now enhanced with Human Design intelligence.
            </p>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-purple-700">
                🚀 <strong>Your matches just got smarter!</strong> We'll now find people who share your top priorities and complement your Human Design profile.
              </p>
            </div>

            <button
              onClick={handleComplete}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Setup Phase
  const currentDimension = MAGIC_10_DIMENSIONS[currentStep];
  const progress = ((currentStep + 1) / MAGIC_10_DIMENSIONS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-lg mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-pink-600 mb-1">Human Design Compatibility</h1>
          <p className="text-sm text-gray-600">Setting your connection priorities with HD intelligence</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Priority {currentStep + 1} of {MAGIC_10_DIMENSIONS.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current Dimension */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">{currentDimension.icon}</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {currentDimension.label}
            </h2>
            <p className="text-gray-600 text-sm mb-4">{currentDimension.description}</p>
            
            {/* Heartfelt Explanation */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-6 border border-purple-100">
              <p className="text-sm text-gray-700 leading-relaxed italic">
                {currentDimension.explanation}
              </p>
            </div>
          </div>

          <Magic10PrioritySlider
            dimension={currentDimension.key}
            label={currentDimension.label}
            value={priorities[currentDimension.key] || 5}
            onChange={(value) => handlePriorityChange(currentDimension.key, value)}
            showLabel={false}
          />

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              1 = Not important • 5 = Somewhat important • 10 = Extremely important
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mb-4">
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
        <div className="text-center">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Skip remaining and use defaults
          </button>
        </div>

        {/* Error Display */}
        {savePrioritiesMutation.isError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">
              Failed to save priorities. Please try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Magic10SetupPageEnhanced;

