// FE-2: Lake Client Hardening - Auth/Me Client with Coalescing & Cancellation
//
// COALESCING CONTRACT:
// - Multiple fetchAuthMe() calls within 200ms window are batched into single network request
// - If request is in-flight, new calls subscribe to the same promise (no duplicate fetches)
// - Timer and promise are always cleared after resolution/rejection to prevent stale subscriptions
//
// CANCELLATION CONTRACT:
// - One AbortController per in-flight request
// - Previous request is aborted when new fetch starts
// - Request is aborted on component unmount via abort() method
// - AbortError is handled gracefully (treated as unauthenticated state)

import apiClient from '../core/api';

class AuthMeClient {
  private abortController: AbortController | null = null;
  private coalesceTimer: NodeJS.Timeout | null = null;
  private pendingPromise: Promise<any> | null = null;
  private pendingResolvers: Array<{ resolve: (value: any) => void; reject: (error: any) => void }> = [];

  async fetchAuthMe(): Promise<any> {
    // If request is in-flight, subscribe to the same promise
    if (this.pendingPromise) {
      return new Promise((resolve, reject) => {
        this.pendingResolvers.push({ resolve, reject });
      });
    }

    // Start coalescing timer if not already started
    if (!this.coalesceTimer) {
      return new Promise((resolve, reject) => {
        this.pendingResolvers.push({ resolve, reject });
        
        this.coalesceTimer = setTimeout(() => {
          this.executeRequest();
        }, 200);
      });
    }

    // Subscribe to existing coalescing timer
    return new Promise((resolve, reject) => {
      this.pendingResolvers.push({ resolve, reject });
    });
  }

  private async executeRequest(): Promise<void> {
    // Clear coalescing timer
    if (this.coalesceTimer) {
      clearTimeout(this.coalesceTimer);
      this.coalesceTimer = null;
    }

    // Abort previous request if exists
    if (this.abortController) {
      this.abortController.abort();
    }

    // Create new AbortController
    this.abortController = new AbortController();
    const resolvers = [...this.pendingResolvers];
    this.pendingResolvers = [];

    // Execute the request
    this.pendingPromise = this.makeRequest()
      .then(response => {
        const result = response.data.auth === 'authenticated' && response.data.user
          ? { auth: 'authenticated', user: response.data.user }
          : { auth: 'unauthenticated', user: null };
        
        // Resolve all pending promises
        resolvers.forEach(({ resolve }) => resolve(result));
        return result;
      })
      .catch(error => {
        if (error.name === 'AbortError') {
          // Don't reject on abort, just ignore
          return;
        }
        
        const result = { auth: 'unauthenticated', user: null };
        resolvers.forEach(({ resolve }) => resolve(result));
        return result;
      })
      .finally(() => {
        // Always clear state after resolution/rejection to prevent stale subscriptions
        this.pendingPromise = null;
        this.abortController = null;
        if (this.coalesceTimer) {
          clearTimeout(this.coalesceTimer);
          this.coalesceTimer = null;
        }
      });

    await this.pendingPromise;
  }

  private async makeRequest(): Promise<any> {
    // Custom fetch with AbortSignal since apiClient.getCurrentUser doesn't accept signal
    const url = '/api/auth/me';
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'same-origin',
      signal: this.abortController?.signal,
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!isJson) {
      throw new Error(`Server returned non-JSON response: ${response.status}`);
    }

    const data = await response.json();

    if (response.status === 200 && data.ok && data.user) {
      return { data: { auth: 'authenticated', user: data.user } };
    } else if (response.status === 401 && data.code === 'AUTH_REQUIRED') {
      return { data: { auth: 'unauthenticated', user: null } };
    } else {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    if (this.coalesceTimer) {
      clearTimeout(this.coalesceTimer);
      this.coalesceTimer = null;
    }
  }
}

export const authMeClient = new AuthMeClient();
