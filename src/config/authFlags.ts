// Auth Feature Flags - T-UI-001 Phase 5B
// Correctness-first auth policy with environment variable backing

interface AuthFlags {
  AUTH_ROUTER_NAV_ENABLED: boolean;
  AUTH_HARD_NAV_ENFORCED: boolean;
  AUTH_BOOTSTRAP_SINGLE_ME: boolean;
  AUTH_PERSIST_BARRIER: boolean;
  AUTH_BREADCRUMBS_ENABLED: boolean;
  AUTH_GLOBAL401_EXCLUDE_ME: boolean;
  AUTH_LOGIN_HANDSHAKE_ENFORCED: boolean;
  AUTH_TELEMETRY_SAMPLING: number;
  AUTH_CANARY_PERCENT: number;
}

// Correctness-first defaults per specification
const DEFAULT_FLAGS: AuthFlags = {
  // Router navigation disabled by default - hard navigation only
  AUTH_ROUTER_NAV_ENABLED: false,
  
  // Force hard navigation for auth transitions
  AUTH_HARD_NAV_ENFORCED: true,
  
  // Guarantee single /me probe on boot
  AUTH_BOOTSTRAP_SINGLE_ME: true,
  
  // Prevent persisted state from clobbering fresh /me result
  AUTH_PERSIST_BARRIER: true,
  
  // Structured console breadcrumbs for auth flows
  AUTH_BREADCRUMBS_ENABLED: true,
  
  // Global 401 interceptor excludes /api/auth/me
  AUTH_GLOBAL401_EXCLUDE_ME: true,
  
  // Login → wait for confirmed /me(200) → then navigate
  AUTH_LOGIN_HANDSHAKE_ENFORCED: true,
  
  // Breadcrumb sampling rate (dev=1.0, staging=0.5, prod≈0.1)
  AUTH_TELEMETRY_SAMPLING: process.env.NODE_ENV === 'development' ? 1.0 : 
                           process.env.NODE_ENV === 'production' ? 0.1 : 0.5,
  
  // Future canary for router nav - keep at 0 in Phase 5B
  AUTH_CANARY_PERCENT: 0,
};

// Get flag value with environment variable override
const getAuthFlag = <K extends keyof AuthFlags>(flag: K): AuthFlags[K] => {
  const envVar = `VITE_${flag}`;
  const envValue = import.meta.env[envVar];
  
  if (envValue !== undefined) {
    // Handle boolean flags
    if (typeof DEFAULT_FLAGS[flag] === 'boolean') {
      return (envValue === 'true') as AuthFlags[K];
    }
    
    // Handle numeric flags
    if (typeof DEFAULT_FLAGS[flag] === 'number') {
      const numValue = parseFloat(envValue);
      return (isNaN(numValue) ? DEFAULT_FLAGS[flag] : numValue) as AuthFlags[K];
    }
  }
  
  return DEFAULT_FLAGS[flag];
};

// Convenience functions for specific flags
export const isRouterNavEnabled = (): boolean => getAuthFlag('AUTH_ROUTER_NAV_ENABLED');
export const isHardNavEnforced = (): boolean => getAuthFlag('AUTH_HARD_NAV_ENFORCED');
export const isBootstrapSingleMe = (): boolean => getAuthFlag('AUTH_BOOTSTRAP_SINGLE_ME');
export const isPersistBarrierEnabled = (): boolean => getAuthFlag('AUTH_PERSIST_BARRIER');
export const isBreadcrumbsEnabled = (): boolean => getAuthFlag('AUTH_BREADCRUMBS_ENABLED');
export const isGlobal401ExcludeMe = (): boolean => getAuthFlag('AUTH_GLOBAL401_EXCLUDE_ME');
export const isLoginHandshakeEnforced = (): boolean => getAuthFlag('AUTH_LOGIN_HANDSHAKE_ENFORCED');
export const getTelemetrySampling = (): number => getAuthFlag('AUTH_TELEMETRY_SAMPLING');
export const getCanaryPercent = (): number => getAuthFlag('AUTH_CANARY_PERCENT');

// Runtime assert to detect accidental router usage in auth flows
export const assertHardNavOnly = (context: string) => {
  if (!isHardNavEnforced()) {
    return; // Allow router nav if hard nav not enforced
  }
  
  if (isRouterNavEnabled()) {
    console.warn(`[AUTH_ASSERT] Router navigation attempted in ${context} while AUTH_ROUTER_NAV_ENABLED=true but AUTH_HARD_NAV_ENFORCED=true`);
  }
};

// Get all current flag values for debugging
export const getAllAuthFlags = (): AuthFlags => ({
  AUTH_ROUTER_NAV_ENABLED: getAuthFlag('AUTH_ROUTER_NAV_ENABLED'),
  AUTH_HARD_NAV_ENFORCED: getAuthFlag('AUTH_HARD_NAV_ENFORCED'),
  AUTH_BOOTSTRAP_SINGLE_ME: getAuthFlag('AUTH_BOOTSTRAP_SINGLE_ME'),
  AUTH_PERSIST_BARRIER: getAuthFlag('AUTH_PERSIST_BARRIER'),
  AUTH_BREADCRUMBS_ENABLED: getAuthFlag('AUTH_BREADCRUMBS_ENABLED'),
  AUTH_GLOBAL401_EXCLUDE_ME: getAuthFlag('AUTH_GLOBAL401_EXCLUDE_ME'),
  AUTH_LOGIN_HANDSHAKE_ENFORCED: getAuthFlag('AUTH_LOGIN_HANDSHAKE_ENFORCED'),
  AUTH_TELEMETRY_SAMPLING: getAuthFlag('AUTH_TELEMETRY_SAMPLING'),
  AUTH_CANARY_PERCENT: getAuthFlag('AUTH_CANARY_PERCENT'),
});

// Development helper to log current flag state
export const logAuthFlags = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUTH_FLAGS] Current configuration:', getAllAuthFlags());
  }
};

export default {
  getAuthFlag,
  isRouterNavEnabled,
  isHardNavEnforced,
  isBootstrapSingleMe,
  isPersistBarrierEnabled,
  isBreadcrumbsEnabled,
  isGlobal401ExcludeMe,
  isLoginHandshakeEnforced,
  getTelemetrySampling,
  getCanaryPercent,
  assertHardNavOnly,
  getAllAuthFlags,
  logAuthFlags,
};

