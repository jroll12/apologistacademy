import { z } from 'zod';
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
  /** Optional. Asks the agent to think less, which makes replies faster. Left out when unset. */
  reasoningEffort?: 'low' | 'medium' | 'high';
  fetch?: typeof fetch;
  now?: () => number;
}

/**
 * Netlify stops a function after about 10 seconds. If the first try for a structured reply took
 * longer than this, a second try would be cut off too, so it is not attempted.
 */
export const RETRY_BUDGET_MS = 4000;

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

function labelledRule(labels: Record<string, string>): string {
  const lines = Object.values(labels).map((l) => `${l}: ...`);
  return `Reply in plain text using exactly these labels, each at the start of a line, in this order. No other headings, no markdown, no JSON.\n${lines.join('\n')}`;
}

/** Read "Label: text" sections into an object keyed like `labels`. Tolerates markdown bold and extra spacing. */
export function parseLabelled(text: string, labels: Record<string, string>): Record<string, string> | undefined {
  const clean = text.replace(/\*\*|__|^#+\s*/gm, '');
  const keys = Object.keys(labels);
  const at = keys.map((k) => {
    const m = new RegExp(`(^|\\n)\\s*${labels[k].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`, 'i').exec(clean);
    return m ? { k, start: m.index + m[0].length, from: m.index } : null;
  });
  if (at.some((x) => !x)) return undefined;
  const found = (at as { k: string; start: number; from: number }[]).sort((a, b) => a.from - b.from);
  const out: Record<string, string> = {};
  found.forEach((f, i) => {
    out[f.k] = clean.slice(f.start, i + 1 < found.length ? found[i + 1].from : undefined).trim();
  });
  return Object.values(out).every((v) => v) ? out : undefined;
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

  // The docs list both x-api-key and Authorization: Bearer. Samples use x-api-key, so try it first
  // and, if the key is refused, try Bearer once. The one that works is remembered.
  let auth: 'x-api-key' | 'bearer' = 'x-api-key';

  async function send(body: Record<string, unknown>, signal?: AbortSignal): Promise<Response> {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (auth === 'bearer') headers.authorization = `Bearer ${opts.apiKey}`;
    else headers['x-api-key'] = opts.apiKey;
    try {
      return await doFetch(opts.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...(opts.model ? { model: opts.model } : {}),
          ...(opts.reasoningEffort ? { reasoning_effort: opts.reasoningEffort } : {}),
          // No sign-in, and no memory carried over between people or conversations.
          metadata: { anonymous: true, language: 'en', max_memories: 0 },
          ...body,
        }),
        signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') throw err;
      throw new AiUnavailable('Could not reach the AI service.');
    }
  }

  async function post(body: Record<string, unknown>, signal?: AbortSignal): Promise<Response> {
    let res = await send(body, signal);
    if ((res.status === 401 || res.status === 403) && auth === 'x-api-key') {
      auth = 'bearer';
      res = await send(body, signal);
      if (res.status === 401 || res.status === 403) auth = 'x-api-key';
    }
    if (!res.ok) {
      const detail = await res
        .clone()
        .text()
        .catch(() => '');
      console.error('[agent] request refused', res.status, detail.slice(0, 300));
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
      // Our own check either way. Provider-enforced schemas were unreliable on this platform.
      // With labels, ask for plain labelled text, which agents follow more reliably than JSON.
      // Without, spell out the exact JSON shape so the agent doesn't guess field names.
      const rule = req.labels
        ? labelledRule(req.labels)
        : `${JSON_RULE}\nThe object must match this JSON Schema exactly:\n${JSON.stringify(z.toJSONSchema(schema))}`;
      const read = (content: string) => (req.labels ? parseLabelled(content, req.labels) : extractJson(content));
      let hint = '';
      const now = opts.now ?? Date.now;
      const started = now();
      const deadline = req.deadlineMs ? AbortSignal.timeout(req.deadlineMs) : undefined;
      const signal = deadline && req.signal ? AbortSignal.any([req.signal, deadline]) : (deadline ?? req.signal);
      try {
        for (let attempt = 0; attempt < 2; attempt++) {
          const res = await post(
            { stream: false, messages: messages(req, rule + hint), max_completion_tokens: req.maxTokens },
            signal,
          );
          const body = (await res.json().catch((err: unknown) => {
            if (deadline?.aborted) throw err;
            return null;
          })) as {
            choices?: { message?: { content?: string }; finish_reason?: string }[];
          } | null;
          const choice = body?.choices?.[0];
          if (choice?.finish_reason === 'content_filter') return null;
          const content = choice?.message?.content ?? '';
          const found = read(content);
          const parsed = schema.safeParse(found);
          if (parsed.success) return parsed.data;
          // Enough to diagnose from the server log, without writing anyone's words into it.
          console.error(
            '[agent] reply did not match the expected shape',
            JSON.stringify({
              attempt,
              ms: now() - started,
              labelled: !!req.labels,
              finish: choice?.finish_reason ?? null,
              chars: content.length,
              hadObject: found !== undefined,
              problems: parsed.error.issues.slice(0, 5).map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`),
            }),
          );
          if (now() - started > RETRY_BUDGET_MS) break;
          hint = req.labels
            ? '\nYour last reply did not use the labels. Reply again using exactly the labels, nothing else.'
            : '\nYour last reply was not valid. Reply again with only the JSON object, nothing else.';
        }
      } catch (err) {
        if (deadline?.aborted) {
          console.error('[agent] timed out', JSON.stringify({ ms: now() - started, limitMs: req.deadlineMs }));
          throw new AiUnavailable('Coach took too long. Try again.');
        }
        throw err;
      }
      throw new AiUnavailable('The AI service had a problem. Try again.');
    },
  };
}
