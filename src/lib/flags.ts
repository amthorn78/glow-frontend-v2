// Build-time flags. Change in Vercel → redeploy.

const on = (v?: string) => v === '1' || v === 'true';

export const FLAGS = {
  PACE_WRITE: on(process.env.NEXT_PUBLIC_ENABLE_PREFERRED_PACE_WRITE),
  DEBUG_FLAGS: on(process.env.NEXT_PUBLIC_DEBUG_FLAGS),
} as const;
