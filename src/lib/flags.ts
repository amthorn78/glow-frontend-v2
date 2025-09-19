// src/lib/flags.ts
export const FLAGS = {
  PACE_WRITE: import.meta.env.VITE_ENABLE_PREFERRED_PACE_WRITE === '1',
  DEBUG_FLAGS: import.meta.env.VITE_DEBUG_FLAGS === '1',
} as const;
