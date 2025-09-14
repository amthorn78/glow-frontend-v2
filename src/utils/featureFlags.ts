// Feature Flags - T-UI-001 Phase 5
// Runtime feature toggles for safe rollback

interface FeatureFlags {
  ROUTER_NAV_ENABLED: boolean;
}

// Default feature flags
const DEFAULT_FLAGS: FeatureFlags = {
  // Default off in production for safety, on in development
  ROUTER_NAV_ENABLED: process.env.NODE_ENV === 'development',
};

// Get feature flag value with environment variable override
export const getFeatureFlag = (flag: keyof FeatureFlags): boolean => {
  // Check for environment variable override
  const envVar = `VITE_${flag}`;
  const envValue = import.meta.env[envVar];
  
  if (envValue !== undefined) {
    return envValue === 'true';
  }
  
  // Fall back to default
  return DEFAULT_FLAGS[flag];
};

// Convenience functions for specific flags
export const isRouterNavEnabled = (): boolean => getFeatureFlag('ROUTER_NAV_ENABLED');

// Dev-only telemetry for feature flag usage
export const logFeatureFlag = (flag: keyof FeatureFlags, context?: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[FEATURE_FLAG] ${flag}=${getFeatureFlag(flag)}`, context || '');
  }
};

export default {
  getFeatureFlag,
  isRouterNavEnabled,
  logFeatureFlag,
};

