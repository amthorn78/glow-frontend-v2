// ============================================================================
// MAGIC 10 QUERIES & MUTATIONS
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../core/api'

// ============================================================================
// TYPES
// ============================================================================

export interface Magic10Priorities {
  user_id: number
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

export interface CompatibilityResult {
  dimension_scores: {
    love: number
    intimacy: number
    communication: number
    friendship: number
    collaboration: number
    lifestyle: number
    decisions: number
    support: number
    growth: number
    space: number
  }
  overall_score: number
  high_priority_matches: number
  major_mismatches: number
  hd_enhancement_factor?: number // Hidden HD intelligence boost
}

export interface MatchProfile {
  user_id: number
  user: {
    id: number
    name: string
    age: number
    photos: string[]
    bio: string
  }
  compatibility: CompatibilityResult
  match_reasons: string[]
  compatibility_insights: string[]
}

// ============================================================================
// MAGIC 10 PRIORITIES QUERIES
// ============================================================================

/**
 * Get user's Magic 10 priorities
 */
export const useUserPriorities = () => {
  return useQuery({
    queryKey: ['magic10', 'priorities'],
    queryFn: async () => {
      const response = await api.get('/api/priorities')
      return response.data.priorities as Magic10Priorities
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Update user's Magic 10 priorities
 */
export const useUpdatePriorities = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (priorities: Partial<Magic10Priorities>) => {
      const response = await api.put('/api/priorities', priorities)
      return response.data.priorities as Magic10Priorities
    },
    onSuccess: (updatedPriorities) => {
      // Update cached priorities
      queryClient.setQueryData(['magic10', 'priorities'], updatedPriorities)
      
      // Invalidate compatibility calculations since priorities changed
      queryClient.invalidateQueries({ queryKey: ['compatibility'] })
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      queryClient.invalidateQueries({ queryKey: ['discovery'] })
    },
    onError: (error) => {
      console.error('Failed to update priorities:', error)
    }
  })
}

// ============================================================================
// COMPATIBILITY QUERIES
// ============================================================================

/**
 * Calculate compatibility with another user
 */
export const useCalculateCompatibility = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (targetUserId: number) => {
      const response = await api.post('/api/compatibility/calculate', {
        target_user_id: targetUserId
      })
      return response.data.compatibility as CompatibilityResult
    },
    onSuccess: (compatibility, targetUserId) => {
      // Cache the compatibility result
      queryClient.setQueryData(
        ['compatibility', 'result', targetUserId], 
        compatibility
      )
    }
  })
}

/**
 * Get cached compatibility with a user
 */
export const useCompatibilityResult = (targetUserId: number) => {
  return useQuery({
    queryKey: ['compatibility', 'result', targetUserId],
    queryFn: async () => {
      const response = await api.get(`/api/compatibility/${targetUserId}`)
      return response.data.compatibility as CompatibilityResult
    },
    enabled: !!targetUserId,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  })
}

// ============================================================================
// DISCOVERY & MATCHING QUERIES
// ============================================================================

/**
 * Get Magic 10 optimized matches
 */
export const useMagic10Matches = (filters?: {
  min_score?: number
  limit?: number
}) => {
  return useQuery({
    queryKey: ['matches', 'magic10', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.min_score) params.append('min_score', filters.min_score.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())
      
      const response = await api.get(`/api/matches?${params}`)
      return response.data.matches as MatchProfile[]
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Get discovery feed with Magic 10 + HD intelligence
 */
export const useDiscoveryFeed = (filters?: {
  age_min?: number
  age_max?: number
  min_compatibility?: number
}) => {
  return useQuery({
    queryKey: ['discovery', 'feed', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.age_min) params.append('age_min', filters.age_min.toString())
      if (filters?.age_max) params.append('age_max', filters.age_max.toString())
      if (filters?.min_compatibility) params.append('min_compatibility', filters.min_compatibility.toString())
      
      const response = await api.get(`/api/discovery/feed?${params}`)
      return response.data.profiles as MatchProfile[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// ============================================================================
// SWIPE & INTERACTION MUTATIONS
// ============================================================================

/**
 * Swipe on a profile (like/pass)
 */
export const useSwipeProfile = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ userId, action }: { userId: number, action: 'like' | 'pass' }) => {
      const response = await api.post('/api/swipe', {
        target_user_id: userId,
        action
      })
      return response.data
    },
    onSuccess: (result, { userId, action }) => {
      // Remove swiped profile from discovery feed
      queryClient.setQueryData(['discovery', 'feed'], (oldData: MatchProfile[] | undefined) => {
        return oldData?.filter(profile => profile.user_id !== userId) || []
      })
      
      // If it's a match, invalidate matches query
      if (result.is_match) {
        queryClient.invalidateQueries({ queryKey: ['matches'] })
      }
    }
  })
}

// ============================================================================
// MAGIC 10 INSIGHTS QUERIES
// ============================================================================

/**
 * Get personalized Magic 10 insights
 */
export const useMagic10Insights = () => {
  return useQuery({
    queryKey: ['magic10', 'insights'],
    queryFn: async () => {
      const response = await api.get('/api/magic10/insights')
      return response.data.insights
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  })
}

/**
 * Get compatibility explanation for a specific match
 */
export const useCompatibilityExplanation = (targetUserId: number) => {
  return useQuery({
    queryKey: ['compatibility', 'explanation', targetUserId],
    queryFn: async () => {
      const response = await api.get(`/api/compatibility/${targetUserId}/explanation`)
      return response.data.explanation
    },
    enabled: !!targetUserId,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  })
}

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

export const magic10QueryKeys = {
  all: ['magic10'] as const,
  priorities: () => [...magic10QueryKeys.all, 'priorities'] as const,
  insights: () => [...magic10QueryKeys.all, 'insights'] as const,
  compatibility: {
    all: ['compatibility'] as const,
    result: (userId: number) => [...magic10QueryKeys.compatibility.all, 'result', userId] as const,
    explanation: (userId: number) => [...magic10QueryKeys.compatibility.all, 'explanation', userId] as const,
  },
  matches: {
    all: ['matches'] as const,
    magic10: (filters?: any) => [...magic10QueryKeys.matches.all, 'magic10', filters] as const,
  },
  discovery: {
    all: ['discovery'] as const,
    feed: (filters?: any) => [...magic10QueryKeys.discovery.all, 'feed', filters] as const,
  }
}

