import type {
  CoachContent,
  CoachStep,
  Conversation,
  Difficulty,
  Message,
  PersonaId,
  ProviderMode,
  Review,
} from './types';
import { MAX_REPLY_CHARS, TOTAL_TURNS } from './types';

export interface NewConversation {
  id: string;
  questionId: string;
  persona: PersonaId;
  difficulty: Difficulty;
  mode: ProviderMode;
  now: number;
}

export function createConversation(n: NewConversation): Conversation {
  return {
    id: n.id,
    questionId: n.questionId,
    persona: n.persona,
    difficulty: n.difficulty,
    mode: n.mode,
    messages: [],
    userReplies: 0,
    status: 'active',
    // The skeptic's opening is on its way, so the composer starts paused.
    awaiting: true,
    error: null,
    coachStep: 1,
    coach: null,
    review: null,
    counted: false,
    startedAt: n.now,
    updatedAt: n.now,
    endedAt: null,
  };
}

export type Action =
  | { type: 'SEND'; text: string; now: number }
  | { type: 'SKEPTIC'; text: string; now: number }
  | { type: 'FAIL'; message: string }
  | { type: 'RETRY' }
  | { type: 'COUNTED' }
  | { type: 'COACH_LOADED'; coach: CoachContent; forReplies: number }
  | { type: 'COACH_STEP' }
  | { type: 'REVIEW_LOADED'; review: Review };

/** "Turn N of 5": the reply the person is on, or has just sent. Caps at 5. */
export function turnOf(c: Pick<Conversation, 'userReplies' | 'status'>): number {
  if (c.status === 'ended') return TOTAL_TURNS;
  return Math.min(c.userReplies + 1, TOTAL_TURNS);
}

/** Can the person type a reply right now? */
export function canReply(c: Conversation): boolean {
  return c.status === 'active' && !c.awaiting && c.userReplies < TOTAL_TURNS;
}

const nextId = (c: Conversation) => `${c.id}-${c.messages.length}`;

export function reduce(c: Conversation, a: Action): Conversation {
  switch (a.type) {
    case 'SEND': {
      const text = a.text.trim().slice(0, MAX_REPLY_CHARS);
      if (!canReply(c) || !text) return c;
      const msg: Message = { id: nextId(c), from: 'me', text };
      return {
        ...c,
        messages: [...c.messages, msg],
        userReplies: c.userReplies + 1,
        awaiting: true,
        error: null,
        // Coach help was for the message just answered. The next one starts fresh.
        coach: null,
        coachStep: 1,
        updatedAt: a.now,
      };
    }

    case 'SKEPTIC': {
      if (c.status !== 'active' || !c.awaiting) return c;
      const msg: Message = { id: nextId(c), from: 'skeptic', text: a.text.trim() };
      const ended = c.userReplies >= TOTAL_TURNS;
      return {
        ...c,
        messages: [...c.messages, msg],
        awaiting: false,
        error: null,
        status: ended ? 'ended' : 'active',
        endedAt: ended ? a.now : null,
        updatedAt: a.now,
      };
    }

    case 'FAIL':
      // Still awaiting: the reply is owed. The thread shows the error with a way to try again.
      return c.awaiting ? { ...c, error: a.message } : c;

    case 'RETRY':
      return c.error ? { ...c, error: null } : c;

    case 'COUNTED':
      return c.counted ? c : { ...c, counted: true };

    case 'COACH_LOADED':
      // Drop help that arrives after the person has already moved on to the next reply.
      return a.forReplies === c.userReplies ? { ...c, coach: a.coach } : c;

    case 'COACH_STEP':
      return { ...c, coachStep: Math.min(c.coachStep + 1, 3) as CoachStep };

    case 'REVIEW_LOADED':
      return c.status === 'ended' ? { ...c, review: a.review } : c;
  }
}
