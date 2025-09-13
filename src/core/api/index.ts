// Unified API Service for GLOW Dating App
// Phase 1: CALCINATION - Pure Foundation Architecture
// Replaces the 3 conflicting data services with a single, unified service

import { 
  ApiResponse, 
  PaginatedResponse,
  User,
  LoginCredentials,
  RegisterData,
  BirthData,
  BirthDataForm,
  UserProfile,
  Match,
  SwipeAction,
  Conversation,
  Message,
  CompatibilityScore,
  AdminStats,
  ReportedContent,
} from '../types';
import { API_CONFIG, AUTH_CONFIG, ERROR_MESSAGES } from '../constants';

// ============================================================================
// API CLIENT CLASS
// ============================================================================

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.maxRetries = API_CONFIG.MAX_RETRIES;
    this.retryDelay = API_CONFIG.RETRY_DELAY;
  }

  // ============================================================================
  // CORE HTTP METHODS
  // ============================================================================

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const token = this.getAccessToken();

      const config: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        signal: AbortSignal.timeout(this.timeout),
      };

      const response = await fetch(url, config);
      
      // Handle token expiration
      if (response.status === 401 && token) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry with new token
          return this.request(endpoint, options, retryCount);
        } else {
          // Refresh failed, redirect to login
          this.handleAuthFailure();
          throw new Error(ERROR_MESSAGES.TOKEN_EXPIRED);
        }
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || ERROR_MESSAGES.SERVER_ERROR);
      }

      return data;
    } catch (error) {
      // Retry logic for network errors
      if (retryCount < this.maxRetries && this.isRetryableError(error)) {
        await this.delay(this.retryDelay * Math.pow(2, retryCount));
        return this.request(endpoint, options, retryCount + 1);
      }

      throw this.handleError(error);
    }
  }

  private async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  private async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  private async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  private async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; access_token: string; refresh_token: string }>> {
    const response = await this.post<{ user: User; access_token: string; refresh_token: string }>('/auth/login', credentials);
    
    if (response.success && response.data) {
      this.setTokens(response.data.access_token, response.data.refresh_token);
      this.setUserData(response.data.user);
    }
    
    return response;
  }

  async register(userData: RegisterData): Promise<ApiResponse<{ user: User; access_token: string; refresh_token: string }>> {
    const response = await this.post<{ user: User; access_token: string; refresh_token: string }>('/auth/register', userData);
    
    if (response.success && response.data) {
      this.setTokens(response.data.access_token, response.data.refresh_token);
      this.setUserData(response.data.user);
    }
    
    return response;
  }

  async logout(): Promise<ApiResponse<void>> {
    try {
      await this.post('/auth/logout');
    } finally {
      this.clearAuthData();
    }
    return { success: true };
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return false;

      const response = await this.post<{ access_token: string; refresh_token: string }>('/auth/refresh', {
        refresh_token: refreshToken,
      });

      if (response.success && response.data) {
        this.setTokens(response.data.access_token, response.data.refresh_token);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    
    return false;
  }

  // ============================================================================
  // USER PROFILE METHODS
  // ============================================================================

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.get<User>('/users/me');
  }

  async updateProfile(profileData: Partial<User>): Promise<ApiResponse<User>> {
    return this.put<User>('/profile', profileData);
  }

  async getUserProfile(userId: string): Promise<ApiResponse<UserProfile>> {
    return this.get<UserProfile>(`/users/${userId}/profile`);
  }

  async updateUserProfile(profileData: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return this.put<UserProfile>('/users/me/profile', profileData);
  }

  // ============================================================================
  // BIRTH DATA METHODS
  // ============================================================================

  async getBirthData(): Promise<ApiResponse<BirthData>> {
    return this.get<BirthData>('/profile/birth-data');
  }

  async getUserBirthData(userId: string): Promise<ApiResponse<BirthData>> {
    // For now, just use the same endpoint since birth data is user-specific
    return this.get<BirthData>('/profile/birth-data');
  }

  async saveBirthData(birthData: BirthDataForm): Promise<ApiResponse<BirthData>> {
    return this.post<BirthData>('/birth-data', birthData);
  }

  async updateBirthData(birthData: any): Promise<ApiResponse<BirthData>> {
    // Handle both structured format (new) and legacy format
    if (typeof birthData === 'object' && 'year' in birthData) {
      // New structured format - send directly
      return this.post<BirthData>('/profile/update-birth-data', birthData);
    } else {
      // Legacy format - wrap in birth_data object
      return this.post<BirthData>('/profile/update-birth-data', birthData);
    }
  }

  async deleteBirthData(): Promise<ApiResponse<void>> {
    return this.delete<void>('/birth-data');
  }

  // ============================================================================
  // DISCOVERY & MATCHING METHODS
  // ============================================================================

  async getDiscoveryProfiles(limit = 10): Promise<ApiResponse<UserProfile[]>> {
    return this.get<UserProfile[]>(`/discovery/profiles?limit=${limit}`);
  }

  async swipeUser(userId: string, action: 'like' | 'pass' | 'super_like'): Promise<ApiResponse<{ match?: Match }>> {
    return this.post<{ match?: Match }>('/discovery/swipe', {
      swiped_user_id: userId,
      action,
    });
  }

  async getMatches(page = 1, limit = 20): Promise<ApiResponse<PaginatedResponse<Match>>> {
    return this.get<PaginatedResponse<Match>>(`/matches?page=${page}&limit=${limit}`);
  }

  async getCompatibilityScore(userId: string): Promise<ApiResponse<CompatibilityScore>> {
    return this.get<CompatibilityScore>(`/compatibility/${userId}`);
  }

  // ============================================================================
  // MESSAGING METHODS
  // ============================================================================

  async getConversations(page = 1, limit = 20): Promise<ApiResponse<PaginatedResponse<Conversation>>> {
    return this.get<PaginatedResponse<Conversation>>(`/conversations?page=${page}&limit=${limit}`);
  }

  async getMessages(conversationId: string, page = 1, limit = 50): Promise<ApiResponse<PaginatedResponse<Message>>> {
    return this.get<PaginatedResponse<Message>>(`/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
  }

  async sendMessage(conversationId: string, content: string): Promise<ApiResponse<Message>> {
    return this.post<Message>(`/conversations/${conversationId}/messages`, {
      content,
    });
  }

  async markMessageAsRead(messageId: string): Promise<ApiResponse<void>> {
    return this.put<void>(`/messages/${messageId}/read`);
  }

  // ============================================================================
  // ADMIN METHODS
  // ============================================================================

  async getAdminStats(): Promise<ApiResponse<AdminStats>> {
    return this.get<AdminStats>('/admin/stats');
  }

  async getReportedContent(page = 1, limit = 20): Promise<ApiResponse<PaginatedResponse<ReportedContent>>> {
    return this.get<PaginatedResponse<ReportedContent>>(`/admin/reports?page=${page}&limit=${limit}`);
  }

  async moderateUser(userId: string, action: 'warn' | 'suspend' | 'ban'): Promise<ApiResponse<void>> {
    return this.post<void>(`/admin/users/${userId}/moderate`, { action });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async uploadPhoto(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('photo', file);

    return this.request<{ url: string }>('/upload/photo', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  async searchLocation(query: string): Promise<ApiResponse<Array<{ name: string; lat: number; lon: number }>>> {
    return this.get<Array<{ name: string; lat: number; lon: number }>>(`/location/search?q=${encodeURIComponent(query)}`);
  }

  // ============================================================================
  // TOKEN MANAGEMENT
  // ============================================================================

  private getAccessToken(): string | null {
    // Get token from auth store instead of localStorage
    const authStore = (window as any).__ZUSTAND_STORE__?.getState?.() || 
                     JSON.parse(localStorage.getItem('glow-auth-store') || '{}');
    return authStore.state?.token || authStore.token || null;
  }

  private getRefreshToken(): string | null {
    // Get refresh token from auth store instead of localStorage
    const authStore = (window as any).__ZUSTAND_STORE__?.getState?.() || 
                     JSON.parse(localStorage.getItem('glow-auth-store') || '{}');
    return authStore.state?.refreshToken || authStore.refreshToken || null;
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(AUTH_CONFIG.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
  }

  private setUserData(user: User): void {
    localStorage.setItem(AUTH_CONFIG.USER_DATA_KEY, JSON.stringify(user));
  }

  private clearAuthData(): void {
    localStorage.removeItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_DATA_KEY);
  }

  private handleAuthFailure(): void {
    this.clearAuthData();
    // Redirect to login page
    window.location.href = '/login';
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  private isRetryableError(error: any): boolean {
    return (
      error.name === 'TypeError' || // Network errors
      error.name === 'TimeoutError' ||
      (error.status >= 500 && error.status < 600) // Server errors
    );
  }

  private handleError(error: any): Error {
    if (error.name === 'TimeoutError') {
      return new Error(ERROR_MESSAGES.TIMEOUT_ERROR);
    }
    
    if (error.name === 'TypeError') {
      return new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
    
    return error instanceof Error ? error : new Error(ERROR_MESSAGES.SOMETHING_WENT_WRONG);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================================================
  // PUBLIC UTILITY METHODS
  // ============================================================================

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  getCurrentUserData(): User | null {
    const userData = localStorage.getItem(AUTH_CONFIG.USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const apiClient = new ApiClient();

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const {
  // Authentication
  login,
  register,
  logout,
  refreshToken,
  
  // User Profile
  getCurrentUser,
  updateProfile,
  getUserProfile,
  updateUserProfile,
  
  // Birth Data
  getBirthData,
  getUserBirthData,
  saveBirthData,
  updateBirthData,
  deleteBirthData,
  
  // Discovery & Matching
  getDiscoveryProfiles,
  swipeUser,
  getMatches,
  getCompatibilityScore,
  
  // Messaging
  getConversations,
  getMessages,
  sendMessage,
  markMessageAsRead,
  
  // Admin
  getAdminStats,
  getReportedContent,
  moderateUser,
  
  // Utilities
  uploadPhoto,
  searchLocation,
  isAuthenticated,
  getCurrentUserData,
} = apiClient;

export default apiClient;

