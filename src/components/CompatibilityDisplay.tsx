// ============================================================================
// COMPATIBILITY DISPLAY COMPONENT
// ============================================================================

import React from 'react'
import { MAGIC_10_DIMENSIONS, Magic10Dimension, useCompatibilityLevel } from '../stores/magic10Store'

// ============================================================================
// TYPES
// ============================================================================

interface CompatibilityResult {
  dimension_scores: Record<string, number>
  overall_score: number
  high_priority_matches: number
  major_mismatches: number
  hd_enhancement_factor?: number
}

interface CompatibilityDisplayProps {
  compatibility: CompatibilityResult
  showDetails?: boolean
  compact?: boolean
}

interface CompatibilityScoreProps {
  score: number
  size?: 'small' | 'medium' | 'large'
  showLabel?: boolean
}

interface DimensionScoreProps {
  dimension: Magic10Dimension
  score: number
  compact?: boolean
}

// ============================================================================
// COMPATIBILITY SCORE COMPONENT
// ============================================================================

export const CompatibilityScore: React.FC<CompatibilityScoreProps> = ({
  score,
  size = 'medium',
  showLabel = true
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 55) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Excellent Match'
    if (score >= 70) return 'Great Match'
    if (score >= 55) return 'Good Match'
    if (score >= 40) return 'Fair Match'
    return 'Low Match'
  }

  const sizeClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-4xl'
  }

  return (
    <div className="text-center">
      <div className={`font-bold ${sizeClasses[size]} ${getScoreColor(score)}`}>
        {score}%
      </div>
      {showLabel && (
        <div className="text-sm text-gray-600 mt-1">
          {getScoreLabel(score)}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// DIMENSION SCORE COMPONENT
// ============================================================================

const DimensionScore: React.FC<DimensionScoreProps> = ({
  dimension,
  score,
  compact = false
}) => {
  const dimensionData = MAGIC_10_DIMENSIONS[dimension]
  
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-500'
    if (score >= 6) return 'bg-blue-500'
    if (score >= 4) return 'bg-yellow-500'
    if (score >= 2) return 'bg-orange-500'
    return 'bg-red-500'
  }

  if (compact) {
    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm">{dimensionData.icon}</span>
          <span className="text-sm font-medium text-gray-900">{dimensionData.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${getScoreColor(score)}`}
              style={{ width: `${(score / 10) * 100}%` }}
            ></div>
          </div>
          <span className="text-sm font-bold text-gray-700 w-8">{score}/10</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xl">{dimensionData.icon}</span>
          <span className="font-semibold text-gray-900">{dimensionData.name}</span>
        </div>
        <span className="text-lg font-bold" style={{ color: dimensionData.color }}>
          {score}/10
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
        <div 
          className="h-3 rounded-full transition-all duration-300"
          style={{ 
            width: `${(score / 10) * 100}%`,
            backgroundColor: dimensionData.color
          }}
        ></div>
      </div>
      <p className="text-xs text-gray-600">{dimensionData.description}</p>
    </div>
  )
}

// ============================================================================
// MAIN COMPATIBILITY DISPLAY COMPONENT
// ============================================================================

export const CompatibilityDisplay: React.FC<CompatibilityDisplayProps> = ({
  compatibility,
  showDetails = true,
  compact = false
}) => {
  const { overall_score, dimension_scores, high_priority_matches, major_mismatches } = compatibility

  const sortedDimensions = Object.entries(dimension_scores)
    .map(([dimension, score]) => ({ dimension: dimension as Magic10Dimension, score }))
    .sort((a, b) => b.score - a.score)

  const topMatches = sortedDimensions.slice(0, 3)
  const needsWork = sortedDimensions.slice(-2)

  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Compatibility</h3>
          <CompatibilityScore score={overall_score} size="small" showLabel={false} />
        </div>
        <div className="space-y-1">
          {sortedDimensions.map(({ dimension, score }) => (
            <DimensionScore
              key={dimension}
              dimension={dimension}
              score={score}
              compact={true}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-6 border border-pink-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ✨ Compatibility Score
          </h2>
          <CompatibilityScore score={overall_score} size="large" />
          
          {/* Quick Stats */}
          <div className="flex justify-center space-x-6 mt-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-green-600">{high_priority_matches}</div>
              <div className="text-gray-600">High Priority Matches</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-red-600">{major_mismatches}</div>
              <div className="text-gray-600">Major Differences</div>
            </div>
          </div>
        </div>
      </div>

      {showDetails && (
        <>
          {/* Top Matches */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">🎯</span>
              Your Strongest Connections
            </h3>
            <div className="grid gap-3">
              {topMatches.map(({ dimension, score }) => (
                <DimensionScore key={dimension} dimension={dimension} score={score} />
              ))}
            </div>
          </div>

          {/* Areas for Growth */}
          {needsWork.some(({ score }) => score < 6) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">🌱</span>
                Areas to Explore Together
              </h3>
              <div className="grid gap-3">
                {needsWork
                  .filter(({ score }) => score < 6)
                  .map(({ dimension, score }) => (
                    <DimensionScore key={dimension} dimension={dimension} score={score} />
                  ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                These areas show differences in priorities - great opportunities for learning and growth together!
              </p>
            </div>
          )}

          {/* All Dimensions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">📊</span>
              Complete Compatibility Breakdown
            </h3>
            <div className="grid gap-3">
              {sortedDimensions.map(({ dimension, score }) => (
                <DimensionScore key={dimension} dimension={dimension} score={score} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// COMPATIBILITY INSIGHTS COMPONENT
// ============================================================================

export const CompatibilityInsights: React.FC<{ compatibility: CompatibilityResult }> = ({
  compatibility
}) => {
  const { overall_score, high_priority_matches, major_mismatches } = compatibility

  const getInsights = () => {
    const insights = []

    if (overall_score >= 80) {
      insights.push({
        type: 'positive',
        icon: '🌟',
        title: 'Exceptional Compatibility',
        message: 'You share remarkably similar relationship values and priorities.'
      })
    } else if (overall_score >= 65) {
      insights.push({
        type: 'positive',
        icon: '💫',
        title: 'Strong Foundation',
        message: 'You have a solid foundation for a meaningful relationship.'
      })
    }

    if (high_priority_matches >= 3) {
      insights.push({
        type: 'positive',
        icon: '🎯',
        title: 'Shared Priorities',
        message: `You both highly value ${high_priority_matches} of the same relationship aspects.`
      })
    }

    if (major_mismatches > 0) {
      insights.push({
        type: 'neutral',
        icon: '🌱',
        title: 'Growth Opportunities',
        message: 'Some differences in priorities can lead to interesting conversations and mutual growth.'
      })
    }

    if (overall_score < 50) {
      insights.push({
        type: 'caution',
        icon: '💭',
        title: 'Different Approaches',
        message: 'You have quite different relationship priorities - communication will be key.'
      })
    }

    return insights
  }

  const insights = getInsights()

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
        <span className="mr-2">💡</span>
        Compatibility Insights
      </h3>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div key={index} className="flex items-start space-x-3">
            <span className="text-lg">{insight.icon}</span>
            <div>
              <h4 className="font-medium text-gray-900">{insight.title}</h4>
              <p className="text-sm text-gray-600">{insight.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CompatibilityDisplay

