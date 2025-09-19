// FE-3a: Build-time feature flags helper

export const FLAGS = {
  PACE_WRITE: process.env.NEXT_PUBLIC_ENABLE_PREFERRED_PACE_WRITE === '1',
  DEBUG_FLAGS: process.env.NEXT_PUBLIC_DEBUG_FLAGS === '1',
} as const;
