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
 *   LIVE_DAILY_LIMIT      conversations per person per day (default: no per-person limit)
 *   LIVE_GLOBAL_LIMIT     conversations for everyone per day (default 500)
 *   MOCK_AI=1             use the built-in fake model (tests, local runs without a key)
 *   REVIEW_DEADLINE_MS    how long the review waits for the model (default 8500 on Netlify, 25000 on Cloudflare)
 *
 * Or, to use an Apologist agent (chat-completions endpoint, x-api-key header) instead of Claude:
 *   APOLOGIST_API_URL     the full endpoint, e.g. https://<agent>/api/v1/chat/completions
 *   APOLOGIST_AGENT_DOMAIN  or just the domain, e.g. apologist-academy.apologist.ai (no : or /)
 *   APOLOGIST_API_KEY     the agent's key
 *   APOLOGIST_MODEL       optional model override
 *   APOLOGIST_REASONING_EFFORT  optional low | medium | high; "low" makes replies faster
 * If both sets are present, the Apologist agent is used unless AI_PROVIDER=anthropic.
 */
/**
 * The agent endpoint, from either the full URL or just the domain. The domain form exists
 * because some settings screens will not take a value with ":" or "/" in it.
 */
export function agentEndpoint(env: Env): string | null {
  if (env.APOLOGIST_API_URL) return env.APOLOGIST_API_URL;
  const domain = env.APOLOGIST_AGENT_DOMAIN?.trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
  return domain ? `https://${domain}/api/v1/chat/completions` : null;
}

export function createAi(env: Env): AiClient | null {
  if (env.MOCK_AI === '1') return createMockClient();
  const agentUrl = agentEndpoint(env);
  if (agentUrl && env.APOLOGIST_API_KEY && env.AI_PROVIDER !== 'anthropic') {
    return createChatCompletionsClient({
      url: agentUrl,
      apiKey: env.APOLOGIST_API_KEY,
      model: env.APOLOGIST_MODEL || undefined,
      reasoningEffort: (['low', 'medium', 'high'] as const).find((e) => e === env.APOLOGIST_REASONING_EFFORT),
    });
  }
  if (!env.ANTHROPIC_API_KEY) return null;
  return createAnthropicClient(env.CLAUDE_MODEL || DEFAULT_MODEL);
}

export function readLimits(env: Env): Limits {
  return { perClient: positive(env.LIVE_DAILY_LIMIT, Infinity), global: positive(env.LIVE_GLOBAL_LIMIT, 500) };
}

export function createDeps(
  env: Env,
  usage: UsageStore,
  ip: string,
  defaults: { reviewDeadlineMs?: number } = {},
): Deps {
  return {
    ai: createAi(env),
    usage,
    limits: readLimits(env),
    ip,
    now: () => new Date(),
    // REVIEW_DEADLINE_MS overrides the host's default.
    reviewDeadlineMs: env.REVIEW_DEADLINE_MS ? positive(env.REVIEW_DEADLINE_MS, 8500) : defaults.reviewDeadlineMs,
  };
}
