import type { z } from 'zod';
import type { AiClient, TextRequest } from './ai';

/**
 * A stand-in for the model, switched on with MOCK_AI=1. It lets the whole live path
 * (streaming, Coach, review, limits) be exercised in tests and locally without an API key.
 * Its text is obviously fake so it can never be mistaken for a real reply.
 */
export function createMockClient(): AiClient {
  return {
    async streamText(req: TextRequest, onText) {
      const replies = req.turns.filter((t) => t.role === 'user').length - 1;
      const text = req.system.includes('The practice ends with this message')
        ? 'Mock skeptic closing line. Thanks for the talk.'
        : `Mock skeptic message ${replies + 1}.`;
      for (const word of text.split(' ')) {
        if (req.signal?.aborted) break;
        onText(word + ' ');
        await new Promise((r) => setTimeout(r, 5));
      }
      return { refused: false };
    },

    async json<T>(req: TextRequest, schema: z.ZodType<T>) {
      const isReview = req.system.includes('Write a short review');
      const raw = isReview
        ? {
            covered: 'Mock: what you covered.',
            couldAdd: 'Mock: what you could add.',
            possibleAnswer: 'Mock: one possible answer.',
          }
        : {
            nudge: 'Mock nudge.',
            outline: 'Mock outline point one.\nMock outline point two.',
            sample: 'Mock sample reply.',
          };
      return schema.parse(raw);
    },
  };
}
