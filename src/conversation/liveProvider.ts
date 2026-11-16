import type { CallOptions, ConversationProvider, ProviderContext } from './provider';
import { ProviderError } from './provider';
import type { CoachContent, Review } from './types';

type ErrorCode = ProviderError['code'];

interface ApiError {
  error?: string;
  code?: ErrorCode;
}

function body(ctx: ProviderContext) {
  return JSON.stringify({
    questionId: ctx.questionId,
    persona: ctx.persona,
    difficulty: ctx.difficulty,
    messages: ctx.messages.map((m) => ({ from: m.from, text: m.text })),
  });
}

async function post(path: string, ctx: ProviderContext, opts?: CallOptions): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: body(ctx),
      signal: opts?.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ProviderError('Could not reach the server. Check your connection.', 'offline');
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as ApiError;
    throw new ProviderError(data.error ?? 'The server could not answer just now.', data.code ?? 'unavailable');
  }
  return res;
}

/** Read a plain-text stream, reporting the text so far as each piece arrives. */
async function readStream(res: Response, opts?: CallOptions): Promise<string> {
  if (!res.body) return (await res.text()).trim();
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    opts?.onText?.(text);
  }
  text += decoder.decode();
  if (!text.trim()) throw new ProviderError('The skeptic had no reply. Try again.');
  return text.trim();
}

/** Talks to the server function, which holds the API key and calls Claude. */
export const liveProvider: ConversationProvider = {
  mode: 'live',
  async opening(ctx, opts) {
    return readStream(await post('/api/skeptic', ctx, opts), opts);
  },
  async reply(ctx, opts) {
    return readStream(await post('/api/skeptic', ctx, opts), opts);
  },
  async coach(ctx, opts) {
    return (await (await post('/api/coach', ctx, opts)).json()) as CoachContent;
  },
  async review(ctx, opts) {
    const r = (await (await post('/api/review', ctx, opts)).json()) as Omit<Review, 'personalized'>;
    return { ...r, personalized: true };
  },
};

/** Ask the server whether live AI is switched on (an API key is set). Any failure means no. */
export async function liveAvailable(timeoutMs = 2500): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch('/api/status', { signal: ctrl.signal });
    if (!res.ok) return false;
    const data = (await res.json()) as { live?: boolean };
    return data.live === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
