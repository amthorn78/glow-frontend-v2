/**
 * Resonance Ten Configuration for Frontend
 * Loads canonical model from backend to ensure alignment
 */

export interface ResonanceConfig {
  version: number;
  brand: string;
  keys: string[];
  labels: Record<string, string>;
  sub_facets: Record<string, string[]>;
}

export interface ResonanceDimension {
  key: string;
  label: string;
  description: string;
  icon: string;
}

export interface ResonancePrefs {
  version: number;
  weights: Record<string, number>;
  facets?: Record<string, number>;
}

// Default icons for each dimension (will be used until we get descriptions from backend)
const DEFAULT_ICONS: Record<string, string> = {
  love: '💕',
  intimacy: '💖', 
  communication: '💬',
  friendship: '😄',
  collaboration: '🤝',
  lifestyle: '🏠',
  decisions: '⚖️',
  support: '🤗',
  growth: '🌱',
  space: '🌌'
};

// Default descriptions (will be replaced by backend config)
const DEFAULT_DESCRIPTIONS: Record<string, string> = {
  love: 'How you show affection and romance.',
  intimacy: 'Your pace for closeness and vulnerability.',
  communication: 'How you express, listen, and click in conversation.',
  friendship: 'Everyday ease and shared play.',
  collaboration: 'How you work and decide together on practical things.',
  lifestyle: 'Daily rhythm, habits, and preferences.',
  decisions: 'How choices feel smooth (or sticky) together.',
  support: 'Feeling resourced, encouraged, and seen.',
  growth: 'Learning, goals, and direction as a pair.',
  space: 'Boundaries, independence, and healthy distance.'
};

/**
 * Convert backend config to frontend dimension format
 */
export function configToDimensions(config: ResonanceConfig): ResonanceDimension[] {
  return config.keys.map(key => ({
    key,
    label: config.labels[key] || key,
    description: DEFAULT_DESCRIPTIONS[key] || `Your approach to ${key} in relationships.`,
    icon: DEFAULT_ICONS[key] || '💫'
  }));
}

/**
 * Validate resonance weights
 */
export function validateWeights(weights: Record<string, number>, validKeys: string[]): boolean {
  const providedKeys = Object.keys(weights);
  
  // Check all keys are valid
  for (const key of providedKeys) {
    if (!validKeys.includes(key)) {
      return false;
    }
  }
  
  // Check all values are in range
  for (const value of Object.values(weights)) {
    if (typeof value !== 'number' || value < 0 || value > 100) {
      return false;
    }
  }
  
  return true;
}

/**
 * Create default weights for all dimensions
 */
export function createDefaultWeights(keys: string[]): Record<string, number> {
  const weights: Record<string, number> = {};
  keys.forEach(key => {
    weights[key] = 50; // Default to middle value
  });
  return weights;
}

