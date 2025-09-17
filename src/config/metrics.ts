// LB-5a: Lake reflex latency metrics configuration
// PII-free write→read timing instrumentation

interface MetricsConfig {
  METRICS_URL: string | null;
  LAKE_METRICS_SAMPLE_RATE: number;
  LAKE_METRICS_DEBUG: boolean;
}

/**
 * Get metrics configuration from environment variables
 * Default: no emission unless METRICS_URL is explicitly set
 */
export function getMetricsConfig(): MetricsConfig {
  const metricsUrl = process.env.NEXT_PUBLIC_METRICS_URL || null;
  const sampleRate = metricsUrl 
    ? parseFloat(process.env.NEXT_PUBLIC_LAKE_METRICS_SAMPLE_RATE || '1.0')
    : 0;
  const debug = process.env.NEXT_PUBLIC_LAKE_METRICS_DEBUG === '1';
  
  return {
    METRICS_URL: metricsUrl,
    LAKE_METRICS_SAMPLE_RATE: Math.max(0, Math.min(1, sampleRate)), // Clamp [0,1]
    LAKE_METRICS_DEBUG: debug
  };
}
