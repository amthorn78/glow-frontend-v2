// Core TypeScript Types for GLOW Dating App
// Phase 1: CALCINATION - Pure Foundation Architecture

// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  profilePicture?: string;
  isActive: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

// ============================================================================
// BIRTH DATA & HUMAN DESIGN TYPES
// ============================================================================

export interface BirthData {
  id: string;
  userId: string;
  birthDate: string;
  birthTime: string;
  birthLocation: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HumanDesignData {
  id: string;
  userId: string;
  type: 'Manifestor' | 'Generator' | 'Manifesting Generator' | 'Projector' | 'Reflector';
  strategy: string;
  authority: string;
  profile: string;
  definition: string;
  centers: HumanDesignCenter[];
  gates: number[];
  channels: number[];
  incarnationCross: string;
  createdAt: string;
  updatedAt: string;
}

export interface HumanDesignCenter {
  name: string;
  defined: boolean;
  gates: number[];
}

// ============================================================================
// MAGIC 10 COMPATIBILITY TYPES
// ============================================================================

export interface Magic10Dimensions {
  physicalAttraction: number;
  emotionalConnection: number;
  intellectualCompatibility: number;
  spiritualAlignment: number;
  lifestyleCompatibility: number;
  communicationStyle: number;
  conflictResolution: number;
  intimacyPotential: number;
  longTermPotential: number;
  overallCompatibility: number;
}

export interface CompatibilityScore {
  id: string;
  user1Id: string;
  user2Id: string;
  magic10: Magic10Dimensions;
  overallScore: number;
  explanation: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// MATCHING & DISCOVERY TYPES
// ============================================================================

export interface UserProfile {
  user: User;
  birthData?: BirthData;
  humanDesign?: HumanDesignData;
  photos: ProfilePhoto[];
  bio: string;
  interests: string[];
  lookingFor: string;
  ageRange: [number, number];
  distanceRange: number;
  isVisible: boolean;
}

export interface ProfilePhoto {
  id: string;
  userId: string;
  url: string;
  isPrimary: boolean;
  order: number;
  createdAt: string;
}

export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  compatibilityScore: CompatibilityScore;
  status: 'pending' | 'matched' | 'passed' | 'blocked';
  matchedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SwipeAction {
  id: string;
  swiperId: string;
  swipedUserId: string;
  action: 'like' | 'pass' | 'super_like';
  createdAt: string;
}

// ============================================================================
// MESSAGING TYPES
// ============================================================================

export interface Conversation {
  id: string;
  matchId: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'gif' | 'system';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface LoadingState {
  isLoading: boolean;
  error?: string;
  lastUpdated?: string;
}

export interface SwipeState {
  currentProfileIndex: number;
  profiles: UserProfile[];
  isLoading: boolean;
  hasMore: boolean;
  swipeDirection?: 'left' | 'right' | 'up';
}

export interface ChatState {
  conversations: Conversation[];
  activeConversation?: string;
  messages: Record<string, Message[]>;
  typingUsers: Record<string, string[]>;
  isConnected: boolean;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface BirthDataForm {
  birthDate: string;
  birthTime: string;
  birthLocation: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export interface ProfileForm {
  bio: string;
  interests: string[];
  lookingFor: string;
  ageRange: [number, number];
  distanceRange: number;
}

// ============================================================================
// MOBILE TYPES
// ============================================================================

export interface TouchGesture {
  type: 'swipe' | 'tap' | 'long_press' | 'pinch';
  direction?: 'left' | 'right' | 'up' | 'down';
  velocity?: number;
  distance?: number;
  duration?: number;
}

export interface DeviceInfo {
  platform: 'web' | 'ios' | 'android';
  isTouch: boolean;
  screenSize: 'small' | 'medium' | 'large';
  orientation: 'portrait' | 'landscape';
}

// ============================================================================
// ADMIN TYPES
// ============================================================================

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalMatches: number;
  totalMessages: number;
  newUsersToday: number;
  matchesToday: number;
  messagesToday: number;
}

export interface ReportedContent {
  id: string;
  reporterId: string;
  reportedUserId: string;
  contentType: 'profile' | 'message' | 'photo';
  contentId: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  // Re-export all types for easy importing
  User,
  AuthTokens,
  LoginCredentials,
  RegisterData,
  BirthData,
  HumanDesignData,
  HumanDesignCenter,
  Magic10Dimensions,
  CompatibilityScore,
  UserProfile,
  ProfilePhoto,
  Match,
  SwipeAction,
  Conversation,
  Message,
  ApiResponse,
  PaginatedResponse,
  LoadingState,
  SwipeState,
  ChatState,
  BirthDataForm,
  ProfileForm,
  TouchGesture,
  DeviceInfo,
  AdminStats,
  ReportedContent,
};

