import type { ConversationProvider, ProviderContext } from './provider';
import type { Review } from './types';

/** Longest the early request may run, so a stuck one never lingers. */
const PREFETCH_TIMEOUT_MS = 30_000;

const pending = new Map<string, Promise<void>>();

/**
 * Starts the review as soon as the fifth reply is sent, while the skeptic writes its closing line,
 * so it is usually ready by the time the person reaches the review page. On success `onLoaded`
 * stores it. A failed early try is simply forgotten: the review page makes a fresh request.
 * Runs on its own (not tied to a screen), so leaving the conversation screen does not cancel it.
 */
export function prefetchReview(
  id: string,
  provider: ConversationProvider,
  ctx: ProviderContext,
  onLoaded: (review: Review) => void,
): void {
  if (pending.has(id)) return;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PREFETCH_TIMEOUT_MS);
  const work = provider
    .review(ctx, { signal: ctrl.signal })
    .then(onLoaded)
    .finally(() => {
      clearTimeout(timer);
      pending.delete(id);
    });
  // The review page decides what a failure means; nothing here should surface as an unhandled error.
  pending.set(
    id,
    work.catch(() => {}),
  );
}

/** The early request for this conversation, if one is still running. Resolves when it has finished, either way. */
export function pendingReview(id: string): Promise<void> | undefined {
  return pending.get(id);
}
