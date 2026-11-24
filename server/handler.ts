import { z } from 'zod';
import { MAX_REPLY_CHARS, TOTAL_TURNS, type Message } from '../src/conversation/types';
import { DIFFICULTIES, PERSONAS } from '../src/data/personas';
import { findQuestion } from '../src/data/questions';
import type { AiClient } from './ai';
import { AiUnavailable } from './anthropicClient';
import {
  coachSystem,
  coachTurns,
  reviewSystem,
  reviewTurns,
  skepticSystem,
  skepticTurns,
  type PromptContext,
} from './prompts';
import { clientKey, utcDay, type UsageStore } from './usage';

export interface Limits {
  /** Conversations one client may start per day. */
  perClient: number;
  /** Conversations everyone together may start per day. Bounds the bill. */
  global: number;
}

export interface Deps {
  /** Null when no API key is set: live AI is off and the app uses scripts. */
  ai: AiClient | null;
  usage: UsageStore;
  limits: Limits;
  /** The caller's IP address, for the per-client cap. */
  ip: string;
  now: () => Date;
}

type ErrorCode = 'limit' | 'unavailable' | 'bad_request';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

const fail = (status: number, code: ErrorCode, error: string) => json({ error, code }, status);

const Body = z.object({
  questionId: z.string().max(64),
  persona: z.enum(PERSONAS.map((p) => p.id) as [string, ...string[]]),
  difficulty: z.enum(DIFFICULTIES.map((d) => d.id) as [string, ...string[]]),
  messages: z
    .array(z.object({ from: z.enum(['skeptic', 'me']), text: z.string().min(1).max(MAX_REPLY_CHARS) }))
    .max(TOTAL_TURNS * 2 + 1),
});

const CoachOut = z.object({ nudge: z.string(), outline: z.string(), sample: z.string() });
const ReviewOut = z.object({ covered: z.string(), couldAdd: z.string(), possibleAnswer: z.string() });
const REVIEW_LABELS = {
  covered: 'What you covered',
  couldAdd: 'What you could add',
  possibleAnswer: 'One possible answer',
};

/** Check the request and turn it into what the prompts need. A string result is the reason it was rejected. */
async function readContext(req: Request): Promise<PromptContext | string> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return 'The request was not valid JSON.';
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return 'The request was not in the expected shape.';
  const { questionId, persona, difficulty, messages } = parsed.data;

  const question = findQuestion(questionId);
  if (!question) return 'Unknown question.';

  // The thread must alternate skeptic, me, skeptic, ... starting with the skeptic.
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].from !== (i % 2 === 0 ? 'skeptic' : 'me')) return 'The conversation is out of order.';
    if (messages[i].from === 'me' && messages[i].text.length > MAX_REPLY_CHARS) return 'A reply is too long.';
  }
  const userReplies = messages.filter((m) => m.from === 'me').length;
  if (userReplies > TOTAL_TURNS) return 'The conversation is already over.';

  return {
    question,
    persona: persona as PromptContext['persona'],
    difficulty: difficulty as PromptContext['difficulty'],
    messages: messages.map((m, i): Message => ({ id: String(i), from: m.from, text: m.text })),
    userReplies,
  };
}

async function skeptic(req: Request, deps: Deps, ai: AiClient): Promise<Response> {
  const ctx = await readContext(req);
  if (typeof ctx === 'string') return fail(400, 'bad_request', ctx);

  // The skeptic speaks when the thread is empty (the opening) or the practicer spoke last.
  const last = ctx.messages[ctx.messages.length - 1];
  if (last && last.from !== 'me') return fail(400, 'bad_request', 'It is not the skeptic’s turn.');

  // A new conversation counts against the daily caps. Replies inside one never do.
  if (ctx.messages.length === 0) {
    const day = utcDay(deps.now());
    const mine = await deps.usage.increment(`${day}:c:${await clientKey(deps.ip)}`);
    if (mine > deps.limits.perClient) {
      return fail(429, 'limit', 'You have reached today’s limit for live conversations. Come back tomorrow.');
    }
    const all = await deps.usage.increment(`${day}:all`);
    if (all > deps.limits.global) {
      return fail(429, 'limit', 'Live practice is at capacity for today. Come back tomorrow.');
    }
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let sent = false;
      try {
        const { refused } = await ai.streamText(
          { system: skepticSystem(ctx), turns: skepticTurns(ctx), effort: 'low', maxTokens: 4000, signal: req.signal },
          (delta) => {
            sent = true;
            controller.enqueue(encoder.encode(delta));
          },
        );
        // If the model declined and said nothing, give the practicer something to respond to.
        if (refused && !sent)
          controller.enqueue(encoder.encode('I am not sure how to respond to that. Could you say it another way?'));
        controller.close();
      } catch (err) {
        // Headers are already sent, so the only way to signal failure is to break the stream.
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-accel-buffering': 'no' },
  });
}

async function coach(req: Request, ai: AiClient): Promise<Response> {
  const ctx = await readContext(req);
  if (typeof ctx === 'string') return fail(400, 'bad_request', ctx);
  if (!ctx.messages.length) return fail(400, 'bad_request', 'The conversation has not started.');
  const out = await ai.json(
    { system: coachSystem(ctx), turns: coachTurns(ctx), effort: 'low', maxTokens: 8000, signal: req.signal },
    CoachOut,
  );
  if (!out) return fail(503, 'unavailable', 'Coach could not help with that. Try again after your next reply.');
  return json(out);
}

async function review(req: Request, ai: AiClient): Promise<Response> {
  const ctx = await readContext(req);
  if (typeof ctx === 'string') return fail(400, 'bad_request', ctx);
  if (ctx.userReplies < 1) return fail(400, 'bad_request', 'There is nothing to review yet.');
  const out = await ai.json(
    {
      system: reviewSystem(ctx),
      turns: reviewTurns(ctx),
      effort: 'low',
      // A short review is faster, and Netlify stops a function at about 10 seconds.
      maxTokens: 1200,
      deadlineMs: 8500,
      labels: REVIEW_LABELS,
      signal: req.signal,
    },
    ReviewOut,
  );
  if (!out) return fail(503, 'unavailable', 'The review could not be written. Try again.');
  return json(out);
}

/** The whole API. Framework-free: takes a web Request, returns a web Response. */
export async function handle(req: Request, deps: Deps): Promise<Response> {
  const path = new URL(req.url).pathname.replace(/\/+$/, '');

  if (path === '/api/status' && req.method === 'GET') return json({ live: deps.ai !== null });

  const routes: Record<string, (ai: AiClient) => Promise<Response>> = {
    '/api/skeptic': (ai) => skeptic(req, deps, ai),
    '/api/coach': (ai) => coach(req, ai),
    '/api/review': (ai) => review(req, ai),
  };
  const route = routes[path];
  if (!route) return fail(404, 'bad_request', 'Not found.');
  if (req.method !== 'POST') return fail(405, 'bad_request', 'Use POST.');
  if (!deps.ai) return fail(503, 'unavailable', 'Live AI is not switched on.');

  try {
    return await route(deps.ai);
  } catch (err) {
    if (err instanceof AiUnavailable) return fail(503, 'unavailable', err.message);
    console.error('[api]', err);
    return fail(500, 'unavailable', 'Something went wrong on our side.');
  }
}
