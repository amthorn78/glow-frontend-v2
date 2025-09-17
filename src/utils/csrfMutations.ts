// GM11-FE-1: Centralized CSRF Mutation Wrapper
// Eliminates React context dependencies for CSRF token handling

import { emitAuthBreadcrumb } from './authTelemetry';

// Runtime debug flag helper (default OFF)
const debugKeysOnly = (): boolean => {
  return Boolean(process.env.NEXT_PUBLIC_GLOW_DEBUG_KEYS_ONLY === '1');
};

// CSRF telemetry flag helper (default OFF)
const csrfTelemetryEnabled = (): boolean => {
  return Boolean(process.env.NEXT_PUBLIC_GLOW_TELEMETRY_CSRF === '1');
};

// Deterministic 10% sampling based on hash-mod-10
const shouldSampleCsrfTelemetry = (): boolean => {
  if (!csrfTelemetryEnabled()) return false;
  
  // Simple hash of current timestamp for deterministic sampling
  const hash = Date.now().toString().split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return Math.abs(hash) % 10 === 0; // 10% sampling
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
export function getCsrfTokenFromCookie(): string | null {
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
  const rotateStartTime = Date.now();
  
  try {
    emitAuthBreadcrumb('auth.bootstrap.me.start', { route: '/api/auth/csrf' });
    
    const response = await fetch('/api/auth/csrf', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const rotateDuration = Math.round(Date.now() - rotateStartTime);

    if (!response.ok) {
      // CSRF telemetry: rotate failure
      if (shouldSampleCsrfTelemetry()) {
        const statusCategory = response.status >= 500 ? '5xx' : '401';
        console.info(`bd_csrf_rotate_${statusCategory}`, { 
          status: response.status, 
          dur_ms: rotateDuration 
        });
      }
      
      emitAuthBreadcrumb('auth.bootstrap.me.401', { 
        http_status: response.status
      });
      return null;
    }

    // CSRF telemetry: rotate success
    if (shouldSampleCsrfTelemetry()) {
      console.info('bd_csrf_rotate_200', { 
        status: 200, 
        dur_ms: rotateDuration 
      });
    }

    const data = await response.json();
    emitAuthBreadcrumb('auth.bootstrap.me.200', { 
      http_status: 200
    });
    
    return data.csrf_token || null;
  } catch (error) {
    const rotateDuration = Math.round(Date.now() - rotateStartTime);
    
    // CSRF telemetry: rotate error
    if (shouldSampleCsrfTelemetry()) {
      console.info('bd_csrf_rotate_5xx', { 
        status: 0, 
        dur_ms: rotateDuration 
      });
    }
    
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
    
    // HF-BIO-001C: Strict success gate - 4xx never counts as success
    if (!response.ok && response.status !== 403) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    let data;
    
    // HF-BIO-001C: Safely parse JSON, handle plain text responses
    try {
      data = await response.json();
    } catch (jsonError) {
      // Handle plain text responses (e.g., proxy 400s)
      const bodyText = await response.text();
      data = {
        code: 'HTTP_ERROR',
        error: `HTTP ${response.status}`,
        status: response.status,
        bodyText: bodyText
      };
    }

    // Check for CSRF error on first attempt
    if (response.status === 403 && isCsrfError(data)) {
      // CSRF telemetry: auto-recovery start
      if (shouldSampleCsrfTelemetry()) {
        console.info('bd_csrf_auto_recover_start', { retry: 1 });
      }
      
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
        
        // HF-BIO-001C: Safely parse JSON on retry as well
        try {
          data = await response.json();
        } catch (jsonError) {
          const bodyText = await response.text();
          data = {
            code: 'HTTP_ERROR',
            error: `HTTP ${response.status}`,
            status: response.status,
            bodyText: bodyText
          };
        }

        if (response.ok) {
          // CSRF telemetry: auto-recovery success
          if (shouldSampleCsrfTelemetry()) {
            console.info('bd_csrf_auto_recover_success', { retry: 1 });
          }
          
          // Runtime-gated debug breadcrumb (keys-only)
          if (debugKeysOnly()) {
            console.info('bd_csrf_auto_recover success');
          }

          emitAuthBreadcrumb('auth.login.success', { 
            route: path,
            latency_ms: Date.now() - startTime
          });
        } else {
          // CSRF telemetry: auto-recovery fail
          if (shouldSampleCsrfTelemetry()) {
            console.info('bd_csrf_auto_recover_fail', { retry: 1 });
          }
          
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
        // CSRF telemetry: auto-recovery fail (token refresh failed)
        if (shouldSampleCsrfTelemetry()) {
          console.info('bd_csrf_auto_recover_fail', { retry: 0 });
        }
        
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
  return mutateWithCsrf('PUT', '/api/profile/basic-info', profileData);
}


/**
 * Lake Reflex Helper Types
 */
export interface LakeReflexOptions {
  queryKeys: string[];
  onSuccess?: () => void;
  onError?: (error: string, code?: string) => void;
}

export interface LakeReflexResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Shared lake reflex helper: mutate → cancel stale reads → refetch → success UI
 * Enforces "write → invalidate → refetch → render" pattern with no mutation body parsing
 * 
 * @param method HTTP method (POST, PUT, PATCH, DELETE)
 * @param path API path (relative, e.g., '/api/profile/basic-info')
 * @param body Request body
 * @param options Lake reflex options with query keys and callbacks
 * @returns Promise with response metadata (no body parsing on success)
 */
export async function mutateWithLakeReflex<T = any>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body: any,
  options: LakeReflexOptions,
  queryClient: any // QueryClient instance
): Promise<LakeReflexResponse<T>> {
  const { queryKeys, onSuccess, onError } = options;
  const startTime = Date.now();
  
  try {
    // Cancel any stale reads before mutation
    await queryClient.cancelQueries({ queryKey: queryKeys });
    
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
      body: JSON.stringify(body)
    };

    // First attempt
    let response = await fetch(path, requestOptions);
    
    // Check for CSRF error on first attempt (status-based detection only)
    if (response.status === 403) {
      // CSRF telemetry: auto-recovery start
      if (shouldSampleCsrfTelemetry()) {
        console.info('bd_csrf_auto_recover_start', { retry: 1 });
      }
      
      // Runtime-gated debug breadcrumb (keys-only)
      if (debugKeysOnly()) {
        console.info('bd_csrf_auto_recover start');
      }

      emitAuthBreadcrumb('auth.handshake.me_invalidate', { 
        route: path,
        error_code: 'CSRF_403'
      });

      // Attempt to refresh CSRF token (exactly one retry)
      const newToken = await refreshCsrfToken();
      
      if (newToken) {
        // Update headers with new token
        headers['X-CSRF-Token'] = newToken;
        requestOptions.headers = headers;

        // Retry the original request (exactly once)
        response = await fetch(path, requestOptions);

        if (response.ok) {
          // CSRF telemetry: auto-recovery success
          if (shouldSampleCsrfTelemetry()) {
            console.info('bd_csrf_auto_recover_success', { retry: 1 });
          }
          
          // Runtime-gated debug breadcrumb (keys-only)
          if (debugKeysOnly()) {
            console.info('bd_csrf_auto_recover success');
          }

          emitAuthBreadcrumb('auth.login.success', { 
            route: path,
            latency_ms: Date.now() - startTime
          });
        } else {
          // CSRF telemetry: auto-recovery fail
          if (shouldSampleCsrfTelemetry()) {
            console.info('bd_csrf_auto_recover_fail', { retry: 1 });
          }
          
          // Runtime-gated debug breadcrumb (keys-only)
          if (debugKeysOnly()) {
            console.info(`bd_csrf_auto_recover fail status=${response.status}`);
          }

          emitAuthBreadcrumb('auth.login.break_glass.reload', { 
            route: path,
            http_status: response.status
          });
        }
      } else {
        // CSRF telemetry: auto-recovery fail (token refresh failed)
        if (shouldSampleCsrfTelemetry()) {
          console.info('bd_csrf_auto_recover_fail', { retry: 0 });
        }
        
        // Runtime-gated debug breadcrumb (keys-only)
        if (debugKeysOnly()) {
          console.info('bd_csrf_auto_recover fail code=csrf_refresh_failed');
        }

        emitAuthBreadcrumb('auth.login.break_glass.reload', { 
          route: path,
          error_code: 'csrf_refresh_failed'
        });
      }
    }

    // Lake reflex success gate: response.ok only (200/201/204)
    if (response.ok) {
      emitAuthBreadcrumb('auth.login.success', { 
        route: path,
        latency_ms: Date.now() - startTime
      });

      // Runtime-gated response metadata (keys-only)
      if (debugKeysOnly()) {
        console.info('bd_resp_meta', { 
          route: path, 
          ok: response.ok, 
          status: response.status
        });
      }

      // Lake reflex: refetch specified query keys (exactly one GET)
      await queryClient.refetchQueries({ 
        queryKey: queryKeys, 
        exact: true,
        type: 'active'
      });

      // Success UI fires AFTER refetch completes
      if (onSuccess) {
        onSuccess();
      }

      return {
        ok: true,
        data: undefined // Never parse mutation body on success
      };

    } else {
      // Error path: no refetch, surface typed error
      emitAuthBreadcrumb('auth.login.break_glass.reload', { 
        route: path,
        http_status: response.status
      });

      const errorMessage = `Failed to update (HTTP ${response.status})`;
      
      if (onError) {
        onError(errorMessage, `HTTP_${response.status}`);
      }

      return {
        ok: false,
        error: errorMessage,
        code: `HTTP_${response.status}`
      };
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Network error';
    
    emitAuthBreadcrumb('auth.login.break_glass.reload', { 
      route: path,
      error_code: errorMessage
    });

    if (onError) {
      onError(errorMessage, 'NETWORK_ERROR');
    }

    return {
      ok: false,
      error: errorMessage,
      code: 'NETWORK_ERROR'
    };
  }
}
