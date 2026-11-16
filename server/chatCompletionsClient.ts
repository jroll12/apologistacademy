import type { z } from 'zod';
import type { AiClient, TextRequest } from './ai';
import { AiUnavailable } from './anthropicClient';

/**
 * A client for an OpenAI-style chat-completions endpoint with an `x-api-key` header, the shape
 * the Apologist agent platform uses (for example POST https://<agent>/api/v1/chat/completions).
 *
 * NOT YET TESTED AGAINST THE REAL PLATFORM. It follows the request shape seen in the team's
 * Navigate the Way API thread and is tested here only against a local stand-in. The first real
 * call may need small changes (field names, whether a system message is honored, streaming format).
 */

export interface ChatCompletionsOptions {
  /** Full endpoint, e.g. https://agent.example/api/v1/chat/completions */
  url: string;
  apiKey: string;
  /** Optional. Leave unset to use the agent's configured model. */
  model?: string;
  fetch?: typeof fetch;
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const JSON_RULE =
  'Reply with one JSON object only. No code fences and no text before or after it. Use exactly the fields the instructions name.';

function messages(req: TextRequest, extraSystem?: string): Message[] {
  const system = extraSystem ? `${req.system}\n\n${extraSystem}` : req.system;
  return [{ role: 'system', content: system }, ...req.turns];
}

/** Pull the first JSON object out of a reply, tolerating code fences and stray text. */
export function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return undefined;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return undefined;
  }
}

export function createChatCompletionsClient(opts: ChatCompletionsOptions): AiClient {
  const doFetch = opts.fetch ?? fetch;

  async function post(body: Record<string, unknown>, signal?: AbortSignal): Promise<Response> {
    let res: Response;
    try {
      res = await doFetch(opts.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': opts.apiKey },
        body: JSON.stringify({ ...(opts.model ? { model: opts.model } : {}), ...body }),
        signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') throw err;
      throw new AiUnavailable('Could not reach the AI service.');
    }
    if (res.status === 401 || res.status === 403) throw new AiUnavailable('Live AI is not set up correctly.');
    if (res.status === 429) throw new AiUnavailable('The AI is busy right now. Try again in a moment.');
    if (!res.ok) throw new AiUnavailable('The AI service had a problem. Try again.');
    return res;
  }

  return {
    async streamText(req, onText) {
      const res = await post(
        {
          stream: true,
          messages: messages(req),
          max_completion_tokens: req.maxTokens,
          response_format: { type: 'raw' },
        },
        req.signal,
      );
      if (!res.body) throw new AiUnavailable('The AI service had a problem. Try again.');

      const decoder = new TextDecoder();
      let buffer = '';
      let finish: string | null = null;
      for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
        buffer += decoder.decode(chunk, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (!data || data === '[DONE]') continue;
          try {
            const choice = JSON.parse(data).choices?.[0];
            const text = choice?.delta?.content;
            if (typeof text === 'string' && text) onText(text);
            if (choice?.finish_reason) finish = choice.finish_reason;
          } catch {
            // A partial or non-JSON line: skip it.
          }
        }
      }
      return { refused: finish === 'content_filter' };
    },

    async json<T>(req: TextRequest, schema: z.ZodType<T>) {
      // Plain JSON with our own check. Provider-enforced schemas were unreliable on this platform.
      for (let attempt = 0; attempt < 2; attempt++) {
        const res = await post(
          { stream: false, messages: messages(req, JSON_RULE), max_completion_tokens: req.maxTokens },
          req.signal,
        );
        const body = (await res.json().catch(() => null)) as {
          choices?: { message?: { content?: string }; finish_reason?: string }[];
        } | null;
        const choice = body?.choices?.[0];
        if (choice?.finish_reason === 'content_filter') return null;
        const parsed = schema.safeParse(extractJson(choice?.message?.content ?? ''));
        if (parsed.success) return parsed.data;
      }
      throw new AiUnavailable('The AI service had a problem. Try again.');
    },
  };
}
