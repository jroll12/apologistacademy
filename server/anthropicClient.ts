import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import type { z } from 'zod';
import type { AiClient, TextRequest } from './ai';

export const DEFAULT_MODEL = 'claude-opus-5-5';

/**
 * Server-side refusal fallbacks: if the model declines a request for safety reasons, the API
 * re-runs it on a fallback model inside the same call instead of failing the turn.
 */
const FALLBACK_BETA = 'server-side-fallback-2026-07-01';

/** Models that accept the fallback setting. Others reject it, so it is only sent for these. */
const SUPPORTS_FALLBACK = /^claude-(fable-5|mythos-5|opus-5|sonnet-5-5)/;

function fallbackParams(model: string): { betas?: Anthropic.Beta.AnthropicBeta[]; fallbacks?: 'default' } {
  return SUPPORTS_FALLBACK.test(model) ? { betas: [FALLBACK_BETA], fallbacks: 'default' } : {};
}

/** A model failure, with a message that is safe to show the person. */
export class AiUnavailable extends Error {}

function wrap(err: unknown): never {
  if (err instanceof Anthropic.RateLimitError)
    throw new AiUnavailable('The AI is busy right now. Try again in a moment.');
  if (err instanceof Anthropic.AuthenticationError) throw new AiUnavailable('Live AI is not set up correctly.');
  if (err instanceof Anthropic.APIConnectionError) throw new AiUnavailable('Could not reach the AI service.');
  if (err instanceof Anthropic.APIError) throw new AiUnavailable('The AI service had a problem. Try again.');
  throw err;
}

/** The real model client. Reads ANTHROPIC_API_KEY from the environment. */
export function createAnthropicClient(model: string = DEFAULT_MODEL): AiClient {
  const client = new Anthropic();

  return {
    async streamText(req: TextRequest, onText) {
      try {
        const stream = client.beta.messages.stream(
          {
            model,
            max_tokens: req.maxTokens,
            system: req.system,
            messages: req.turns,
            output_config: { effort: req.effort },
            ...fallbackParams(model),
          },
          { signal: req.signal },
        );
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') onText(event.delta.text);
        }
        const final = await stream.finalMessage();
        return { refused: final.stop_reason === 'refusal' };
      } catch (err) {
        wrap(err);
      }
    },

    async json<T>(req: TextRequest, schema: z.ZodType<T>) {
      try {
        const res = await client.beta.messages.parse(
          {
            model,
            max_tokens: req.maxTokens,
            system: req.system,
            messages: req.turns,
            output_config: { effort: req.effort, format: betaZodOutputFormat(schema) },
            ...fallbackParams(model),
          },
          { signal: req.signal },
        );
        if (res.stop_reason === 'refusal') return null;
        return res.parsed_output ?? null;
      } catch (err) {
        wrap(err);
      }
    },
  };
}
