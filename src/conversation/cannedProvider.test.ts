import { describe, expect, it } from 'vitest';
import { CLOSING, SCRIPTS } from '../data/scripts';
import { createCannedProvider, INSTANT_TIMING } from './cannedProvider';
import type { ProviderContext } from './provider';
import { ProviderError } from './provider';

const ctx = (userReplies: number, questionId = 'suffering'): ProviderContext => ({
  questionId,
  persona: 'curious',
  difficulty: 'standard',
  messages: [],
  userReplies,
});

describe('canned provider', () => {
  const provider = createCannedProvider(INSTANT_TIMING);

  it('opens with the scripted opening', async () => {
    expect(await provider.opening(ctx(0))).toBe(SCRIPTS.suffering.opening);
  });

  it('answers replies one to four in order, then closes after the fifth', async () => {
    for (let n = 1; n <= 4; n++) expect(await provider.reply(ctx(n))).toBe(SCRIPTS.suffering.replies[n - 1]);
    expect(await provider.reply(ctx(5))).toBe(CLOSING);
  });

  it('gives a review that does not claim to know what the person said', async () => {
    const review = await provider.review(ctx(5));
    expect(review.personalized).toBe(false);
    expect(review.covered).toBeNull();
    expect(review.couldAdd).toBe(SCRIPTS.suffering.review.couldAdd);
  });

  it('returns Coach help for the question', async () => {
    expect(await provider.coach(ctx(1))).toEqual(SCRIPTS.suffering.coach);
  });

  it('rejects an unknown question with a readable error', async () => {
    await expect(provider.opening(ctx(0, 'nope'))).rejects.toBeInstanceOf(ProviderError);
  });

  it('reveals the line word by word when asked to', async () => {
    const streaming = createCannedProvider({ openingMs: 0, replyMs: 0, wordMs: 1 });
    const seen: string[] = [];
    const full = await streaming.opening(ctx(0), { onText: (t) => seen.push(t) });
    expect(seen.at(-1)).toBe(full);
    expect(seen.length).toBe(full.split(' ').length);
    expect(seen[0]).toBe(full.split(' ')[0]);
  });

  it('stops when aborted', async () => {
    const slow = createCannedProvider({ openingMs: 5000, replyMs: 5000, wordMs: 0 });
    const ctrl = new AbortController();
    const pending = slow.opening(ctx(0), { signal: ctrl.signal });
    ctrl.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });
});
