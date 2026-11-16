import type { AiClient } from './ai';
import { createAnthropicClient, DEFAULT_MODEL } from './anthropicClient';
import type { Deps, Limits } from './handler';
import { createMockClient } from './mockClient';
import type { UsageStore } from './usage';

type Env = Record<string, string | undefined>;

const positive = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

/**
 * Settings, all optional except the key:
 *   ANTHROPIC_API_KEY     turns live AI on
 *   CLAUDE_MODEL          model id (default claude-opus-5-5)
 *   LIVE_DAILY_LIMIT      conversations per person per day (default 10)
 *   LIVE_GLOBAL_LIMIT     conversations for everyone per day (default 500)
 *   MOCK_AI=1             use the built-in fake model (tests, local runs without a key)
 */
export function createAi(env: Env): AiClient | null {
  if (env.MOCK_AI === '1') return createMockClient();
  if (!env.ANTHROPIC_API_KEY) return null;
  return createAnthropicClient(env.CLAUDE_MODEL || DEFAULT_MODEL);
}

export function readLimits(env: Env): Limits {
  return { perClient: positive(env.LIVE_DAILY_LIMIT, 10), global: positive(env.LIVE_GLOBAL_LIMIT, 500) };
}

export function createDeps(env: Env, usage: UsageStore, ip: string): Deps {
  return { ai: createAi(env), usage, limits: readLimits(env), ip, now: () => new Date() };
}
