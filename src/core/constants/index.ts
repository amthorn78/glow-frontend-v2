// Core Constants for GLOW Dating App
// Phase 1: CALCINATION - Pure Foundation Architecture

// ============================================================================
// API CONFIGURATION
// ============================================================================

const API_CONFIG = {
  // Backend API base URL - will be configured via environment variables
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://glow-backend-v4-production.up.railway.app/api',
  
  // API version
  VERSION: 'v1',
  
  // Request timeout in milliseconds
  TIMEOUT: 30000,
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
} as const;

// ============================================================================
// AUTHENTICATION CONSTANTS
// ============================================================================

const AUTH_CONFIG = {
  // Token storage keys
  ACCESS_TOKEN_KEY: 'glow_access_token',
  REFRESH_TOKEN_KEY: 'glow_refresh_token',
  USER_DATA_KEY: 'glow_user_data',
  
  // Token expiration buffer (5 minutes before actual expiration)
  TOKEN_REFRESH_BUFFER: 5 * 60 * 1000,
  
  // Session timeout (24 hours)
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000,
  
  // Password requirements
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIREMENTS: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
  },
} as const;

// ============================================================================
// HUMAN DESIGN CONSTANTS
// ============================================================================

const HUMAN_DESIGN = {
  TYPES: [
    'Manifestor',
    'Generator', 
    'Manifesting Generator',
    'Projector',
    'Reflector'
  ] as const,
  
  CENTERS: [
    'Head',
    'Ajna',
    'Throat',
    'G Center',
    'Heart',
    'Spleen',
    'Solar Plexus',
    'Sacral',
    'Root'
  ] as const,
  
  AUTHORITIES: [
    'Emotional',
    'Sacral',
    'Splenic',
    'Ego',
    'Self-Projected',
    'Mental',
    'Lunar'
  ] as const,
} as const;

// ============================================================================
// MAGIC 10 DIMENSIONS
// ============================================================================

const MAGIC_10_DIMENSIONS = {
  PHYSICAL_ATTRACTION: 'physicalAttraction',
  EMOTIONAL_CONNECTION: 'emotionalConnection',
  INTELLECTUAL_COMPATIBILITY: 'intellectualCompatibility',
  SPIRITUAL_ALIGNMENT: 'spiritualAlignment',
  LIFESTYLE_COMPATIBILITY: 'lifestyleCompatibility',
  COMMUNICATION_STYLE: 'communicationStyle',
  CONFLICT_RESOLUTION: 'conflictResolution',
  INTIMACY_POTENTIAL: 'intimacyPotential',
  LONG_TERM_POTENTIAL: 'longTermPotential',
  OVERALL_COMPATIBILITY: 'overallCompatibility',
} as const;

const MAGIC_10_LABELS = {
  [MAGIC_10_DIMENSIONS.PHYSICAL_ATTRACTION]: 'Physical Attraction',
  [MAGIC_10_DIMENSIONS.EMOTIONAL_CONNECTION]: 'Emotional Connection',
  [MAGIC_10_DIMENSIONS.INTELLECTUAL_COMPATIBILITY]: 'Intellectual Compatibility',
  [MAGIC_10_DIMENSIONS.SPIRITUAL_ALIGNMENT]: 'Spiritual Alignment',
  [MAGIC_10_DIMENSIONS.LIFESTYLE_COMPATIBILITY]: 'Lifestyle Compatibility',
  [MAGIC_10_DIMENSIONS.COMMUNICATION_STYLE]: 'Communication Style',
  [MAGIC_10_DIMENSIONS.CONFLICT_RESOLUTION]: 'Conflict Resolution',
  [MAGIC_10_DIMENSIONS.INTIMACY_POTENTIAL]: 'Intimacy Potential',
  [MAGIC_10_DIMENSIONS.LONG_TERM_POTENTIAL]: 'Long-term Potential',
  [MAGIC_10_DIMENSIONS.OVERALL_COMPATIBILITY]: 'Overall Compatibility',
} as const;

// ============================================================================
// DATING APP CONSTANTS
// ============================================================================

const DATING_CONFIG = {
  // Age restrictions
  MIN_AGE: 18,
  MAX_AGE: 100,
  
  // Distance settings (in kilometers)
  MIN_DISTANCE: 1,
  MAX_DISTANCE: 500,
  DEFAULT_DISTANCE: 50,
  
  // Profile limits
  MAX_PHOTOS: 6,
  MAX_BIO_LENGTH: 500,
  MAX_INTERESTS: 10,
  
  // Swipe settings
  PROFILES_PER_BATCH: 10,
  SWIPE_THRESHOLD: 100, // pixels
  SWIPE_VELOCITY_THRESHOLD: 0.5,
  
  // Messaging
  MAX_MESSAGE_LENGTH: 1000,
  TYPING_INDICATOR_TIMEOUT: 3000,
  MESSAGE_BATCH_SIZE: 50,
} as const;

// ============================================================================
// UI CONSTANTS
// ============================================================================

const UI_CONFIG = {
  // Breakpoints (matching Tailwind CSS)
  BREAKPOINTS: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
  
  // Animation durations (in milliseconds)
  ANIMATIONS: {
    fast: 150,
    normal: 300,
    slow: 500,
    swipe: 200,
    match: 1000,
  },
  
  // Z-index layers
  Z_INDEX: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
    toast: 1070,
  },
  
  // Color themes
  THEMES: {
    light: 'light',
    dark: 'dark',
    auto: 'auto',
  },
} as const;

// ============================================================================
// MOBILE CONSTANTS
// ============================================================================

const MOBILE_CONFIG = {
  // Touch gesture thresholds
  TOUCH_THRESHOLD: 10, // pixels
  SWIPE_THRESHOLD: 50, // pixels
  LONG_PRESS_DURATION: 500, // milliseconds
  
  // Haptic feedback types
  HAPTIC_TYPES: {
    light: 'light',
    medium: 'medium',
    heavy: 'heavy',
    success: 'success',
    warning: 'warning',
    error: 'error',
  },
  
  // Device detection
  MOBILE_BREAKPOINT: 768, // pixels
  TABLET_BREAKPOINT: 1024, // pixels
} as const;

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

const VALIDATION = {
  // Email regex pattern
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Username requirements
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  USERNAME_PATTERN: /^[a-zA-Z0-9_]+$/,
  
  // Name requirements
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 50,
  NAME_PATTERN: /^[a-zA-Z\s'-]+$/,
  
  // Birth time format
  TIME_PATTERN: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  
  // Location validation
  LATITUDE_RANGE: [-90, 90] as const,
  LONGITUDE_RANGE: [-180, 180] as const,
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  
  // Authentication errors
  INVALID_CREDENTIALS: 'Invalid email or password.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  
  // Validation errors
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PASSWORD: 'Password must be at least 8 characters long.',
  PASSWORDS_DONT_MATCH: 'Passwords do not match.',
  INVALID_AGE: 'You must be at least 18 years old to use this app.',
  
  // Birth data errors
  INVALID_BIRTH_DATE: 'Please enter a valid birth date.',
  INVALID_BIRTH_TIME: 'Please enter a valid birth time (HH:MM format).',
  INVALID_LOCATION: 'Please enter a valid birth location.',
  
  // General errors
  SOMETHING_WENT_WRONG: 'Something went wrong. Please try again.',
  NO_INTERNET: 'No internet connection. Please check your network.',
} as const;

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: 'Welcome back!',
  LOGOUT_SUCCESS: 'You have been logged out successfully.',
  REGISTER_SUCCESS: 'Account created successfully! Please verify your email.',
  
  // Profile
  PROFILE_UPDATED: 'Profile updated successfully!',
  BIRTH_DATA_SAVED: 'Birth data saved successfully!',
  PHOTO_UPLOADED: 'Photo uploaded successfully!',
  
  // Matching
  MATCH_FOUND: 'It\'s a match! 🎉',
  MESSAGE_SENT: 'Message sent!',
  
  // General
  CHANGES_SAVED: 'Changes saved successfully!',
} as const;

// ============================================================================
// ROUTES
// ============================================================================

const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // Protected routes
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  DISCOVERY: '/discovery',
  MATCHES: '/matches',
  MESSAGES: '/messages',
  SETTINGS: '/settings',
  
  // Admin routes
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_STATS: '/admin/stats',
} as const;

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  // User preferences
  THEME: 'glow_theme',
  LANGUAGE: 'glow_language',
  NOTIFICATIONS: 'glow_notifications',
  
  // App state
  ONBOARDING_COMPLETED: 'glow_onboarding_completed',
  LAST_ACTIVE: 'glow_last_active',
  
  // Cache keys
  USER_PROFILES_CACHE: 'glow_profiles_cache',
  COMPATIBILITY_CACHE: 'glow_compatibility_cache',
} as const;

// ============================================================================
// EXPORT ALL CONSTANTS
// ============================================================================

export {
  API_CONFIG,
  AUTH_CONFIG,
  HUMAN_DESIGN,
  MAGIC_10_DIMENSIONS,
  MAGIC_10_LABELS,
  DATING_CONFIG,
  UI_CONFIG,
  MOBILE_CONFIG,
  VALIDATION,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ROUTES,
  STORAGE_KEYS,
};

