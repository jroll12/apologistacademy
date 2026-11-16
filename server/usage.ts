/** Counts conversations started, so the server can cap them per person and overall. */
export interface UsageStore {
  /** Add one to a counter and return the new value. */
  increment(key: string): Promise<number>;
}

/** Lives only as long as the server process. Used locally and as a fallback. */
export function memoryUsage(): UsageStore {
  const counts = new Map<string, number>();
  return {
    async increment(key) {
      const next = (counts.get(key) ?? 0) + 1;
      counts.set(key, next);
      return next;
    },
  };
}

/**
 * Netlify Blobs, so counts survive between function runs. If Blobs is not available
 * (running outside Netlify), counting falls back to memory instead of failing the request.
 * Two requests at the same instant can both read the same count, so this cap is approximate.
 */
export function blobUsage(): UsageStore {
  const fallback = memoryUsage();
  return {
    async increment(key) {
      try {
        const { getStore } = await import('@netlify/blobs');
        const store = getStore('practice-usage');
        const current = Number((await store.get(key)) ?? 0) || 0;
        await store.set(key, String(current + 1));
        return current + 1;
      } catch {
        return fallback.increment(key);
      }
    },
  };
}

/** UTC day, used in counter keys. */
export function utcDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/** A short, non-reversible label for a client, so raw IP addresses are never stored. */
export async function clientKey(ip: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`practice:${ip}`));
  return Array.from(new Uint8Array(bytes).slice(0, 8), (b) => b.toString(16).padStart(2, '0')).join('');
}
