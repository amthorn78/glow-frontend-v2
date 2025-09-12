// React Query Provider for GLOW Dating App
// Phase 2: DISSOLUTION - Adaptive State Management

import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// ============================================================================
// QUERY CLIENT CONFIGURATION
// ============================================================================

const createQueryClient = () => {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        console.error('Query error:', error, 'Query key:', query.queryKey);
        
        // Handle specific error types
        if (error instanceof Error) {
          if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            // Handle authentication errors
            console.log('Authentication error detected, redirecting to login');
            // The auth store will handle the actual logout
          } else if (error.message.includes('Network')) {
            // Handle network errors
            console.log('Network error detected');
          }
        }
      },
    }),
    
    mutationCache: new MutationCache({
      onError: (error, variables, context, mutation) => {
        console.error('Mutation error:', error, 'Variables:', variables);
        
        // Global mutation error handling
        if (error instanceof Error) {
          if (error.message.includes('401')) {
            // Don't show error for auth failures, let auth system handle
            return;
          }
          
          // Show user-friendly error messages for other failures
          // This could integrate with a toast notification system
          console.log('Mutation failed:', error.message);
        }
      },
    }),
    
    defaultOptions: {
      queries: {
        // Dating app specific optimizations
        staleTime: 5 * 60 * 1000, // 5 minutes - profiles don't change often
        gcTime: 10 * 60 * 1000, // 10 minutes cache time (formerly cacheTime)
        
        // Retry configuration for dating app
        retry: (failureCount, error) => {
          // Don't retry auth errors
          if (error instanceof Error && error.message.includes('401')) {
            return false;
          }
          
          // Don't retry client errors (4xx)
          if (error instanceof Error && error.message.includes('4')) {
            return false;
          }
          
          // Retry server errors up to 3 times
          return failureCount < 3;
        },
        
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Network optimizations for mobile
        refetchOnWindowFocus: false, // Disable for mobile app feel
        refetchOnReconnect: true, // Important for mobile networks
        refetchOnMount: true,
        
        // Error handling
        throwOnError: false, // Handle errors gracefully in components
      },
      
      mutations: {
        // Mutation defaults
        retry: 1, // Retry once for mutations
        
        // Global mutation error handling
        onError: (error) => {
          console.error('Global mutation error:', error);
        },
        
        // Global mutation success handling
        onSuccess: (data, variables, context) => {
          console.log('Mutation succeeded:', { data, variables });
        },
      },
    },
  });
};

// ============================================================================
// QUERY CLIENT INSTANCE
// ============================================================================

let queryClient: QueryClient | undefined;

const getQueryClient = () => {
  if (!queryClient) {
    queryClient = createQueryClient();
  }
  return queryClient;
};

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  const client = getQueryClient();

  return (
    <QueryClientProvider client={client}>
      {children}
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
};

// ============================================================================
// QUERY KEYS FACTORY
// ============================================================================

// Centralized query key management for consistency
const queryKeys = {
  // Authentication
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    currentUser: () => [...queryKeys.auth.user(), 'current'] as const,
  },
  
  // User profiles
  profiles: {
    all: ['profiles'] as const,
    discovery: () => [...queryKeys.profiles.all, 'discovery'] as const,
    profile: (userId: string) => [...queryKeys.profiles.all, 'profile', userId] as const,
    birthData: (userId: string) => [...queryKeys.profiles.all, 'birthData', userId] as const,
  },
  
  // Matching system
  matches: {
    all: ['matches'] as const,
    list: (filters?: any) => [...queryKeys.matches.all, 'list', filters] as const,
    compatibility: (userId: string) => [...queryKeys.matches.all, 'compatibility', userId] as const,
  },
  
  // Messaging
  messages: {
    all: ['messages'] as const,
    conversations: () => [...queryKeys.messages.all, 'conversations'] as const,
    conversation: (conversationId: string) => [...queryKeys.messages.all, 'conversation', conversationId] as const,
    messages: (conversationId: string) => [...queryKeys.messages.all, 'messages', conversationId] as const,
  },
  
  // Admin
  admin: {
    all: ['admin'] as const,
    stats: () => [...queryKeys.admin.all, 'stats'] as const,
    reports: (filters?: any) => [...queryKeys.admin.all, 'reports', filters] as const,
  },
} as const;

// ============================================================================
// QUERY CLIENT UTILITIES
// ============================================================================

// Utility to get the query client instance
export const useQueryClientInstance = () => {
  return getQueryClient();
};

// Utility to invalidate specific query patterns
const invalidateQueries = {
  auth: () => getQueryClient().invalidateQueries({ queryKey: queryKeys.auth.all }),
  profiles: () => getQueryClient().invalidateQueries({ queryKey: queryKeys.profiles.all }),
  matches: () => getQueryClient().invalidateQueries({ queryKey: queryKeys.matches.all }),
  messages: () => getQueryClient().invalidateQueries({ queryKey: queryKeys.messages.all }),
  admin: () => getQueryClient().invalidateQueries({ queryKey: queryKeys.admin.all }),
};

// Utility to prefetch data
const prefetchQueries = {
  discoveryProfiles: () => {
    return getQueryClient().prefetchInfiniteQuery({
      queryKey: queryKeys.profiles.discovery(),
      queryFn: ({ pageParam = 1 }) => {
        // This will be implemented when we create the discovery queries
        return Promise.resolve({ data: [], hasMore: false });
      },
      initialPageParam: 1,
    });
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export default QueryProvider;
export { getQueryClient, queryKeys, invalidateQueries, prefetchQueries };
export type { QueryProviderProps };

