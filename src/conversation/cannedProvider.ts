import { CLOSING, SCRIPTS } from '../data/scripts';
import type { CallOptions, ConversationProvider, ProviderContext } from './provider';
import { ProviderError } from './provider';
import { TOTAL_TURNS } from './types';

export interface CannedTiming {
  /** Pause before the skeptic starts "typing" the opening. */
  openingMs: number;
  /** Pause before each reply. */
  replyMs: number;
  /** Delay between words as the reply appears. */
  wordMs: number;
}

export const DEFAULT_TIMING: CannedTiming = { openingMs: 500, replyMs: 1100, wordMs: 28 };
export const INSTANT_TIMING: CannedTiming = { openingMs: 0, replyMs: 0, wordMs: 0 };

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(t);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

/** Reveal a scripted line word by word, so scripted and live replies feel the same. */
async function speak(text: string, pauseMs: number, timing: CannedTiming, opts?: CallOptions): Promise<string> {
  await wait(pauseMs, opts?.signal);
  if (opts?.onText && timing.wordMs > 0) {
    const words = text.split(' ');
    for (let i = 1; i <= words.length; i++) {
      opts.onText(words.slice(0, i).join(' '));
      await wait(timing.wordMs, opts.signal);
    }
  }
  return text;
}

function scriptFor(ctx: ProviderContext) {
  const script = SCRIPTS[ctx.questionId];
  if (!script) throw new ProviderError('This question has no script yet.', 'bad_request');
  return script;
}

/** Scripted skeptic and Coach. Used whenever live AI is off. */
export function createCannedProvider(timing: CannedTiming = DEFAULT_TIMING): ConversationProvider {
  return {
    mode: 'canned',
    // async, so a missing script rejects the promise instead of throwing at the caller.
    async opening(ctx, opts) {
      return speak(scriptFor(ctx).opening, timing.openingMs, timing, opts);
    },
    async reply(ctx, opts) {
      const script = scriptFor(ctx);
      const line = ctx.userReplies >= TOTAL_TURNS ? CLOSING : script.replies[ctx.userReplies - 1];
      return speak(line, timing.replyMs, timing, opts);
    },
    async coach(ctx) {
      return scriptFor(ctx).coach;
    },
    async review(ctx) {
      const { couldAdd, possibleAnswer } = scriptFor(ctx).review;
      // A script cannot know what the person said, so it never claims to.
      return { personalized: false, covered: null, couldAdd, possibleAnswer };
    },
  };
}
