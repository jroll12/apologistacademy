import { describe, expect, it } from 'vitest';
import { createDeps } from './deps';
import { kvUsage, type KvLike } from './kvUsage';
import { memoryUsage } from './usage';

function fakeKv(): KvLike & { ttl: number[] } {
  const data = new Map<string, string>();
  const ttl: number[] = [];
  return {
    ttl,
    async get(key) {
      return data.get(key) ?? null;
    },
    async put(key, value, options) {
      data.set(key, value);
      if (options?.expirationTtl) ttl.push(options.expirationTtl);
    },
  };
}

describe('Cloudflare KV usage counter', () => {
  it('counts per key and lets keys expire', async () => {
    const kv = fakeKv();
    const usage = kvUsage(kv);
    expect(await usage.increment('a')).toBe(1);
    expect(await usage.increment('a')).toBe(2);
    expect(await usage.increment('b')).toBe(1);
    expect(kv.ttl.every((t) => t === 172800)).toBe(true);
  });

  it('falls back to memory without a binding, or when KV fails', async () => {
    const none = kvUsage(undefined);
    expect(await none.increment('a')).toBe(1);
    expect(await none.increment('a')).toBe(2);
    const broken = kvUsage({
      get: () => Promise.reject(new Error('down')),
      put: () => Promise.reject(new Error('down')),
    });
    expect(await broken.increment('a')).toBe(1);
  });
});

describe('review time limit per host', () => {
  it('uses the host default, and REVIEW_DEADLINE_MS overrides it', () => {
    expect(createDeps({}, memoryUsage(), 'x').reviewDeadlineMs).toBeUndefined();
    expect(createDeps({}, memoryUsage(), 'x', { reviewDeadlineMs: 25000 }).reviewDeadlineMs).toBe(25000);
    expect(
      createDeps({ REVIEW_DEADLINE_MS: '12000' }, memoryUsage(), 'x', { reviewDeadlineMs: 25000 }).reviewDeadlineMs,
    ).toBe(12000);
  });
});
