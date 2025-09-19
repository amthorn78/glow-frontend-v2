// Build-time flags. Change in Vercel → redeploy.

const on = (v?: string) => v === '1' || v === 'true';

export const FLAGS = {
  PACE_WRITE: on(import.meta.env.VITE_ENABLE_PREFERRED_PACE_WRITE),
  DEBUG_FLAGS: on(import.meta.env.VITE_DEBUG_FLAGS),
} as const;
