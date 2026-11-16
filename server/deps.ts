import type { AiClient } from './ai';
import { createAnthropicClient, DEFAULT_MODEL } from './anthropicClient';
import { createChatCompletionsClient } from './chatCompletionsClient';
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
 *
 * Or, to use an Apologist agent (chat-completions endpoint, x-api-key header) instead of Claude:
 *   APOLOGIST_API_URL     the full endpoint, e.g. https://<agent>/api/v1/chat/completions
 *   APOLOGIST_API_KEY     the agent's key
 *   APOLOGIST_MODEL       optional model override
 * If both sets are present, the Apologist agent is used unless AI_PROVIDER=anthropic.
 */
export function createAi(env: Env): AiClient | null {
  if (env.MOCK_AI === '1') return createMockClient();
  if (env.APOLOGIST_API_URL && env.APOLOGIST_API_KEY && env.AI_PROVIDER !== 'anthropic') {
    return createChatCompletionsClient({
      url: env.APOLOGIST_API_URL,
      apiKey: env.APOLOGIST_API_KEY,
      model: env.APOLOGIST_MODEL || undefined,
    });
  }
  if (!env.ANTHROPIC_API_KEY) return null;
  return createAnthropicClient(env.CLAUDE_MODEL || DEFAULT_MODEL);
}

export function readLimits(env: Env): Limits {
  return { perClient: positive(env.LIVE_DAILY_LIMIT, 10), global: positive(env.LIVE_GLOBAL_LIMIT, 500) };
}

export function createDeps(env: Env, usage: UsageStore, ip: string): Deps {
  return { ai: createAi(env), usage, limits: readLimits(env), ip, now: () => new Date() };
}
