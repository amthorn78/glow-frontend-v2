/**
 * Reader-first reflex helper for lake-compliant UI updates.
 * Ensures exactly one refetch of ['auth','me'] with coalescing and cancellation.
 */

import { QueryClient } from '@tanstack/react-query';

// Module-scoped state for coalescing and cancellation
let pending: AbortController | null = null;
let coalesceTimer: number | undefined;
let currentCorrelationId: string | null = null;

/**
 * Performs a reader-first reflex: cancels in-flight reads, coalesces multiple calls,
 * then awaits exactly one refetch of ['auth','me'].
 */
export async function postSaveReflex(queryClient: QueryClient, correlationId?: string): Promise<void> {
  // Cancel any in-flight request
  if (pending) {
    pending.abort();
    pending = null;
  }

  // Clear existing coalesce timer
  if (coalesceTimer) {
    clearTimeout(coalesceTimer);
  }

  // Store correlation ID for continuity
  if (correlationId) {
    currentCorrelationId = correlationId;
  }

  // Create new AbortController for this refetch
  const controller = new AbortController();
  pending = controller;

  return new Promise((resolve, reject) => {
    coalesceTimer = window.setTimeout(async () => {
      try {
        // Optional dev logging for correlation continuity
        if (process.env.NODE_ENV === 'development' && currentCorrelationId) {
          console.debug('reflex GET cid', currentCorrelationId);
        }

        // Perform exactly one refetch with strict lake options
        await queryClient.fetchQuery({
          queryKey: ['auth', 'me'],
          signal: controller.signal,
          staleTime: 0,
          retry: 0,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
        });
        
        // Clear pending state on success
        pending = null;
        coalesceTimer = undefined;
        currentCorrelationId = null;
        resolve();
      } catch (error) {
        // Swallow AbortError, reject others
        if (error instanceof Error && error.name === 'AbortError') {
          resolve(); // Treat abort as success (request was superseded)
        } else {
          pending = null;
          coalesceTimer = undefined;
          currentCorrelationId = null;
          reject(error);
        }
      }
    }, 200); // 200ms coalescing window
  });
}
