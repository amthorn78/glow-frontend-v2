// UI Store - App-wide State Management
// Phase 2: DISSOLUTION - Client State Management

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ============================================================================
// TYPES
// ============================================================================

export type Theme = 'light' | 'dark' | 'auto';
export type ModalType = 'match' | 'profile' | 'settings' | 'birth-data' | 'compatibility' | null;
export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type SwipeAnimation = 'idle' | 'swiping' | 'matching' | 'celebrating';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  createdAt: number;
}

export interface Match {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  compatibilityScore: number;
  matchedAt: string;
  isNew: boolean;
}

export interface UIState {
  // Theme and appearance
  theme: Theme;
  isDarkMode: boolean;
  
  // Network and connectivity
  isOnline: boolean;
  isConnecting: boolean;
  lastOnline: number | null;
  
  // Modal management
  activeModal: ModalType;
  modalData: any;
  modalHistory: ModalType[];
  
  // Notifications
  notifications: Notification[];
  maxNotifications: number;
  
  // Match celebrations
  isMatchModalOpen: boolean;
  currentMatch: Match | null;
  matchQueue: Match[];
  
  // Swipe animations
  swipeAnimation: SwipeAnimation;
  swipeDirection: 'left' | 'right' | null;
  
  // Loading states
  globalLoading: boolean;
  loadingMessage: string | null;
  
  // Navigation
  currentRoute: string;
  previousRoute: string | null;
  canGoBack: boolean;
  
  // Mobile specific
  isKeyboardOpen: boolean;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  
  // Performance
  reducedMotion: boolean;
  lowDataMode: boolean;
}

export interface UIActions {
  // Theme actions
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setDarkMode: (isDark: boolean) => void;
  
  // Network actions
  setOnlineStatus: (isOnline: boolean) => void;
  setConnecting: (isConnecting: boolean) => void;
  updateLastOnline: () => void;
  
  // Modal actions
  openModal: (modal: ModalType, data?: any) => void;
  closeModal: () => void;
  goBackModal: () => void;
  closeAllModals: () => void;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Match celebration actions
  showMatchModal: (match: Match) => void;
  closeMatchModal: () => void;
  queueMatch: (match: Match) => void;
  processMatchQueue: () => void;
  
  // Swipe animation actions
  setSwipeAnimation: (animation: SwipeAnimation) => void;
  setSwipeDirection: (direction: 'left' | 'right' | null) => void;
  resetSwipeState: () => void;
  
  // Loading actions
  setGlobalLoading: (loading: boolean, message?: string) => void;
  
  // Navigation actions
  setCurrentRoute: (route: string) => void;
  setCanGoBack: (canGoBack: boolean) => void;
  
  // Mobile actions
  setKeyboardOpen: (isOpen: boolean) => void;
  setSafeAreaInsets: (insets: Partial<UIState['safeAreaInsets']>) => void;
  
  // Performance actions
  setReducedMotion: (reduced: boolean) => void;
  setLowDataMode: (lowData: boolean) => void;
  
  // Utility actions
  reset: () => void;
}

export type UIStore = UIState & UIActions;

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: UIState = {
  // Theme
  theme: 'auto',
  isDarkMode: false,
  
  // Network
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isConnecting: false,
  lastOnline: null,
  
  // Modals
  activeModal: null,
  modalData: null,
  modalHistory: [],
  
  // Notifications
  notifications: [],
  maxNotifications: 5,
  
  // Match celebrations
  isMatchModalOpen: false,
  currentMatch: null,
  matchQueue: [],
  
  // Swipe animations
  swipeAnimation: 'idle',
  swipeDirection: null,
  
  // Loading
  globalLoading: false,
  loadingMessage: null,
  
  // Navigation
  currentRoute: '/',
  previousRoute: null,
  canGoBack: false,
  
  // Mobile
  isKeyboardOpen: false,
  safeAreaInsets: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  
  // Performance
  reducedMotion: false,
  lowDataMode: false,
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        ...initialState,
        
        // ========================================================================
        // THEME ACTIONS
        // ========================================================================
        
        setTheme: (theme) => {
          set((state) => {
            state.theme = theme;
            
            // Auto-detect dark mode for 'auto' theme
            if (theme === 'auto') {
              state.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            } else {
              state.isDarkMode = theme === 'dark';
            }
          });
        },
        
        toggleTheme: () => {
          const currentTheme = get().theme;
          const newTheme = currentTheme === 'light' ? 'dark' : 'light';
          get().setTheme(newTheme);
        },
        
        setDarkMode: (isDark) => {
          set((state) => {
            state.isDarkMode = isDark;
          });
        },
        
        // ========================================================================
        // NETWORK ACTIONS
        // ========================================================================
        
        setOnlineStatus: (isOnline) => {
          set((state) => {
            state.isOnline = isOnline;
            if (isOnline) {
              state.lastOnline = Date.now();
              state.isConnecting = false;
            }
          });
        },
        
        setConnecting: (isConnecting) => {
          set((state) => {
            state.isConnecting = isConnecting;
          });
        },
        
        updateLastOnline: () => {
          set((state) => {
            state.lastOnline = Date.now();
          });
        },
        
        // ========================================================================
        // MODAL ACTIONS
        // ========================================================================
        
        openModal: (modal, data) => {
          set((state) => {
            // Add current modal to history if it exists
            if (state.activeModal) {
              state.modalHistory.push(state.activeModal);
            }
            
            state.activeModal = modal;
            state.modalData = data || null;
          });
        },
        
        closeModal: () => {
          set((state) => {
            state.activeModal = null;
            state.modalData = null;
          });
        },
        
        goBackModal: () => {
          set((state) => {
            const previousModal = state.modalHistory.pop();
            state.activeModal = previousModal || null;
            state.modalData = null;
          });
        },
        
        closeAllModals: () => {
          set((state) => {
            state.activeModal = null;
            state.modalData = null;
            state.modalHistory = [];
          });
        },
        
        // ========================================================================
        // NOTIFICATION ACTIONS
        // ========================================================================
        
        addNotification: (notification) => {
          set((state) => {
            const newNotification: Notification = {
              ...notification,
              id: `notification-${Date.now()}-${Math.random()}`,
              createdAt: Date.now(),
            };
            
            state.notifications.push(newNotification);
            
            // Remove oldest notifications if exceeding max
            if (state.notifications.length > state.maxNotifications) {
              state.notifications = state.notifications.slice(-state.maxNotifications);
            }
          });
        },
        
        removeNotification: (id) => {
          set((state) => {
            state.notifications = state.notifications.filter(n => n.id !== id);
          });
        },
        
        clearNotifications: () => {
          set((state) => {
            state.notifications = [];
          });
        },
        
        // ========================================================================
        // MATCH CELEBRATION ACTIONS
        // ========================================================================
        
        showMatchModal: (match) => {
          set((state) => {
            state.currentMatch = match;
            state.isMatchModalOpen = true;
            state.swipeAnimation = 'matching';
          });
        },
        
        closeMatchModal: () => {
          set((state) => {
            state.isMatchModalOpen = false;
            state.currentMatch = null;
            state.swipeAnimation = 'idle';
            
            // Process next match in queue if any
            if (state.matchQueue.length > 0) {
              const nextMatch = state.matchQueue.shift();
              if (nextMatch) {
                setTimeout(() => {
                  get().showMatchModal(nextMatch);
                }, 500);
              }
            }
          });
        },
        
        queueMatch: (match) => {
          set((state) => {
            state.matchQueue.push(match);
          });
        },
        
        processMatchQueue: () => {
          const state = get();
          if (!state.isMatchModalOpen && state.matchQueue.length > 0) {
            const nextMatch = state.matchQueue.shift();
            if (nextMatch) {
              state.showMatchModal(nextMatch);
            }
          }
        },
        
        // ========================================================================
        // SWIPE ANIMATION ACTIONS
        // ========================================================================
        
        setSwipeAnimation: (animation) => {
          set((state) => {
            state.swipeAnimation = animation;
          });
        },
        
        setSwipeDirection: (direction) => {
          set((state) => {
            state.swipeDirection = direction;
          });
        },
        
        resetSwipeState: () => {
          set((state) => {
            state.swipeAnimation = 'idle';
            state.swipeDirection = null;
          });
        },
        
        // ========================================================================
        // LOADING ACTIONS
        // ========================================================================
        
        setGlobalLoading: (loading, message) => {
          set((state) => {
            state.globalLoading = loading;
            state.loadingMessage = message || null;
          });
        },
        
        // ========================================================================
        // NAVIGATION ACTIONS
        // ========================================================================
        
        setCurrentRoute: (route) => {
          set((state) => {
            state.previousRoute = state.currentRoute;
            state.currentRoute = route;
          });
        },
        
        setCanGoBack: (canGoBack) => {
          set((state) => {
            state.canGoBack = canGoBack;
          });
        },
        
        // ========================================================================
        // MOBILE ACTIONS
        // ========================================================================
        
        setKeyboardOpen: (isOpen) => {
          set((state) => {
            state.isKeyboardOpen = isOpen;
          });
        },
        
        setSafeAreaInsets: (insets) => {
          set((state) => {
            state.safeAreaInsets = { ...state.safeAreaInsets, ...insets };
          });
        },
        
        // ========================================================================
        // PERFORMANCE ACTIONS
        // ========================================================================
        
        setReducedMotion: (reduced) => {
          set((state) => {
            state.reducedMotion = reduced;
          });
        },
        
        setLowDataMode: (lowData) => {
          set((state) => {
            state.lowDataMode = lowData;
          });
        },
        
        // ========================================================================
        // UTILITY ACTIONS
        // ========================================================================
        
        reset: () => {
          set(() => ({ ...initialState }));
        },
      })),
      {
        name: 'glow-ui-store',
        
        // Only persist user preferences
        partialize: (state) => ({
          theme: state.theme,
          reducedMotion: state.reducedMotion,
          lowDataMode: state.lowDataMode,
          safeAreaInsets: state.safeAreaInsets,
        }),
        
        version: 1,
      }
    ),
    {
      name: 'UIStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

export const uiSelectors = {
  // Theme selectors
  theme: (state: UIStore) => state.theme,
  isDarkMode: (state: UIStore) => state.isDarkMode,
  
  // Network selectors
  isOnline: (state: UIStore) => state.isOnline,
  connectionStatus: (state: UIStore) => ({
    isOnline: state.isOnline,
    isConnecting: state.isConnecting,
    lastOnline: state.lastOnline,
  }),
  
  // Modal selectors
  activeModal: (state: UIStore) => state.activeModal,
  hasActiveModal: (state: UIStore) => !!state.activeModal,
  canGoBackModal: (state: UIStore) => state.modalHistory.length > 0,
  
  // Notification selectors
  notifications: (state: UIStore) => state.notifications,
  hasNotifications: (state: UIStore) => state.notifications.length > 0,
  
  // Match selectors
  isMatchModalOpen: (state: UIStore) => state.isMatchModalOpen,
  currentMatch: (state: UIStore) => state.currentMatch,
  hasQueuedMatches: (state: UIStore) => state.matchQueue.length > 0,
  
  // Animation selectors
  swipeState: (state: UIStore) => ({
    animation: state.swipeAnimation,
    direction: state.swipeDirection,
  }),
  
  // Loading selectors
  isLoading: (state: UIStore) => state.globalLoading,
  loadingState: (state: UIStore) => ({
    isLoading: state.globalLoading,
    message: state.loadingMessage,
  }),
};

// ============================================================================
// HOOKS
// ============================================================================

export const useTheme = () => useUIStore(uiSelectors.theme);
export const useIsDarkMode = () => useUIStore(uiSelectors.isDarkMode);
export const useIsOnline = () => useUIStore(uiSelectors.isOnline);
export const useActiveModal = () => useUIStore(uiSelectors.activeModal);
export const useNotifications = () => useUIStore(uiSelectors.notifications);
export const useIsMatchModalOpen = () => useUIStore(uiSelectors.isMatchModalOpen);
export const useSwipeState = () => useUIStore(uiSelectors.swipeState);
export const useGlobalLoading = () => useUIStore(uiSelectors.loadingState);

// ============================================================================
// UTILITIES
// ============================================================================

// Auto-remove notifications after their duration
export const setupNotificationAutoRemoval = () => {
  const store = useUIStore.getState();
  
  store.notifications.forEach((notification) => {
    if (notification.duration && notification.duration > 0) {
      const timeElapsed = Date.now() - notification.createdAt;
      const remainingTime = notification.duration - timeElapsed;
      
      if (remainingTime > 0) {
        setTimeout(() => {
          store.removeNotification(notification.id);
        }, remainingTime);
      } else {
        // Already expired
        store.removeNotification(notification.id);
      }
    }
  });
};

// ============================================================================
// EXPORTS
// ============================================================================

export default useUIStore;
export type { 
  Theme, 
  ModalType, 
  NotificationType, 
  SwipeAnimation, 
  Notification, 
  Match, 
  UIState, 
  UIActions 
};

