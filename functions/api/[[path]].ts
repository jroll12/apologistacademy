// Cloudflare Pages Function: every /api/* request goes to the same framework-free handler
// the Netlify function uses (server/handler.ts).
import { createDeps } from '../../server/deps';
import { handle } from '../../server/handler';
import { kvUsage, type KvLike } from '../../server/kvUsage';

interface Env {
  /** Optional KV namespace binding for the daily counters. Without it, counts are kept in memory. */
  USAGE?: KvLike;
  [name: string]: unknown;
}

interface PagesContext {
  request: Request;
  env: Env;
}

/** Cloudflare has no 10-second function limit, so the review may wait longer for the model. */
const REVIEW_DEADLINE_MS = 25_000;

export const onRequest = async ({ request, env }: PagesContext): Promise<Response> => {
  const strings = Object.fromEntries(
    Object.entries(env).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  return handle(request, createDeps(strings, kvUsage(env.USAGE), ip, { reviewDeadlineMs: REVIEW_DEADLINE_MS }));
};
