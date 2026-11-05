import { SCRIPTS } from '../data/scripts';
import { initialState, type State } from './state';
import type { Message } from './types';

/**
 * Dev-only: `?screen=<name>` loads the exact states shown on the design board, so the app can be
 * compared with it screen by screen. Stripped from production builds.
 */
const sk = (i: number, text: string): Message => ({ id: `f${i}`, from: 'skeptic', text });
const me = (i: number, text: string): Message => ({ id: `f${i}`, from: 'me', text });

const S1 = sk(0, 'If God is good and strong, why is there so much pain?');
const M1 = me(1, 'Love needs a real choice. Free will makes pain possible.');
const S2 = sk(2, 'That does not explain a child who gets sick.');
const M2 = me(3, 'Pain is real. I do not have every answer, but I can tell you what helps me.');

const convo: State = { ...initialState, view: 'conversation', questionId: 'suffering', convoId: 1, userReplies: 2 };

export const FIXTURES: Record<string, State> = {
  home: initialState,
  browse: { ...initialState, view: 'browse' },
  turn3: { ...convo, messages: [S1, M1, S2] },
  coach: { ...convo, messages: [S2], sheet: 'coach', coach: SCRIPTS.suffering.coach },
  replying: { ...convo, messages: [S2, M2], pending: true },
  limit: { ...convo, userReplies: 0, limited: true },
  how: { ...convo, messages: [], sheet: 'how' },
  feedback: {
    ...initialState,
    view: 'feedback',
    questionId: 'suffering',
    convoId: 1,
    userReplies: 5,
    messages: [sk(9, 'I need to think about that. Thanks for the talk.')],
    review: SCRIPTS.suffering.review,
  },
};

export function fixtureFromUrl(): State | null {
  const name = new URLSearchParams(window.location.search).get('screen');
  return name && FIXTURES[name] ? FIXTURES[name] : null;
}
