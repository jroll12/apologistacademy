import { describe, expect, it } from 'vitest';
import { initialState, reducer, turnOf, type Action, type State } from './state';
import { filterQuestions } from '../data/questions';
import { DAILY_LIMIT, canStart, dayKey, formatReset, nextReset, recordStart, used, type StorageLike } from './dailyLimit';

const run = (s: State, ...as: Action[]) => as.reduce(reducer, s);
const memStore = (): StorageLike => {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v) };
};

describe('conversation reducer', () => {
  const started = () => run(initialState, { type: 'START', questionId: 'suffering', limited: false });

  it('starts paused until the skeptic opening arrives', () => {
    const s = started();
    expect(s.view).toBe('conversation');
    expect(s.pending).toBe(true);
    expect(run(s, { type: 'SEND', text: 'hi' }).messages).toHaveLength(0);
    const open = run(s, { type: 'SKEPTIC', convoId: s.convoId, text: 'Opening' });
    expect(open.pending).toBe(false);
    expect(turnOf(open)).toBe(1);
  });

  it('pauses the composer while the skeptic replies and advances the turn', () => {
    let s = started();
    s = run(s, { type: 'SKEPTIC', convoId: s.convoId, text: 'Opening' }, { type: 'SEND', text: 'one' });
    expect(s.pending).toBe(true);
    expect(turnOf(s)).toBe(2);
    expect(run(s, { type: 'SEND', text: 'again' }).userReplies).toBe(1);
  });

  it('ends after the 5th reply and moves to feedback', () => {
    let s = started();
    s = run(s, { type: 'SKEPTIC', convoId: s.convoId, text: 'Opening' });
    for (let i = 1; i <= 5; i++) {
      s = run(s, { type: 'SEND', text: `reply ${i}` }, { type: 'SKEPTIC', convoId: s.convoId, text: `skeptic ${i}` });
    }
    expect(s.view).toBe('feedback');
    expect(s.userReplies).toBe(5);
    expect(turnOf(s)).toBe(5);
    expect(run(s, { type: 'SEND', text: 'late' }).userReplies).toBe(5);
  });

  it('drops late skeptic replies from a conversation the user left', () => {
    const s = started();
    const old = s.convoId;
    const left = run(s, { type: 'BACK' });
    expect(left.view).toBe('home');
    expect(run(left, { type: 'SKEPTIC', convoId: old, text: 'late' }).messages).toHaveLength(0);
  });

  it('ignores empty replies', () => {
    let s = started();
    s = run(s, { type: 'SKEPTIC', convoId: s.convoId, text: 'Opening' });
    expect(run(s, { type: 'SEND', text: '   ' }).userReplies).toBe(0);
  });

  it('limited start is not pending and has turn 0', () => {
    const s = run(initialState, { type: 'START', questionId: 'suffering', limited: true });
    expect(s.pending).toBe(false);
    expect(turnOf(s)).toBe(0);
    expect(run(s, { type: 'SEND', text: 'x' }).userReplies).toBe(0);
  });

  it('coach reveals one step at a time and stops at 3', () => {
    const s = run(started(), { type: 'COACH_STEP' }, { type: 'COACH_STEP' }, { type: 'COACH_STEP' });
    expect(s.coachStep).toBe(3);
  });

  it('Back returns to where the conversation was opened from', () => {
    const s = run(initialState, { type: 'GO', view: 'browse' }, { type: 'START', questionId: 'bible', limited: false });
    expect(run(s, { type: 'BACK' }).view).toBe('browse');
  });
});

describe('browse filter', () => {
  it('filters by topic', () => {
    expect(filterQuestions('All')).toHaveLength(5);
    expect(filterQuestions('Jesus').map((q) => q.id)).toEqual(['resurrection', 'only-way']);
    expect(filterQuestions('Science')).toHaveLength(1);
  });
});

describe('daily limit', () => {
  const noon = new Date(2026, 10, 5, 12, 0);
  it('blocks new conversations once the limit is hit', () => {
    const st = memStore();
    for (let i = 0; i < DAILY_LIMIT; i++) {
      expect(canStart(st, noon)).toBe(true);
      recordStart(st, noon);
    }
    expect(used(st, noon)).toBe(DAILY_LIMIT);
    expect(canStart(st, noon)).toBe(false);
  });
  it('does not affect a conversation already started (state ignores the counter)', () => {
    const s = run(initialState, { type: 'START', questionId: 'suffering', limited: false });
    expect(s.limited).toBe(false);
  });
  it('resets on the next local day', () => {
    const st = memStore();
    for (let i = 0; i < DAILY_LIMIT; i++) recordStart(st, noon);
    const tomorrow = new Date(2026, 10, 6, 0, 1);
    expect(dayKey(tomorrow)).not.toBe(dayKey(noon));
    expect(canStart(st, tomorrow)).toBe(true);
  });
  it('computes the next local midnight', () => {
    const r = nextReset(noon);
    expect([r.getDate(), r.getHours(), r.getMinutes()]).toEqual([6, 0, 0]);
    expect(formatReset(noon)).toMatch(/12:00/);
  });
  it('survives corrupt storage', () => {
    const st = memStore();
    st.setItem('ap.practice.daily', '{nope');
    expect(canStart(st, noon)).toBe(true);
  });
});
