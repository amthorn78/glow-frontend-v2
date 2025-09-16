// GM11-FE-1: Centralized CSRF Mutation Wrapper
// Eliminates React context dependencies for CSRF token handling

import { emitAuthBreadcrumb } from './authTelemetry';

// Runtime debug flag helper (default OFF)
const debugKeysOnly = (): boolean => {
  return Boolean(process.env.NEXT_PUBLIC_GLOW_DEBUG_KEYS_ONLY === '1');
};

interface MutationResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: Record<string, string[]>;
}

interface CSRFError {
  code: 'CSRF_MISSING' | 'CSRF_INVALID';
  error: string;
  ok: false;
}

/**
 * Read CSRF token from cookie at call-time (no React context dependency)
 */
function getCsrfTokenFromCookie(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'glow_csrf') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Fetch fresh CSRF token from backend
 */
async function refreshCsrfToken(): Promise<string | null> {
  try {
    emitAuthBreadcrumb('auth.bootstrap.me.start', { route: '/api/auth/csrf' });
    
    const response = await fetch('/api/auth/csrf', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      emitAuthBreadcrumb('auth.bootstrap.me.401', { 
        http_status: response.status
      });
      return null;
    }

    const data = await response.json();
    emitAuthBreadcrumb('auth.bootstrap.me.200', { 
      http_status: 200
    });
    
    return data.csrf_token || null;
  } catch (error) {
    emitAuthBreadcrumb('auth.bootstrap.me.401', { 
      error_code: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
}

/**
 * Check if response indicates CSRF error
 */
function isCsrfError(data: any): data is CSRFError {
  return data && 
         data.ok === false && 
         (data.code === 'CSRF_MISSING' || data.code === 'CSRF_INVALID');
}

/**
 * Centralized mutation wrapper with CSRF protection and auto-retry
 * 
 * @param method HTTP method (POST, PUT, PATCH, DELETE)
 * @param path API path (relative, e.g., '/api/auth/logout')
 * @param body Request body (optional)
 * @returns Promise with response data
 */
export async function mutateWithCsrf<T = any>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: any
): Promise<MutationResponse<T>> {
  const startTime = Date.now();
  
  // Read CSRF token from cookie at call-time
  let csrfToken = getCsrfTokenFromCookie();
  
  emitAuthBreadcrumb('auth.login.submit', { 
    route: path
  });

  // Runtime-gated request logging (keys-only)
  if (debugKeysOnly()) {
    console.info('bd_req_keys', { route: path, keys: Object.keys(body || {}) });
  }

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add CSRF token if available
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  // Prepare request options
  const requestOptions: RequestInit = {
    method,
    credentials: 'include',
    headers,
  };

  // Add body if provided
  if (body !== undefined) {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    // First attempt
    let response = await fetch(path, requestOptions);
    let data = await response.json();

    // Check for CSRF error on first attempt
    if (response.status === 403 && isCsrfError(data)) {
      // Runtime-gated debug breadcrumb (keys-only)
      if (debugKeysOnly()) {
        console.info('bd_csrf_auto_recover start');
      }

      emitAuthBreadcrumb('auth.handshake.me_invalidate', { 
        route: path,
        error_code: data.code
      });

      // Attempt to refresh CSRF token
      const newToken = await refreshCsrfToken();
      
      if (newToken) {
        // Update headers with new token
        headers['X-CSRF-Token'] = newToken;
        requestOptions.headers = headers;

        // Retry the original request
        response = await fetch(path, requestOptions);
        data = await response.json();

        if (response.ok) {
          // Runtime-gated debug breadcrumb (keys-only)
          if (debugKeysOnly()) {
            console.info('bd_csrf_auto_recover success');
          }

          emitAuthBreadcrumb('auth.login.success', { 
            route: path,
            latency_ms: Date.now() - startTime
          });
        } else {
          // Runtime-gated debug breadcrumb (keys-only)
          if (debugKeysOnly()) {
            console.info(`bd_csrf_auto_recover fail code=${data.code || 'unknown'}`);
          }

          emitAuthBreadcrumb('auth.login.break_glass.reload', { 
            route: path,
            http_status: response.status,
            error_code: data.error || 'Unknown error'
          });
        }
      } else {
        // Runtime-gated debug breadcrumb (keys-only)
        if (debugKeysOnly()) {
          console.info('bd_csrf_auto_recover fail code=csrf_refresh_failed');
        }

        emitAuthBreadcrumb('auth.login.break_glass.reload', { 
          route: path,
          error_code: 'csrf_refresh_failed'
        });
      }
    } else if (response.ok) {
      emitAuthBreadcrumb('auth.login.success', { 
        route: path,
        latency_ms: Date.now() - startTime
      });
    } else {
      emitAuthBreadcrumb('auth.login.break_glass.reload', { 
        route: path,
        http_status: response.status,
        error_code: data.error || 'Unknown error'
      });
    }

    // Runtime-gated response metadata (keys-only)
    if (debugKeysOnly()) {
      // Check if time matches HH:mm format (boolean only, no values)
      const timeValue = body?.time || '';
      const matches_hhmm = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(String(timeValue));
      
      console.info('bd_resp_meta', { 
        route: path, 
        ok: response.ok, 
        status: response.status, 
        has_details: !!data.details,
        matches_hhmm 
      });
    }

    // Return structured response
    return {
      ok: response.ok,
      data: response.ok ? data : undefined,
      error: response.ok ? undefined : (data.error || `HTTP ${response.status}`),
      code: data.code,
      details: data.details,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Network error';
    
    emitAuthBreadcrumb('auth.login.break_glass.reload', { 
      route: path,
      error_code: errorMessage
    });

    return {
      ok: false,
      error: errorMessage,
    };
  }
}

/**
 * Convenience wrapper for logout mutations
 */
export async function logoutWithCsrf(): Promise<MutationResponse> {
  return mutateWithCsrf('POST', '/api/auth/logout');
}

/**
 * Convenience wrapper for logout-all mutations
 */
export async function logoutAllWithCsrf(): Promise<MutationResponse> {
  return mutateWithCsrf('POST', '/api/auth/logout-all');
}

/**
 * Convenience wrapper for birth data mutations
 */
export async function updateBirthDataWithCsrf(birthData: any): Promise<MutationResponse> {
  return mutateWithCsrf('PUT', '/api/profile/birth-data', birthData);
}

/**
 * Convenience wrapper for basic profile info mutations
 */
export async function updateBasicInfoWithCsrf(profileData: any): Promise<MutationResponse> {
  return mutateWithCsrf('PUT', '/api/profile/basic', profileData);
}

