// API Client - Auth v2 Cookie-based
// Phase 1: CALCINATION - Pure Foundation Architecture
// Unified service with cookie-based authentication

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
import { API_CONFIG, ERROR_MESSAGES } from '../constants';

// ============================================================================
// API CLIENT CLASS - AUTH v2
// ============================================================================

class ApiClient {
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;
  private _logged = false;

  constructor() {
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
      // Ensure endpoint starts with /api/ for proper Vercel proxy routing
      const url = endpoint.startsWith('/api/') ? endpoint : `/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      const config: RequestInit = {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
        credentials: 'same-origin', // Include cookies for authentication
        signal: controller.signal,
      };

      if (!this._logged) {
        console.log(`[TRACE] fetch → ${config.method || 'GET'} ${url}`);
        this._logged = true;
      }

      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      if (!isJson) {
        // Handle non-JSON responses (HTML error pages, etc.)
        const text = await response.text();
        const error = {
          status: response.status,
          statusText: response.statusText,
          message: `Server returned ${response.status}: ${response.statusText}`,
          details: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
        };
        
        console.error(`[API] Non-JSON response from ${url}:`, error);
        
        // Global 401 handler - redirect to login
        if (response.status === 401) {
          this.handleUnauthorized();
        }
        
        throw new Error(error.message);
      }

      let data: any;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error(`[API] JSON parse error from ${url}:`, parseError);
        throw new Error('Invalid JSON response from server');
      }

      console.log(`[TRACE] fetch ← ${response.status} ${url} {ct: ${contentType}, preview: ${JSON.stringify(data).substring(0, 100)}}`);

      // Global 401 handler for JSON responses (exclude /me endpoint)
      if (response.status === 401 && !url.includes('/api/auth/me')) {
        this.handleUnauthorized();
        throw new Error(data.error || 'Authentication required');
      }

      if (!response.ok) {
        const error = new Error(data.error || data.message || `HTTP ${response.status}`);
        (error as any).status = response.status;
        (error as any).code = data.code;
        throw error;
      }

      return {
        data,
        status: response.status,
        headers: response.headers,
        ok: response.ok,
      };

    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(ERROR_MESSAGES.TIMEOUT);
      }

      // Retry logic for network errors (not 4xx/5xx)
      if (retryCount < this.maxRetries && !error.status) {
        await this.delay(this.retryDelay * Math.pow(2, retryCount));
        return this.request<T>(endpoint, options, retryCount + 1);
      }

      throw error;
    }
  }

  // ============================================================================
  // GLOBAL 401 HANDLER
  // ============================================================================

  private handleUnauthorized(): void {
    // Clear any local auth state
    if (typeof window !== 'undefined') {
      // Broadcast logout to other tabs
      try {
        const channel = new BroadcastChannel('glow-auth');
        channel.postMessage({ type: 'LOGOUT' });
        channel.close();
      } catch (e) {
        console.warn('BroadcastChannel not available');
      }

      // Redirect to login with returnTo
      const currentPath = window.location.pathname + window.location.search;
      const returnTo = encodeURIComponent(currentPath);
      window.location.href = `/login?returnTo=${returnTo}`;
    }
  }

  // ============================================================================
  // HTTP METHOD HELPERS
  // ============================================================================

  private async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = params ? `${endpoint}?${new URLSearchParams(params).toString()}` : endpoint;
    return this.request<T>(url, { method: 'GET' });
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

  private async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  private async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================================================
  // AUTHENTICATION ENDPOINTS - AUTH v2
  // ============================================================================

  async login(credentials: LoginCredentials): Promise<ApiResponse<{ ok: boolean; user?: User; error?: string; code?: string }>> {
    const response = await this.post<{ ok: boolean; user?: User; error?: string; code?: string }>('/api/auth/login', credentials);
    return response;
  }

  async register(data: RegisterData): Promise<ApiResponse<{ ok: boolean; user?: User; error?: string; code?: string }>> {
    const response = await this.post<{ ok: boolean; user?: User; error?: string; code?: string }>('/api/auth/register', data);
    return response;
  }

  async logout(): Promise<ApiResponse<{ ok: boolean }>> {
    const response = await this.post<{ ok: boolean }>('/api/auth/logout');
    return response;
  }

  async logoutAll(): Promise<ApiResponse<{ ok: boolean; revoked_count: number; self_revoked: boolean }>> {
    const response = await this.post<{ ok: boolean; revoked_count: number; self_revoked: boolean }>('/api/auth/logout-all');
    return response;
  }

  async getCurrentUser(): Promise<ApiResponse<{ auth: 'authenticated' | 'unauthenticated'; user?: User; error?: string; code?: string }>> {
    try {
      // Special handling for /me endpoint - don't throw on 401
      const url = '/api/auth/me';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const config: RequestInit = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'same-origin',
        signal: controller.signal,
      };

      console.log(`[TRACE] fetch → GET ${url}`);
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      // Parse JSON response
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      if (!isJson) {
        throw new Error(`Server returned non-JSON response: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[TRACE] fetch ← ${response.status} ${url} {ct: ${contentType}, preview: ${JSON.stringify(data).substring(0, 100)}}`);

      // Special handling for /me endpoint
      if (response.status === 200 && data.ok && data.user) {
        // Authenticated state
        return {
          data: { auth: 'authenticated', user: data.user },
          status: response.status,
          headers: response.headers,
          ok: true,
        };
      } else if (response.status === 401 && data.code === 'AUTH_REQUIRED') {
        // Unauthenticated state - this is valid, not an error
        return {
          data: { auth: 'unauthenticated', user: null, error: data.error, code: data.code },
          status: 200, // Treat as success for query purposes
          headers: response.headers,
          ok: true,
        };
      } else {
        // Other errors
        throw new Error(data.error || `HTTP ${response.status}`);
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  // ============================================================================
  // USER PROFILE ENDPOINTS
  // ============================================================================

  async updateProfile(updates: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    const response = await this.patch<{ user: User }>('/api/user/profile', updates);
    return response;
  }

  async updateBirthData(birthData: BirthDataForm): Promise<ApiResponse<{ user: User }>> {
    const response = await this.patch<{ user: User }>('/api/user/birth-data', birthData);
    return response;
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<{ success: boolean }>> {
    const response = await this.post<{ success: boolean }>('/api/user/change-password', data);
    return response;
  }

  async deleteAccount(data: { password: string }): Promise<ApiResponse<{ success: boolean }>> {
    const response = await this.post<{ success: boolean }>('/api/user/delete-account', data);
    return response;
  }

  // ============================================================================
  // PASSWORD RESET ENDPOINTS
  // ============================================================================

  async forgotPassword(data: { email: string }): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const response = await this.post<{ success: boolean; message: string }>('/api/auth/forgot-password', data);
    return response;
  }

  async resetPassword(data: { token: string; newPassword: string }): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const response = await this.post<{ success: boolean; message: string }>('/api/auth/reset-password', data);
    return response;
  }

  // ============================================================================
  // DISCOVERY & MATCHING ENDPOINTS
  // ============================================================================

  async getMatches(params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<Match>>> {
    const response = await this.get<PaginatedResponse<Match>>('/api/matches', params);
    return response;
  }

  async swipe(data: SwipeAction): Promise<ApiResponse<{ match?: Match; compatibility?: CompatibilityScore }>> {
    const response = await this.post<{ match?: Match; compatibility?: CompatibilityScore }>('/api/swipe', data);
    return response;
  }

  async getCompatibilityScore(userId: string): Promise<ApiResponse<CompatibilityScore>> {
    const response = await this.get<CompatibilityScore>(`/api/compatibility/${userId}`);
    return response;
  }

  // ============================================================================
  // MESSAGING ENDPOINTS
  // ============================================================================

  async getConversations(params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<Conversation>>> {
    const response = await this.get<PaginatedResponse<Conversation>>('/api/conversations', params);
    return response;
  }

  async getMessages(conversationId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<Message>>> {
    const response = await this.get<PaginatedResponse<Message>>(`/api/conversations/${conversationId}/messages`, params);
    return response;
  }

  async sendMessage(conversationId: string, data: { content: string }): Promise<ApiResponse<Message>> {
    const response = await this.post<Message>(`/api/conversations/${conversationId}/messages`, data);
    return response;
  }

  // ============================================================================
  // RESONANCE TEN ENDPOINTS
  // ============================================================================

  async getResonanceConfig(): Promise<ApiResponse<any>> {
    const response = await this.get<any>('/api/config/resonance');
    return response;
  }

  // ============================================================================
  // ADMIN ENDPOINTS
  // ============================================================================

  async getAdminStats(): Promise<ApiResponse<AdminStats>> {
    const response = await this.get<AdminStats>('/api/admin/stats');
    return response;
  }

  async getReportedContent(params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<ReportedContent>>> {
    const response = await this.get<PaginatedResponse<ReportedContent>>('/api/admin/reported-content', params);
    return response;
  }

  async moderateContent(contentId: string, action: 'approve' | 'remove'): Promise<ApiResponse<{ success: boolean }>> {
    const response = await this.post<{ success: boolean }>(`/api/admin/moderate/${contentId}`, { action });
    return response;
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    const response = await this.get<{ status: string; timestamp: string }>('/api/health');
    return response;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const apiClient = new ApiClient();
export default apiClient;

