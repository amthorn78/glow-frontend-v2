// Swipe Store - Dating App Core Interactions
// Phase 2: DISSOLUTION - Client State Management

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { UserProfile } from '../core/types';

// ============================================================================
// TYPES
// ============================================================================

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';
export type SwipeAction = 'like' | 'pass' | 'superlike' | 'boost';
export type SwipeResult = 'match' | 'like' | 'pass' | 'superlike';

export interface SwipeQueueItem {
  profileId: string;
  action: SwipeAction;
  direction: SwipeDirection;
  timestamp: number;
  processed: boolean;
  retryCount: number;
}

export interface SwipeGesture {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  velocity: number;
  isActive: boolean;
  threshold: number;
}

export interface SwipeAnimation {
  profileId: string;
  direction: SwipeDirection;
  progress: number;
  isComplete: boolean;
  duration: number;
}

export interface SwipeStats {
  totalSwipes: number;
  likes: number;
  passes: number;
  superlikes: number;
  matches: number;
  likeRate: number;
  matchRate: number;
  sessionSwipes: number;
  sessionStartTime: number;
}

export interface SwipeState {
  // Profile management
  profiles: UserProfile[];
  currentProfileIndex: number;
  preloadedProfiles: UserProfile[];
  
  // Swipe queue and processing
  swipeQueue: SwipeQueueItem[];
  isProcessingQueue: boolean;
  maxQueueSize: number;
  
  // Gesture tracking
  currentGesture: SwipeGesture | null;
  isGestureActive: boolean;
  
  // Animation state
  activeAnimation: SwipeAnimation | null;
  animationQueue: SwipeAnimation[];
  
  // Interaction state
  isAnimating: boolean;
  lastSwipeDirection: SwipeDirection | null;
  lastSwipeResult: SwipeResult | null;
  
  // Performance and limits
  dailySwipeLimit: number;
  dailySwipeCount: number;
  lastSwipeResetDate: string;
  canSwipe: boolean;
  
  // Statistics
  stats: SwipeStats;
  
  // Settings
  swipeThreshold: number;
  animationDuration: number;
  hapticFeedback: boolean;
  autoAdvance: boolean;
}

export interface SwipeActions {
  // Profile management
  loadProfiles: (profiles: UserProfile[]) => void;
  addProfiles: (profiles: UserProfile[]) => void;
  removeProfile: (profileId: string) => void;
  preloadProfiles: (profiles: UserProfile[]) => void;
  
  // Swipe actions
  swipeProfile: (direction: SwipeDirection, profileId?: string) => Promise<void>;
  likeProfile: (profileId?: string) => Promise<void>;
  passProfile: (profileId?: string) => Promise<void>;
  superlikeProfile: (profileId?: string) => Promise<void>;
  
  // Queue management
  addToQueue: (item: Omit<SwipeQueueItem, 'timestamp' | 'processed' | 'retryCount'>) => void;
  processQueue: () => Promise<void>;
  clearQueue: () => void;
  retryFailedSwipes: () => Promise<void>;
  
  // Gesture handling
  startGesture: (x: number, y: number) => void;
  updateGesture: (x: number, y: number) => void;
  endGesture: () => void;
  cancelGesture: () => void;
  
  // Animation control
  startAnimation: (profileId: string, direction: SwipeDirection) => void;
  updateAnimation: (progress: number) => void;
  completeAnimation: () => void;
  cancelAnimation: () => void;
  
  // Navigation
  nextProfile: () => void;
  previousProfile: () => void;
  goToProfile: (index: number) => void;
  
  // Limits and stats
  updateDailyCount: () => void;
  resetDailyCount: () => void;
  updateStats: (action: SwipeAction, result?: SwipeResult) => void;
  resetStats: () => void;
  
  // Settings
  setSwipeThreshold: (threshold: number) => void;
  setAnimationDuration: (duration: number) => void;
  setHapticFeedback: (enabled: boolean) => void;
  setAutoAdvance: (enabled: boolean) => void;
  
  // Utility
  reset: () => void;
  getCurrentProfile: () => UserProfile | null;
  hasMoreProfiles: () => boolean;
  canPerformAction: (action: SwipeAction) => boolean;
}

export type SwipeStore = SwipeState & SwipeActions;

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_DAILY_LIMIT = 100;
const DEFAULT_SWIPE_THRESHOLD = 100;
const DEFAULT_ANIMATION_DURATION = 300;
const MAX_QUEUE_SIZE = 50;
const VELOCITY_THRESHOLD = 0.5;

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: SwipeState = {
  // Profile management
  profiles: [],
  currentProfileIndex: 0,
  preloadedProfiles: [],
  
  // Queue management
  swipeQueue: [],
  isProcessingQueue: false,
  maxQueueSize: MAX_QUEUE_SIZE,
  
  // Gesture tracking
  currentGesture: null,
  isGestureActive: false,
  
  // Animation state
  activeAnimation: null,
  animationQueue: [],
  
  // Interaction state
  isAnimating: false,
  lastSwipeDirection: null,
  lastSwipeResult: null,
  
  // Limits
  dailySwipeLimit: DEFAULT_DAILY_LIMIT,
  dailySwipeCount: 0,
  lastSwipeResetDate: new Date().toDateString(),
  canSwipe: true,
  
  // Statistics
  stats: {
    totalSwipes: 0,
    likes: 0,
    passes: 0,
    superlikes: 0,
    matches: 0,
    likeRate: 0,
    matchRate: 0,
    sessionSwipes: 0,
    sessionStartTime: Date.now(),
  },
  
  // Settings
  swipeThreshold: DEFAULT_SWIPE_THRESHOLD,
  animationDuration: DEFAULT_ANIMATION_DURATION,
  hapticFeedback: true,
  autoAdvance: true,
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useSwipeStore = create<SwipeStore>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      ...initialState,
      
      // ========================================================================
      // PROFILE MANAGEMENT
      // ========================================================================
      
      loadProfiles: (profiles) => {
        set((state) => {
          state.profiles = profiles;
          state.currentProfileIndex = 0;
        });
      },
      
      addProfiles: (profiles) => {
        set((state) => {
          state.profiles.push(...profiles);
        });
      },
      
      removeProfile: (profileId) => {
        set((state) => {
          const index = state.profiles.findIndex(p => p.id === profileId);
          if (index !== -1) {
            state.profiles.splice(index, 1);
            
            // Adjust current index if necessary
            if (state.currentProfileIndex >= state.profiles.length) {
              state.currentProfileIndex = Math.max(0, state.profiles.length - 1);
            }
          }
        });
      },
      
      preloadProfiles: (profiles) => {
        set((state) => {
          state.preloadedProfiles = profiles;
        });
      },
      
      // ========================================================================
      // SWIPE ACTIONS
      // ========================================================================
      
      swipeProfile: async (direction, profileId) => {
        const state = get();
        const currentProfile = profileId 
          ? state.profiles.find(p => p.id === profileId)
          : state.getCurrentProfile();
          
        if (!currentProfile || !state.canPerformAction('like')) {
          return;
        }
        
        const action: SwipeAction = direction === 'right' ? 'like' : 
                                   direction === 'left' ? 'pass' :
                                   direction === 'up' ? 'superlike' : 'pass';
        
        // Start animation
        state.startAnimation(currentProfile.id, direction);
        
        // Add to queue for processing
        state.addToQueue({
          profileId: currentProfile.id,
          action,
          direction,
        });
        
        // Update UI state
        set((draft) => {
          draft.lastSwipeDirection = direction;
          draft.isAnimating = true;
        });
        
        // Process the swipe
        await state.processQueue();
        
        // Auto-advance if enabled
        if (state.autoAdvance) {
          setTimeout(() => {
            state.nextProfile();
          }, state.animationDuration);
        }
      },
      
      likeProfile: async (profileId) => {
        await get().swipeProfile('right', profileId);
      },
      
      passProfile: async (profileId) => {
        await get().swipeProfile('left', profileId);
      },
      
      superlikeProfile: async (profileId) => {
        await get().swipeProfile('up', profileId);
      },
      
      // ========================================================================
      // QUEUE MANAGEMENT
      // ========================================================================
      
      addToQueue: (item) => {
        set((state) => {
          const queueItem: SwipeQueueItem = {
            ...item,
            timestamp: Date.now(),
            processed: false,
            retryCount: 0,
          };
          
          // Remove oldest items if queue is full
          if (state.swipeQueue.length >= state.maxQueueSize) {
            state.swipeQueue.shift();
          }
          
          state.swipeQueue.push(queueItem);
        });
      },
      
      processQueue: async () => {
        const state = get();
        
        if (state.isProcessingQueue || state.swipeQueue.length === 0) {
          return;
        }
        
        set((draft) => {
          draft.isProcessingQueue = true;
        });
        
        try {
          const unprocessedItems = state.swipeQueue.filter(item => !item.processed);
          
          for (const item of unprocessedItems) {
            try {
              // Here we would make the API call
              // For now, simulate the API call
              await new Promise(resolve => setTimeout(resolve, 100));
              
              // Mark as processed
              set((draft) => {
                const queueItem = draft.swipeQueue.find(q => 
                  q.profileId === item.profileId && q.timestamp === item.timestamp
                );
                if (queueItem) {
                  queueItem.processed = true;
                }
              });
              
              // Update stats
              state.updateStats(item.action);
              state.updateDailyCount();
              
            } catch (error) {
              console.error('Failed to process swipe:', error);
              
              // Increment retry count
              set((draft) => {
                const queueItem = draft.swipeQueue.find(q => 
                  q.profileId === item.profileId && q.timestamp === item.timestamp
                );
                if (queueItem) {
                  queueItem.retryCount += 1;
                }
              });
            }
          }
        } finally {
          set((draft) => {
            draft.isProcessingQueue = false;
            
            // Remove processed items older than 5 minutes
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            draft.swipeQueue = draft.swipeQueue.filter(item => 
              !item.processed || item.timestamp > fiveMinutesAgo
            );
          });
        }
      },
      
      clearQueue: () => {
        set((state) => {
          state.swipeQueue = [];
        });
      },
      
      retryFailedSwipes: async () => {
        const state = get();
        const failedItems = state.swipeQueue.filter(item => 
          !item.processed && item.retryCount < 3
        );
        
        for (const item of failedItems) {
          try {
            // Retry the API call
            await new Promise(resolve => setTimeout(resolve, 100));
            
            set((draft) => {
              const queueItem = draft.swipeQueue.find(q => 
                q.profileId === item.profileId && q.timestamp === item.timestamp
              );
              if (queueItem) {
                queueItem.processed = true;
              }
            });
          } catch (error) {
            set((draft) => {
              const queueItem = draft.swipeQueue.find(q => 
                q.profileId === item.profileId && q.timestamp === item.timestamp
              );
              if (queueItem) {
                queueItem.retryCount += 1;
              }
            });
          }
        }
      },
      
      // ========================================================================
      // GESTURE HANDLING
      // ========================================================================
      
      startGesture: (x, y) => {
        set((state) => {
          state.currentGesture = {
            startX: x,
            startY: y,
            currentX: x,
            currentY: y,
            deltaX: 0,
            deltaY: 0,
            velocity: 0,
            isActive: true,
            threshold: state.swipeThreshold,
          };
          state.isGestureActive = true;
        });
      },
      
      updateGesture: (x, y) => {
        set((state) => {
          if (state.currentGesture) {
            const deltaX = x - state.currentGesture.startX;
            const deltaY = y - state.currentGesture.startY;
            const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            state.currentGesture.currentX = x;
            state.currentGesture.currentY = y;
            state.currentGesture.deltaX = deltaX;
            state.currentGesture.deltaY = deltaY;
            state.currentGesture.velocity = velocity;
          }
        });
      },
      
      endGesture: () => {
        const state = get();
        
        if (state.currentGesture) {
          const { deltaX, deltaY, velocity, threshold } = state.currentGesture;
          
          // Determine swipe direction and action
          if (Math.abs(deltaX) > threshold || velocity > VELOCITY_THRESHOLD) {
            if (deltaX > 0) {
              // Right swipe - like
              state.swipeProfile('right');
            } else {
              // Left swipe - pass
              state.swipeProfile('left');
            }
          } else if (deltaY < -threshold || velocity > VELOCITY_THRESHOLD) {
            // Up swipe - superlike
            state.swipeProfile('up');
          }
        }
        
        state.cancelGesture();
      },
      
      cancelGesture: () => {
        set((state) => {
          state.currentGesture = null;
          state.isGestureActive = false;
        });
      },
      
      // ========================================================================
      // ANIMATION CONTROL
      // ========================================================================
      
      startAnimation: (profileId, direction) => {
        set((state) => {
          state.activeAnimation = {
            profileId,
            direction,
            progress: 0,
            isComplete: false,
            duration: state.animationDuration,
          };
          state.isAnimating = true;
        });
      },
      
      updateAnimation: (progress) => {
        set((state) => {
          if (state.activeAnimation) {
            state.activeAnimation.progress = Math.min(1, Math.max(0, progress));
          }
        });
      },
      
      completeAnimation: () => {
        set((state) => {
          if (state.activeAnimation) {
            state.activeAnimation.isComplete = true;
            state.activeAnimation.progress = 1;
          }
          
          state.isAnimating = false;
          state.activeAnimation = null;
        });
      },
      
      cancelAnimation: () => {
        set((state) => {
          state.activeAnimation = null;
          state.isAnimating = false;
        });
      },
      
      // ========================================================================
      // NAVIGATION
      // ========================================================================
      
      nextProfile: () => {
        set((state) => {
          if (state.currentProfileIndex < state.profiles.length - 1) {
            state.currentProfileIndex += 1;
          }
          
          // Load more profiles if running low
          if (state.currentProfileIndex >= state.profiles.length - 3) {
            // Trigger profile loading (this would be handled by React Query)
            console.log('Need to load more profiles');
          }
        });
      },
      
      previousProfile: () => {
        set((state) => {
          if (state.currentProfileIndex > 0) {
            state.currentProfileIndex -= 1;
          }
        });
      },
      
      goToProfile: (index) => {
        set((state) => {
          if (index >= 0 && index < state.profiles.length) {
            state.currentProfileIndex = index;
          }
        });
      },
      
      // ========================================================================
      // LIMITS AND STATS
      // ========================================================================
      
      updateDailyCount: () => {
        set((state) => {
          const today = new Date().toDateString();
          
          // Reset count if it's a new day
          if (state.lastSwipeResetDate !== today) {
            state.dailySwipeCount = 0;
            state.lastSwipeResetDate = today;
          }
          
          state.dailySwipeCount += 1;
          state.canSwipe = state.dailySwipeCount < state.dailySwipeLimit;
        });
      },
      
      resetDailyCount: () => {
        set((state) => {
          state.dailySwipeCount = 0;
          state.lastSwipeResetDate = new Date().toDateString();
          state.canSwipe = true;
        });
      },
      
      updateStats: (action, result) => {
        set((state) => {
          state.stats.totalSwipes += 1;
          state.stats.sessionSwipes += 1;
          
          switch (action) {
            case 'like':
              state.stats.likes += 1;
              break;
            case 'pass':
              state.stats.passes += 1;
              break;
            case 'superlike':
              state.stats.superlikes += 1;
              break;
          }
          
          if (result === 'match') {
            state.stats.matches += 1;
          }
          
          // Calculate rates
          const totalActions = state.stats.likes + state.stats.passes + state.stats.superlikes;
          state.stats.likeRate = totalActions > 0 ? state.stats.likes / totalActions : 0;
          state.stats.matchRate = state.stats.likes > 0 ? state.stats.matches / state.stats.likes : 0;
        });
      },
      
      resetStats: () => {
        set((state) => {
          state.stats = {
            totalSwipes: 0,
            likes: 0,
            passes: 0,
            superlikes: 0,
            matches: 0,
            likeRate: 0,
            matchRate: 0,
            sessionSwipes: 0,
            sessionStartTime: Date.now(),
          };
        });
      },
      
      // ========================================================================
      // SETTINGS
      // ========================================================================
      
      setSwipeThreshold: (threshold) => {
        set((state) => {
          state.swipeThreshold = threshold;
        });
      },
      
      setAnimationDuration: (duration) => {
        set((state) => {
          state.animationDuration = duration;
        });
      },
      
      setHapticFeedback: (enabled) => {
        set((state) => {
          state.hapticFeedback = enabled;
        });
      },
      
      setAutoAdvance: (enabled) => {
        set((state) => {
          state.autoAdvance = enabled;
        });
      },
      
      // ========================================================================
      // UTILITY METHODS
      // ========================================================================
      
      reset: () => {
        set(() => ({ ...initialState }));
      },
      
      getCurrentProfile: () => {
        const state = get();
        return state.profiles[state.currentProfileIndex] || null;
      },
      
      hasMoreProfiles: () => {
        const state = get();
        return state.currentProfileIndex < state.profiles.length - 1;
      },
      
      canPerformAction: (action) => {
        const state = get();
        
        // Check daily limits
        if (!state.canSwipe) {
          return false;
        }
        
        // Check if currently animating
        if (state.isAnimating) {
          return false;
        }
        
        // Check if there's a current profile
        if (!state.getCurrentProfile()) {
          return false;
        }
        
        return true;
      },
    })),
    {
      name: 'SwipeStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

export const swipeSelectors = {
  // Profile selectors
  currentProfile: (state: SwipeStore) => state.getCurrentProfile(),
  profileCount: (state: SwipeStore) => state.profiles.length,
  currentIndex: (state: SwipeStore) => state.currentProfileIndex,
  hasMoreProfiles: (state: SwipeStore) => state.hasMoreProfiles(),
  
  // Interaction selectors
  canSwipe: (state: SwipeStore) => state.canSwipe,
  isAnimating: (state: SwipeStore) => state.isAnimating,
  lastSwipeDirection: (state: SwipeStore) => state.lastSwipeDirection,
  
  // Queue selectors
  queueLength: (state: SwipeStore) => state.swipeQueue.length,
  isProcessingQueue: (state: SwipeStore) => state.isProcessingQueue,
  failedSwipes: (state: SwipeStore) => state.swipeQueue.filter(item => 
    !item.processed && item.retryCount > 0
  ).length,
  
  // Stats selectors
  stats: (state: SwipeStore) => state.stats,
  dailyProgress: (state: SwipeStore) => ({
    count: state.dailySwipeCount,
    limit: state.dailySwipeLimit,
    remaining: state.dailySwipeLimit - state.dailySwipeCount,
    percentage: (state.dailySwipeCount / state.dailySwipeLimit) * 100,
  }),
  
  // Gesture selectors
  currentGesture: (state: SwipeStore) => state.currentGesture,
  isGestureActive: (state: SwipeStore) => state.isGestureActive,
  
  // Animation selectors
  activeAnimation: (state: SwipeStore) => state.activeAnimation,
};

// ============================================================================
// HOOKS
// ============================================================================

export const useCurrentProfile = () => useSwipeStore(swipeSelectors.currentProfile);
export const useCanSwipe = () => useSwipeStore(swipeSelectors.canSwipe);
export const useSwipeStats = () => useSwipeStore(swipeSelectors.stats);
export const useDailyProgress = () => useSwipeStore(swipeSelectors.dailyProgress);
export const useSwipeAnimation = () => useSwipeStore(swipeSelectors.activeAnimation);

// ============================================================================
// EXPORTS
// ============================================================================

export default useSwipeStore;
export type {
  SwipeDirection,
  SwipeAction,
  SwipeResult,
  SwipeQueueItem,
  SwipeGesture,
  SwipeAnimation,
  SwipeStats,
  SwipeState,
  SwipeActions,
};

