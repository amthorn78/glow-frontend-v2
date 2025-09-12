import React, { useState, useEffect } from 'react';
import { useMagic10Store } from '../stores/magic10Store';
import { useAuthStore } from '../stores/authStore';

// Individual Priority Bar Component
const PriorityBar: React.FC<{ 
  dimension: string; 
  value: number; 
  color: string;
  isEditing: boolean;
  onChange: (value: number) => void;
}> = ({ dimension, value, color, isEditing, onChange }) => {
  const percentage = (value / 10) * 100;
  
  const dimensionLabels: { [key: string]: string } = {
    physicalAttraction: 'Physical Attraction',
    emotionalConnection: 'Emotional Connection',
    intellectualCompatibility: 'Intellectual Compatibility',
    spiritualAlignment: 'Spiritual Alignment',
    communicationStyle: 'Communication Style',
    lifestyleCompatibility: 'Lifestyle Compatibility',
    valuesAlignment: 'Values Alignment',
    humorCompatibility: 'Humor Compatibility',
    ambitionAlignment: 'Ambition Alignment',
    familyOrientation: 'Family Orientation'
  };

  const displayName = dimensionLabels[dimension] || dimension;

  if (isEditing) {
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">{displayName}</label>
          <span className="text-sm font-bold text-gray-900">{value}</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className={`w-full h-2 rounded-lg appearance-none cursor-pointer slider-${color}`}
          style={{
            background: `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1</span>
          <span>5</span>
          <span>10</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{displayName}</span>
        <span className="text-sm font-bold text-gray-900">{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="h-2 rounded-full transition-all duration-300"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: color
          }}
        ></div>
      </div>
    </div>
  );
};

// Priority Grid Component
const PriorityGrid: React.FC<{ 
  priorities: any; 
  isEditing: boolean;
  onPriorityChange: (dimension: string, value: number) => void;
}> = ({ priorities, isEditing, onPriorityChange }) => {
  const dimensionColors: { [key: string]: string } = {
    physicalAttraction: '#ec4899',      // Pink
    emotionalConnection: '#f59e0b',     // Amber
    intellectualCompatibility: '#3b82f6', // Blue
    spiritualAlignment: '#8b5cf6',      // Purple
    communicationStyle: '#10b981',      // Emerald
    lifestyleCompatibility: '#f97316',  // Orange
    valuesAlignment: '#6366f1',         // Indigo
    humorCompatibility: '#84cc16',      // Lime
    ambitionAlignment: '#ef4444',       // Red
    familyOrientation: '#06b6d4'        // Cyan
  };

  return (
    <div className="space-y-2">
      {Object.entries(priorities).map(([dimension, value]) => (
        <PriorityBar
          key={dimension}
          dimension={dimension}
          value={value as number}
          color={dimensionColors[dimension] || '#6b7280'}
          isEditing={isEditing}
          onChange={(newValue) => onPriorityChange(dimension, newValue)}
        />
      ))}
    </div>
  );
};

// Priority Summary Component
const PrioritySummary: React.FC<{ priorities: any }> = ({ priorities }) => {
  const topPriorities = Object.entries(priorities)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 3);

  const dimensionLabels: { [key: string]: string } = {
    physicalAttraction: 'Physical Attraction',
    emotionalConnection: 'Emotional Connection',
    intellectualCompatibility: 'Intellectual Compatibility',
    spiritualAlignment: 'Spiritual Alignment',
    communicationStyle: 'Communication Style',
    lifestyleCompatibility: 'Lifestyle Compatibility',
    valuesAlignment: 'Values Alignment',
    humorCompatibility: 'Humor Compatibility',
    ambitionAlignment: 'Ambition Alignment',
    familyOrientation: 'Family Orientation'
  };

  return (
    <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-lg mb-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-2">Your Top Priorities</h3>
      <div className="space-y-1">
        {topPriorities.map(([dimension, value], index) => (
          <div key={dimension} className="flex justify-between items-center">
            <span className="text-sm text-gray-700">
              {index + 1}. {dimensionLabels[dimension] || dimension}
            </span>
            <span className="text-sm font-bold text-purple-600">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Magic 10 Display Component
const Magic10Display: React.FC = () => {
  const { priorities, updatePriorities, isLoading } = useMagic10Store();
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [localPriorities, setLocalPriorities] = useState(priorities);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalPriorities(priorities);
  }, [priorities]);

  const handlePriorityChange = (dimension: string, value: number) => {
    const newPriorities = { ...localPriorities, [dimension]: value };
    setLocalPriorities(newPriorities);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updatePriorities(localPriorities);
      setIsEditing(false);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save priorities:', error);
      // Reset to original values on error
      setLocalPriorities(priorities);
      setHasChanges(false);
    }
  };

  const handleCancel = () => {
    setLocalPriorities(priorities);
    setIsEditing(false);
    setHasChanges(false);
  };

  const hasPriorities = Object.values(priorities).some(value => value > 0);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!hasPriorities) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Magic 10 Priorities</h2>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">⚡</div>
          <p className="text-gray-600 mb-4">Set your Magic 10 priorities to find better matches!</p>
          <button 
            onClick={() => window.location.href = '/magic10-setup'}
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
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            Edit
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-700 text-sm font-medium px-3 py-1 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`text-sm font-medium px-3 py-1 rounded ${
                hasChanges 
                  ? 'bg-purple-600 text-white hover:bg-purple-700' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Save
            </button>
          </div>
        )}
      </div>

      {!isEditing && <PrioritySummary priorities={priorities} />}

      <PriorityGrid 
        priorities={isEditing ? localPriorities : priorities}
        isEditing={isEditing}
        onPriorityChange={handlePriorityChange}
      />

      {isEditing && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 <strong>Tip:</strong> Higher values mean this dimension is more important to you in a connection.
          </p>
        </div>
      )}
    </div>
  );
};

export default Magic10Display;

