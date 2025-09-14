// Auth Breadcrumb Telemetry - T-UI-001 Phase 5B
// Structured logging for auth flows with sampling control

import { isBreadcrumbsEnabled, getTelemetrySampling, getAllAuthFlags } from '../config/authFlags';

// Breadcrumb event types per specification
export type AuthBreadcrumb = 
  | 'auth.bootstrap.me.start'
  | 'auth.bootstrap.me.200'
  | 'auth.bootstrap.me.401'
  | 'auth.login.submit'        // F3: New breadcrumb
  | 'auth.login.http_200'      // F3: New breadcrumb
  | 'auth.handshake.me_invalidate'  // F3: New breadcrumb
  | 'auth.handshake.me_200'    // F3: New breadcrumb
  | 'auth.handshake.me_401'    // F3: New breadcrumb
  | 'auth.handshake.me_timeout' // F3: New breadcrumb
  | 'auth.navigate.begin'      // F3: New breadcrumb
  | 'auth.navigate.done'       // F3: New breadcrumb
  | 'auth.login.success'
  | 'auth.login.me.confirmed'
  | 'auth.login.break_glass.reload'
  | 'auth.logout.request'
  | 'auth.logout.success'
  | 'auth.nav.hard.to_login'
  | 'auth.nav.hard.to_dashboard'
  | 'auth.persist.hydration.start'
  | 'auth.persist.hydration.complete'
  | 'auth.persist.hydration.blocked'
  | 'auth.global401.intercepted'
  | 'auth.global401.excluded_me';

// Breadcrumb data fields per specification
interface BreadcrumbData {
  ts_iso: string;
  route?: string;
  query_key?: string;
  http_status?: number;
  retry_count?: number;
  latency_ms?: number;
  error_code?: string;
  user_id?: string;
  session_id?: string;
  flags?: Partial<ReturnType<typeof getAllAuthFlags>>;
  sample_rate?: number;
  [key: string]: any; // Allow additional context fields
}

// Sampling decision based on telemetry rate
const shouldSample = (): boolean => {
  const rate = getTelemetrySampling();
  return Math.random() < rate;
};

// Core breadcrumb emission function
export const emitAuthBreadcrumb = (
  event: AuthBreadcrumb, 
  data: Partial<BreadcrumbData> = {}
): void => {
  // Check if breadcrumbs are enabled
  if (!isBreadcrumbsEnabled()) {
    return;
  }
  
  // Apply sampling
  if (!shouldSample()) {
    return;
  }
  
  // Build complete breadcrumb data
  const breadcrumb: BreadcrumbData = {
    ts_iso: new Date().toISOString(),
    sample_rate: getTelemetrySampling(),
    ...data,
  };
  
  // Include relevant flags for debugging
  if (process.env.NODE_ENV === 'development') {
    breadcrumb.flags = getAllAuthFlags();
  }
  
  // Emit structured log
  console.log(`[AUTH_BREADCRUMB] ${event}`, breadcrumb);
  
  // In production, could send to analytics service
  if (process.env.NODE_ENV === 'production' && shouldSample()) {
    // TODO: Send to analytics/monitoring service
    // analytics.track('auth_breadcrumb', { event, ...breadcrumb });
  }
};

// Convenience functions for common breadcrumbs
export const logBootstrapStart = (route?: string) => {
  emitAuthBreadcrumb('auth.bootstrap.me.start', { route });
};

export const logBootstrapSuccess = (latency_ms: number, user_id?: string) => {
  emitAuthBreadcrumb('auth.bootstrap.me.200', { 
    latency_ms, 
    user_id,
    http_status: 200 
  });
};

export const logBootstrapUnauthenticated = (latency_ms: number) => {
  emitAuthBreadcrumb('auth.bootstrap.me.401', { 
    latency_ms,
    http_status: 401 
  });
};

export const logLoginSuccess = (user_id?: string) => {
  emitAuthBreadcrumb('auth.login.success', { user_id });
};

export const logLoginMeConfirmed = (latency_ms: number, user_id?: string) => {
  emitAuthBreadcrumb('auth.login.me.confirmed', { 
    latency_ms,
    user_id,
    http_status: 200 
  });
};

export const logLoginBreakGlass = (reason: string, target_route: string) => {
  emitAuthBreadcrumb('auth.login.break_glass.reload', { 
    error_code: reason,
    route: target_route 
  });
};

export const logLogoutRequest = () => {
  emitAuthBreadcrumb('auth.logout.request');
};

export const logLogoutSuccess = (latency_ms: number) => {
  emitAuthBreadcrumb('auth.logout.success', { 
    latency_ms,
    http_status: 200 
  });
};

export const logHardNavToLogin = (reason: string) => {
  emitAuthBreadcrumb('auth.nav.hard.to_login', { 
    route: '/login',
    error_code: reason 
  });
};

export const logHardNavToDashboard = (reason: string) => {
  emitAuthBreadcrumb('auth.nav.hard.to_dashboard', { 
    route: '/dashboard',
    error_code: reason 
  });
};

export const logPersistHydrationStart = () => {
  emitAuthBreadcrumb('auth.persist.hydration.start');
};

export const logPersistHydrationComplete = (restored_keys: string[]) => {
  emitAuthBreadcrumb('auth.persist.hydration.complete', { 
    restored_keys: restored_keys.join(',') 
  });
};

export const logPersistHydrationBlocked = (reason: string) => {
  emitAuthBreadcrumb('auth.persist.hydration.blocked', { 
    error_code: reason 
  });
};

export const logGlobal401Intercepted = (endpoint: string, status: number) => {
  emitAuthBreadcrumb('auth.global401.intercepted', { 
    query_key: endpoint,
    http_status: status 
  });
};

export const logGlobal401ExcludedMe = () => {
  emitAuthBreadcrumb('auth.global401.excluded_me', { 
    query_key: '/api/auth/me',
    http_status: 401 
  });
};

// F3: Handshake telemetry convenience functions
export const logLoginSubmit = (email?: string) => {
  emitAuthBreadcrumb('auth.login.submit', { user_id: email });
};

export const logLoginHttp200 = (latency_ms: number) => {
  emitAuthBreadcrumb('auth.login.http_200', { 
    latency_ms,
    http_status: 200 
  });
};

export const logHandshakeMeInvalidate = () => {
  emitAuthBreadcrumb('auth.handshake.me_invalidate', { 
    query_key: '/api/auth/me' 
  });
};

export const logHandshakeMe200 = (latency_ms: number, user_id?: string) => {
  emitAuthBreadcrumb('auth.handshake.me_200', { 
    latency_ms,
    user_id,
    http_status: 200,
    query_key: '/api/auth/me'
  });
};

export const logHandshakeMe401 = (latency_ms: number) => {
  emitAuthBreadcrumb('auth.handshake.me_401', { 
    latency_ms,
    http_status: 401,
    query_key: '/api/auth/me'
  });
};

export const logHandshakeMeTimeout = (timeout_ms: number) => {
  emitAuthBreadcrumb('auth.handshake.me_timeout', { 
    latency_ms: timeout_ms,
    error_code: 'handshake_timeout'
  });
};

export const logNavigateBegin = (target_route: string, reason: string) => {
  emitAuthBreadcrumb('auth.navigate.begin', { 
    route: target_route,
    error_code: reason 
  });
};

export const logNavigateDone = (target_route: string) => {
  emitAuthBreadcrumb('auth.navigate.done', { 
    route: target_route 
  });
};

// Development helper to test breadcrumb system
export const testBreadcrumbs = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUTH_TELEMETRY] Testing breadcrumb system...');
    emitAuthBreadcrumb('auth.bootstrap.me.start', { route: '/test' });
    emitAuthBreadcrumb('auth.bootstrap.me.200', { latency_ms: 123, user_id: 'test' });
    console.log('[AUTH_TELEMETRY] Breadcrumb test complete');
  }
};

export default {
  emitAuthBreadcrumb,
  logBootstrapStart,
  logBootstrapSuccess,
  logBootstrapUnauthenticated,
  logLoginSuccess,
  logLoginMeConfirmed,
  logLoginBreakGlass,
  logLogoutRequest,
  logLogoutSuccess,
  logHardNavToLogin,
  logHardNavToDashboard,
  logPersistHydrationStart,
  logPersistHydrationComplete,
  logPersistHydrationBlocked,
  logGlobal401Intercepted,
  logGlobal401ExcludedMe,
  // F3: Add handshake functions to exports
  logLoginSubmit,
  logLoginHttp200,
  logHandshakeMeInvalidate,
  logHandshakeMe200,
  logHandshakeMe401,
  logHandshakeMeTimeout,
  logNavigateBegin,
  logNavigateDone,
  testBreadcrumbs,
};

