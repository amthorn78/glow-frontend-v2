// ============================================================================
// MAGIC 10 ZUSTAND STORE
// ============================================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ============================================================================
// TYPES
// ============================================================================

export interface Magic10Priorities {
  love_priority: number
  intimacy_priority: number
  communication_priority: number
  friendship_priority: number
  collaboration_priority: number
  lifestyle_priority: number
  decisions_priority: number
  support_priority: number
  growth_priority: number
  space_priority: number
}

export interface CompatibilityInsight {
  dimension: string
  score: number
  explanation: string
  importance: 'high' | 'medium' | 'low'
}

export interface Magic10State {
  // User's priorities
  priorities: Magic10Priorities
  prioritiesSet: boolean
  
  // Current compatibility analysis
  currentCompatibility: {
    userId: number
    overallScore: number
    dimensionScores: Record<string, number>
    insights: CompatibilityInsight[]
    matchReasons: string[]
  } | null
  
  // Discovery preferences
  discoveryFilters: {
    minCompatibility: number
    ageRange: [number, number]
    showOnlyHighCompatibility: boolean
  }
  
  // UI state
  isSettingPriorities: boolean
  showCompatibilityDetails: boolean
  selectedDimension: string | null
  
  // Actions
  setPriorities: (priorities: Partial<Magic10Priorities>) => void
  setCurrentCompatibility: (compatibility: any) => void
  clearCurrentCompatibility: () => void
  updateDiscoveryFilters: (filters: Partial<Magic10State['discoveryFilters']>) => void
  setSelectedDimension: (dimension: string | null) => void
  toggleCompatibilityDetails: () => void
  resetMagic10: () => void
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const defaultPriorities: Magic10Priorities = {
  love_priority: 5,
  intimacy_priority: 5,
  communication_priority: 5,
  friendship_priority: 5,
  collaboration_priority: 5,
  lifestyle_priority: 5,
  decisions_priority: 5,
  support_priority: 5,
  growth_priority: 5,
  space_priority: 5,
}

const defaultDiscoveryFilters = {
  minCompatibility: 60,
  ageRange: [22, 45] as [number, number],
  showOnlyHighCompatibility: false,
}

// ============================================================================
// MAGIC 10 STORE
// ============================================================================

export const useMagic10Store = create<Magic10State>()(
  persist(
    (set, get) => ({
      // Initial state
      priorities: defaultPriorities,
      prioritiesSet: false,
      currentCompatibility: null,
      discoveryFilters: defaultDiscoveryFilters,
      isSettingPriorities: false,
      showCompatibilityDetails: false,
      selectedDimension: null,

      // Actions
      setPriorities: (newPriorities) => {
        set((state) => ({
          priorities: { ...state.priorities, ...newPriorities },
          prioritiesSet: true,
        }))
      },

      setCurrentCompatibility: (compatibility) => {
        set({
          currentCompatibility: compatibility,
        })
      },

      clearCurrentCompatibility: () => {
        set({
          currentCompatibility: null,
          showCompatibilityDetails: false,
          selectedDimension: null,
        })
      },

      updateDiscoveryFilters: (filters) => {
        set((state) => ({
          discoveryFilters: { ...state.discoveryFilters, ...filters },
        }))
      },

      setSelectedDimension: (dimension) => {
        set({ selectedDimension: dimension })
      },

      toggleCompatibilityDetails: () => {
        set((state) => ({
          showCompatibilityDetails: !state.showCompatibilityDetails,
        }))
      },

      resetMagic10: () => {
        set({
          priorities: defaultPriorities,
          prioritiesSet: false,
          currentCompatibility: null,
          discoveryFilters: defaultDiscoveryFilters,
          isSettingPriorities: false,
          showCompatibilityDetails: false,
          selectedDimension: null,
        })
      },
    }),
    {
      name: 'glow-magic10-store',
      partialize: (state) => ({
        priorities: state.priorities,
        prioritiesSet: state.prioritiesSet,
        discoveryFilters: state.discoveryFilters,
      }),
    }
  )
)

// ============================================================================
// SELECTORS
// ============================================================================

export const useMagic10Priorities = () => useMagic10Store((state) => state.priorities)
export const usePrioritiesSet = () => useMagic10Store((state) => state.prioritiesSet)
export const useCurrentCompatibility = () => useMagic10Store((state) => state.currentCompatibility)
export const useDiscoveryFilters = () => useMagic10Store((state) => state.discoveryFilters)
export const useSelectedDimension = () => useMagic10Store((state) => state.selectedDimension)

// ============================================================================
// COMPUTED VALUES
// ============================================================================

export const useTopPriorities = () => {
  const priorities = useMagic10Priorities()
  
  // Get top 3 priorities
  const priorityEntries = Object.entries(priorities)
    .map(([key, value]) => ({
      dimension: key.replace('_priority', ''),
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
  
  return priorityEntries
}

export const useCompatibilityLevel = () => {
  const compatibility = useCurrentCompatibility()
  
  if (!compatibility) return null
  
  const score = compatibility.overallScore
  
  if (score >= 85) return { level: 'excellent', color: 'green', label: 'Excellent Match' }
  if (score >= 70) return { level: 'great', color: 'blue', label: 'Great Match' }
  if (score >= 55) return { level: 'good', color: 'yellow', label: 'Good Match' }
  if (score >= 40) return { level: 'fair', color: 'orange', label: 'Fair Match' }
  return { level: 'low', color: 'red', label: 'Low Match' }
}

// ============================================================================
// MAGIC 10 DIMENSION METADATA
// ============================================================================

export const MAGIC_10_DIMENSIONS = {
  love: {
    name: 'Love',
    description: 'Romantic connection and affection style',
    icon: '💕',
    color: '#FF6B9D',
  },
  intimacy: {
    name: 'Intimacy',
    description: 'Physical and emotional closeness',
    icon: '🤗',
    color: '#FF8E9B',
  },
  communication: {
    name: 'Communication',
    description: 'How you connect and share thoughts',
    icon: '💬',
    color: '#7C3AED',
  },
  friendship: {
    name: 'Friendship',
    description: 'Foundation of companionship',
    icon: '👫',
    color: '#06B6D4',
  },
  collaboration: {
    name: 'Collaboration',
    description: 'Working together as a team',
    icon: '🤝',
    color: '#10B981',
  },
  lifestyle: {
    name: 'Lifestyle',
    description: 'Daily life and routine compatibility',
    icon: '🏡',
    color: '#F59E0B',
  },
  decisions: {
    name: 'Decisions',
    description: 'How you make choices together',
    icon: '🎯',
    color: '#EF4444',
  },
  support: {
    name: 'Support',
    description: 'Being there for each other',
    icon: '🛡️',
    color: '#8B5CF6',
  },
  growth: {
    name: 'Growth',
    description: 'Personal development together',
    icon: '🌱',
    color: '#22C55E',
  },
  space: {
    name: 'Space',
    description: 'Independence and boundaries',
    icon: '🌌',
    color: '#6366F1',
  },
} as const

export type Magic10Dimension = keyof typeof MAGIC_10_DIMENSIONS

