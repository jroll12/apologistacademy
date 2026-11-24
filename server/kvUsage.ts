import { memoryUsage, type UsageStore } from './usage';

/** The two calls the counter needs from a Cloudflare KV namespace. */
export interface KvLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

/**
 * Cloudflare KV, so counts survive between requests. Without a KV binding, or if KV fails,
 * counting falls back to memory instead of failing the request. Keys expire after two days,
 * since they are per day. Like the Netlify version, the count is approximate under heavy
 * simultaneous use.
 */
export function kvUsage(kv: KvLike | undefined): UsageStore {
  const fallback = memoryUsage();
  return {
    async increment(key) {
      if (!kv) return fallback.increment(key);
      try {
        const next = (Number(await kv.get(key)) || 0) + 1;
        await kv.put(key, String(next), { expirationTtl: 60 * 60 * 48 });
        return next;
      } catch {
        return fallback.increment(key);
      }
    },
  };
}
