import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CompatibilityDisplay } from '../components/CompatibilityDisplay';
import { useMagic10Store } from '../stores/magic10Store';
import { apiClient } from '../core/api';

interface ProfileCard {
  id: string;
  firstName: string;
  age: number;
  photos: string[];
  bio: string;
  compatibility: {
    overall: number;
    magic10Breakdown: Record<string, number>;
    insights: string[];
    hdEnhanced: boolean;
  };
  distance?: number;
}

const DiscoveryPage: React.FC = () => {
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [showCompatibility, setShowCompatibility] = useState(false);
  const { priorities } = useMagic10Store();

  // Fetch discovery profiles with HD-enhanced compatibility
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['discovery-profiles'],
    queryFn: () => apiClient.getDiscoveryProfiles(),
    select: (data) => {
      // Mock HD-enhanced profiles for demo
      return [
        {
          id: '1',
          firstName: 'Sarah',
          age: 28,
          photos: ['https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400'],
          bio: 'Love hiking, yoga, and deep conversations about life. Looking for genuine connection.',
          compatibility: {
            overall: 87,
            magic10Breakdown: {
              love: 9,
              intimacy: 8,
              communication: 9,
              friendship: 8,
              collaboration: 7,
              lifestyle: 8,
              decisions: 6,
              support: 9,
              growth: 8,
              space: 7
            },
            insights: [
              'You both highly value communication and emotional connection',
              'Your approaches to personal growth align beautifully',
              'Strong potential for deep friendship foundation'
            ],
            hdEnhanced: true
          },
          distance: 2.3
        },
        {
          id: '2',
          firstName: 'Emma',
          age: 26,
          photos: ['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400'],
          bio: 'Artist and entrepreneur. Passionate about creativity and building something meaningful together.',
          compatibility: {
            overall: 92,
            magic10Breakdown: {
              love: 8,
              intimacy: 7,
              communication: 9,
              friendship: 9,
              collaboration: 10,
              lifestyle: 8,
              decisions: 8,
              support: 8,
              growth: 9,
              space: 8
            },
            insights: [
              'Exceptional collaboration potential - you could build amazing things together',
              'Shared values around personal growth and creativity',
              'Complementary decision-making styles create balance'
            ],
            hdEnhanced: true
          },
          distance: 1.8
        },
        {
          id: '3',
          firstName: 'Maya',
          age: 30,
          photos: ['https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400'],
          bio: 'Therapist who loves nature, meditation, and helping others grow. Seeking conscious partnership.',
          compatibility: {
            overall: 78,
            magic10Breakdown: {
              love: 7,
              intimacy: 8,
              communication: 8,
              friendship: 8,
              collaboration: 6,
              lifestyle: 9,
              decisions: 7,
              support: 9,
              growth: 9,
              space: 8
            },
            insights: [
              'Strong alignment in lifestyle and personal values',
              'Both prioritize emotional support and growth',
              'Natural harmony in giving each other space'
            ],
            hdEnhanced: true
          },
          distance: 4.1
        }
      ];
    }
  });

  const currentProfile = profiles[currentProfileIndex];

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      // Handle like/match
      console.log('Liked profile:', currentProfile?.id);
    }
    
    // Move to next profile
    if (currentProfileIndex < profiles.length - 1) {
      setCurrentProfileIndex(currentProfileIndex + 1);
    } else {
      setCurrentProfileIndex(0); // Loop back to start
    }
    setShowCompatibility(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Finding your perfect matches...</p>
        </div>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No more profiles!</h2>
          <p className="text-gray-600 mb-6">Check back later for new matches.</p>
          <button
            onClick={() => setCurrentProfileIndex(0)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-pink-600">✨ Discover</h1>
          <div className="text-sm text-gray-600">
            {currentProfileIndex + 1} of {profiles.length}
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          {/* Photo */}
          <div className="relative h-96">
            <img
              src={currentProfile.photos[0]}
              alt={currentProfile.firstName}
              className="w-full h-full object-cover"
            />
            
            {/* Compatibility Badge */}
            <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 shadow-lg">
              <div className="flex items-center space-x-1">
                <span className="text-lg">✨</span>
                <span className="font-bold text-pink-600">
                  {currentProfile.compatibility.overall}%
                </span>
              </div>
            </div>

            {/* Distance */}
            {currentProfile.distance && (
              <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded-lg text-sm">
                {currentProfile.distance} miles away
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {currentProfile.firstName}, {currentProfile.age}
                </h2>
                {currentProfile.compatibility.hdEnhanced && (
                  <div className="flex items-center mt-1">
                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                      🧠 HD Enhanced
                    </span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-gray-600 mb-4">{currentProfile.bio}</p>

            {/* Compatibility Preview */}
            <div className="bg-pink-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-800">Compatibility</span>
                <button
                  onClick={() => setShowCompatibility(!showCompatibility)}
                  className="text-pink-600 text-sm hover:text-pink-700"
                >
                  {showCompatibility ? 'Hide Details' : 'View Details'}
                </button>
              </div>
              
              {!showCompatibility ? (
                <div>
                  <div className="flex items-center mb-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full"
                        style={{ width: `${currentProfile.compatibility.overall}%` }}
                      />
                    </div>
                    <span className="ml-2 font-bold text-pink-600">
                      {currentProfile.compatibility.overall}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {currentProfile.compatibility.insights[0]}
                  </p>
                </div>
              ) : (
                <CompatibilityDisplay
                  compatibility={{
                    overall: currentProfile.compatibility.overall,
                    breakdown: currentProfile.compatibility.magic10Breakdown,
                    insights: currentProfile.compatibility.insights
                  }}
                  compact={true}
                />
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-6">
          <button
            onClick={() => handleSwipe('left')}
            className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl hover:bg-gray-300 transition-colors"
          >
            ❌
          </button>
          
          <button
            onClick={() => handleSwipe('right')}
            className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-2xl text-white hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            💖
          </button>
        </div>

        {/* Instructions */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>❌ Pass • 💖 Like</p>
          <p className="mt-1">Tap compatibility to see Magic 10 breakdown</p>
        </div>
      </div>
    </div>
  );
};

export default DiscoveryPage;

