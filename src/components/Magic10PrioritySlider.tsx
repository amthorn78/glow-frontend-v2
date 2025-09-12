// ============================================================================
// MAGIC 10 PRIORITY SLIDER COMPONENT
// ============================================================================

import React, { useState } from 'react'
import { useMagic10Store, MAGIC_10_DIMENSIONS, Magic10Dimension } from '../stores/magic10Store'
import { useUpdatePriorities } from '../queries/magic10/magic10Queries'

// ============================================================================
// TYPES
// ============================================================================

interface PrioritySliderProps {
  dimension: Magic10Dimension
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

interface Magic10SetupProps {
  onComplete?: () => void
  showTitle?: boolean
}

// ============================================================================
// PRIORITY SLIDER COMPONENT
// ============================================================================

const PrioritySlider: React.FC<PrioritySliderProps> = ({
  dimension,
  value,
  onChange,
  disabled = false
}) => {
  const dimensionData = MAGIC_10_DIMENSIONS[dimension]
  
  return (
    <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{dimensionData.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{dimensionData.name}</h3>
            <p className="text-sm text-gray-600">{dimensionData.description}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color: dimensionData.color }}>
            {value}
          </div>
          <div className="text-xs text-gray-500">Priority</div>
        </div>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, ${dimensionData.color} 0%, ${dimensionData.color} ${(value - 1) * 11.11}%, #e5e7eb ${(value - 1) * 11.11}%, #e5e7eb 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Low Priority</span>
          <span>High Priority</span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAGIC 10 SETUP COMPONENT
// ============================================================================

export const Magic10Setup: React.FC<Magic10SetupProps> = ({
  onComplete,
  showTitle = true
}) => {
  const { priorities, setPriorities } = useMagic10Store()
  const updatePrioritiesMutation = useUpdatePriorities()
  const [localPriorities, setLocalPriorities] = useState(priorities)
  const [hasChanges, setHasChanges] = useState(false)

  const handlePriorityChange = (dimension: Magic10Dimension, value: number) => {
    const priorityKey = `${dimension}_priority` as keyof typeof localPriorities
    const newPriorities = { ...localPriorities, [priorityKey]: value }
    setLocalPriorities(newPriorities)
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      await updatePrioritiesMutation.mutateAsync(localPriorities)
      setPriorities(localPriorities)
      setHasChanges(false)
      onComplete?.()
    } catch (error) {
      console.error('Failed to save priorities:', error)
    }
  }

  const handleReset = () => {
    setLocalPriorities(priorities)
    setHasChanges(false)
  }

  const totalPoints = Object.values(localPriorities).reduce((sum, value) => sum + value, 0)
  const averageScore = Math.round(totalPoints / 10)

  return (
    <div className="max-w-2xl mx-auto p-6">
      {showTitle && (
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ✨ Your Connection Priorities
          </h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            Rate how important each aspect is to you in a connection. 
            This helps us find your most compatible matches.
          </p>
        </div>
      )}

      <div className="mb-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Your Priority Profile</h3>
            <p className="text-sm text-gray-600">Total: {totalPoints} points • Average: {averageScore}/10</p>
          </div>
          <div className="text-2xl">🎯</div>
        </div>
      </div>

      <div className="space-y-4">
        {(Object.keys(MAGIC_10_DIMENSIONS) as Magic10Dimension[]).map((dimension) => (
          <PrioritySlider
            key={dimension}
            dimension={dimension}
            value={localPriorities[`${dimension}_priority` as keyof typeof localPriorities]}
            onChange={(value) => handlePriorityChange(dimension, value)}
            disabled={updatePrioritiesMutation.isPending}
          />
        ))}
      </div>

      <div className="mt-8 flex space-x-4">
        <button
          onClick={handleSave}
          disabled={!hasChanges || updatePrioritiesMutation.isPending}
          className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
        >
          {updatePrioritiesMutation.isPending ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Saving...
            </div>
          ) : (
            '💾 Save Priorities'
          )}
        </button>
        
        {hasChanges && (
          <button
            onClick={handleReset}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200"
          >
            Reset
          </button>
        )}
      </div>

      {updatePrioritiesMutation.isError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">
            Failed to save priorities. Please try again.
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// PRIORITY SUMMARY COMPONENT
// ============================================================================

export const PrioritySummary: React.FC = () => {
  const priorities = useMagic10Store((state) => state.priorities)
  
  // Get top 3 priorities
  const topPriorities = Object.entries(priorities)
    .map(([key, value]) => ({
      dimension: key.replace('_priority', '') as Magic10Dimension,
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
        <span className="mr-2">🎯</span>
        Your Top Priorities
      </h3>
      <div className="space-y-2">
        {topPriorities.map(({ dimension, value }, index) => {
          const dimensionData = MAGIC_10_DIMENSIONS[dimension]
          return (
            <div key={dimension} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{dimensionData.icon}</span>
                <span className="font-medium text-gray-900">{dimensionData.name}</span>
                {index === 0 && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Top Priority</span>}
              </div>
              <div className="font-bold" style={{ color: dimensionData.color }}>
                {value}/10
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Magic10Setup

