import type { CoachContent, CoachStep, Message, Review, Topic } from './types';
import { TOTAL_TURNS } from './types';

export type View = 'home' | 'browse' | 'conversation' | 'feedback';
export type SheetName = null | 'coach' | 'how';

export interface State {
  view: View;
  /** Where Back returns to from a conversation. */
  from: 'home' | 'browse';
  sheet: SheetName;
  questionId: string | null;
  /** Bumps on every start/leave so late provider responses for an old conversation are dropped. */
  convoId: number;
  messages: Message[];
  /** Replies the user has sent (0..5). */
  userReplies: number;
  /** Waiting on the skeptic. The composer is paused. */
  pending: boolean;
  /** Daily limit reached when this conversation was requested. */
  limited: boolean;
  coachStep: CoachStep;
  coach: CoachContent | null;
  review: Review | null;
  filter: 'All' | Topic;
}

export const initialState: State = {
  view: 'home',
  from: 'home',
  sheet: null,
  questionId: null,
  convoId: 0,
  messages: [],
  userReplies: 0,
  pending: false,
  limited: false,
  coachStep: 1,
  coach: null,
  review: null,
  filter: 'All',
};

export type Action =
  | { type: 'GO'; view: 'home' | 'browse' }
  | { type: 'START'; questionId: string; limited: boolean }
  | { type: 'SEND'; text: string }
  | { type: 'SKEPTIC'; convoId: number; text: string }
  | { type: 'SHEET'; sheet: SheetName }
  | { type: 'COACH_STEP' }
  | { type: 'COACH_LOADED'; convoId: number; coach: CoachContent }
  | { type: 'REVIEW_LOADED'; convoId: number; review: Review }
  | { type: 'FILTER'; filter: 'All' | Topic }
  | { type: 'BACK' };

/** "Turn N of 5": the reply the user is on (or just sent). Caps at 5. */
export function turnOf(s: Pick<State, 'userReplies' | 'view' | 'limited'>): number {
  if (s.limited) return 0;
  if (s.view === 'feedback') return TOTAL_TURNS;
  return Math.min(s.userReplies + 1, TOTAL_TURNS);
}

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'GO':
      return { ...s, view: a.view, sheet: null };

    case 'START':
      return {
        ...initialState,
        filter: s.filter,
        view: 'conversation',
        from: s.view === 'browse' ? 'browse' : 'home',
        questionId: a.questionId,
        convoId: s.convoId + 1,
        limited: a.limited,
        // The skeptic's opening is on its way, so the composer starts paused.
        pending: !a.limited,
      };

    case 'SEND': {
      const text = a.text.trim();
      if (s.view !== 'conversation' || s.pending || s.limited || s.userReplies >= TOTAL_TURNS || !text) return s;
      const msg: Message = { id: `${s.convoId}-${s.messages.length}`, from: 'me', text };
      return { ...s, messages: [...s.messages, msg], userReplies: s.userReplies + 1, pending: true };
    }

    case 'SKEPTIC': {
      if (a.convoId !== s.convoId || !s.pending || s.view !== 'conversation') return s;
      const msg: Message = { id: `${s.convoId}-${s.messages.length}`, from: 'skeptic', text: a.text };
      const ended = s.userReplies >= TOTAL_TURNS;
      return { ...s, messages: [...s.messages, msg], pending: false, view: ended ? 'feedback' : s.view, sheet: ended ? null : s.sheet };
    }

    case 'SHEET':
      return { ...s, sheet: a.sheet };

    case 'COACH_STEP':
      return { ...s, coachStep: Math.min(s.coachStep + 1, 3) as CoachStep };

    case 'COACH_LOADED':
      return a.convoId === s.convoId ? { ...s, coach: a.coach } : s;

    case 'REVIEW_LOADED':
      return a.convoId === s.convoId ? { ...s, review: a.review } : s;

    case 'FILTER':
      return { ...s, filter: a.filter };

    case 'BACK':
      if (s.view === 'conversation') return { ...s, view: s.from, sheet: null, pending: false, convoId: s.convoId + 1 };
      if (s.view === 'feedback') return { ...s, view: 'home', sheet: null, convoId: s.convoId + 1 };
      return { ...s, view: 'home', sheet: null };
  }
}
