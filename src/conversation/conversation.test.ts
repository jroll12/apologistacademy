import { describe, expect, it } from 'vitest';
import { canReply, createConversation, reduce, turnOf, type Action } from './conversation';
import type { Conversation } from './types';
import { MAX_REPLY_CHARS } from './types';

const fresh = () =>
  createConversation({
    id: 'c1',
    questionId: 'suffering',
    persona: 'curious',
    difficulty: 'standard',
    mode: 'canned',
    now: 1,
  });
const run = (c: Conversation, ...actions: Action[]) => actions.reduce(reduce, c);
const skeptic = (text = 'Skeptic line'): Action => ({ type: 'SKEPTIC', text, now: 2 });
const send = (text = 'My reply'): Action => ({ type: 'SEND', text, now: 3 });

describe('conversation reducer', () => {
  it('starts paused until the skeptic opens', () => {
    const c = fresh();
    expect(c.awaiting).toBe(true);
    expect(canReply(c)).toBe(false);
    expect(run(c, send()).messages).toHaveLength(0);

    const opened = run(c, skeptic('Opening'));
    expect(opened.awaiting).toBe(false);
    expect(canReply(opened)).toBe(true);
    expect(turnOf(opened)).toBe(1);
  });

  it('pauses while the skeptic replies and advances the turn', () => {
    const c = run(fresh(), skeptic(), send());
    expect(c.awaiting).toBe(true);
    expect(turnOf(c)).toBe(2);
    expect(run(c, send('again')).userReplies).toBe(1);
  });

  it('ends after the fifth reply and its closing line', () => {
    let c = run(fresh(), skeptic());
    for (let i = 1; i <= 5; i++) {
      expect(c.status).toBe('active');
      c = run(c, send(`reply ${i}`), skeptic(`skeptic ${i}`));
    }
    expect(c.status).toBe('ended');
    expect(c.endedAt).toBe(2);
    expect(c.userReplies).toBe(5);
    expect(turnOf(c)).toBe(5);
    expect(c.messages).toHaveLength(11);
    expect(run(c, send('late')).messages).toHaveLength(11);
    expect(run(c, skeptic('late')).messages).toHaveLength(11);
  });

  it('gives every message a unique id', () => {
    const c = run(fresh(), skeptic(), send(), skeptic(), send());
    expect(new Set(c.messages.map((m) => m.id)).size).toBe(c.messages.length);
  });

  it('ignores empty replies and trims long ones', () => {
    const c = run(fresh(), skeptic());
    expect(run(c, send('   ')).userReplies).toBe(0);
    const long = run(c, send('x'.repeat(MAX_REPLY_CHARS + 50)));
    expect(long.messages[1].text).toHaveLength(MAX_REPLY_CHARS);
  });

  it('keeps a failed reply owed, and clears the error on retry', () => {
    const failed = run(fresh(), skeptic(), send(), { type: 'FAIL', message: 'No connection' });
    expect(failed.error).toBe('No connection');
    expect(failed.awaiting).toBe(true);
    const retried = run(failed, { type: 'RETRY' });
    expect(retried.error).toBeNull();
    expect(retried.awaiting).toBe(true);
    expect(run(retried, skeptic('Made it')).messages.at(-1)?.text).toBe('Made it');
  });

  it('does not record a failure when nothing was owed', () => {
    const c = run(fresh(), skeptic());
    expect(run(c, { type: 'FAIL', message: 'x' }).error).toBeNull();
  });

  it('reveals Coach one step at a time and stops at three', () => {
    const c = run(fresh(), { type: 'COACH_STEP' }, { type: 'COACH_STEP' }, { type: 'COACH_STEP' });
    expect(c.coachStep).toBe(3);
  });

  it('resets Coach when the person sends a reply', () => {
    const coach = { nudge: 'n', outline: 'o', sample: 's' };
    const helped = run(fresh(), skeptic(), { type: 'COACH_LOADED', coach, forReplies: 0 }, { type: 'COACH_STEP' });
    expect(helped.coach).toEqual(coach);
    const next = run(helped, send());
    expect(next.coach).toBeNull();
    expect(next.coachStep).toBe(1);
  });

  it('drops Coach help that arrives for a reply already sent', () => {
    const coach = { nudge: 'n', outline: 'o', sample: 's' };
    const c = run(fresh(), skeptic(), send(), skeptic());
    expect(run(c, { type: 'COACH_LOADED', coach, forReplies: 0 }).coach).toBeNull();
    expect(run(c, { type: 'COACH_LOADED', coach, forReplies: 1 }).coach).toEqual(coach);
  });

  it('accepts a review only once the conversation has ended', () => {
    const review = { personalized: false, covered: null, couldAdd: 'a', possibleAnswer: 'b' };
    expect(run(fresh(), { type: 'REVIEW_LOADED', review }).review).toBeNull();
  });
});
