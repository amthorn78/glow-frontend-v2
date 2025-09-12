import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMagic10Store } from '../stores/magic10Store';

const MAGIC_10_DIMENSIONS = [
  { key: 'physicalAttraction', label: 'Physical Attraction', icon: '💕' },
  { key: 'emotionalConnection', label: 'Emotional Connection', icon: '💖' },
  { key: 'intellectualCompatibility', label: 'Intellectual Compatibility', icon: '🧠' },
  { key: 'spiritualAlignment', label: 'Spiritual Alignment', icon: '✨' },
  { key: 'communicationStyle', label: 'Communication Style', icon: '💬' },
  { key: 'lifestyleCompatibility', label: 'Lifestyle Compatibility', icon: '🏠' },
  { key: 'valuesAlignment', label: 'Values Alignment', icon: '⚖️' },
  { key: 'humorCompatibility', label: 'Humor Compatibility', icon: '😄' },
  { key: 'ambitionAlignment', label: 'Ambition Alignment', icon: '🎯' },
  { key: 'familyOrientation', label: 'Family Orientation', icon: '👨‍👩‍👧‍👦' }
];

const Magic10SimpleDisplay: React.FC = () => {
  const navigate = useNavigate();
  const { priorities } = useMagic10Store();

  // Sort dimensions by priority value (highest first)
  const sortedDimensions = MAGIC_10_DIMENSIONS
    .map(dim => ({
      ...dim,
      value: priorities[dim.key] || 5
    }))
    .sort((a, b) => b.value - a.value);

  const topThree = sortedDimensions.slice(0, 3);
  const hasSetPriorities = Object.keys(priorities).length > 0;

  const handleEditPriorities = () => {
    navigate('/magic10-setup');
  };

  if (!hasSetPriorities) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Magic 10 Priorities</h2>
        </div>
        
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🎯</div>
          <p className="text-gray-600 mb-4">Set your connection priorities</p>
          <button 
            onClick={handleEditPriorities}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200"
          >
            Set Your Priorities
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Magic 10 Priorities</h2>
        <button
          onClick={handleEditPriorities}
          className="text-purple-600 hover:text-purple-700 text-sm font-medium"
        >
          Edit
        </button>
      </div>

      {/* Top 3 Priorities */}
      <div className="space-y-3 mb-4">
        {topThree.map((dimension, index) => (
          <div key={dimension.key} className="flex items-center space-x-3">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold
              ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 
                index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' : 
                'bg-gradient-to-r from-orange-400 to-red-500'}
            `}>
              {index + 1}
            </div>
            <div className="text-2xl">{dimension.icon}</div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">{dimension.label}</p>
              <p className="text-sm text-gray-500">Priority: {dimension.value}/10</p>
            </div>
            <div className="text-right">
              <div className={`
                px-2 py-1 rounded text-xs font-medium
                ${dimension.value >= 8 ? 'bg-green-100 text-green-700' :
                  dimension.value >= 6 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'}
              `}>
                {dimension.value >= 8 ? 'High' : dimension.value >= 6 ? 'Medium' : 'Low'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="text-lg">✨</div>
          <div>
            <p className="text-sm font-medium text-purple-700">Your top 3 priorities get the highest compatibility scores</p>
            <p className="text-xs text-purple-600">
              Enhanced with Human Design intelligence for better matches
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Magic10SimpleDisplay;

