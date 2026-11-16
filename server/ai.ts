import type { z } from 'zod';
import type { ChatTurn } from './prompts';

export type Effort = 'low' | 'medium' | 'high';

export interface TextRequest {
  system: string;
  turns: ChatTurn[];
  effort: Effort;
  maxTokens: number;
  signal?: AbortSignal;
}

/**
 * The few things the server needs from a model. The real implementation is in
 * anthropicClient.ts and is the only file that talks to the Anthropic SDK.
 * mockClient.ts stands in for it in tests and local runs without a key.
 */
export interface AiClient {
  /** Stream a text reply. Resolves when the reply is complete. */
  streamText(req: TextRequest, onText: (delta: string) => void): Promise<{ refused: boolean }>;
  /** Get a reply that matches a schema. Null means the model declined. */
  json<T>(req: TextRequest, schema: z.ZodType<T>): Promise<T | null>;
}
