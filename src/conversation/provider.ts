import type { CoachContent, Conversation, Difficulty, Message, PersonaId, ProviderMode, Review } from './types';

/** Everything a provider needs to know about the conversation it is answering for. */
export interface ProviderContext {
  questionId: string;
  persona: PersonaId;
  difficulty: Difficulty;
  messages: Message[];
  /** Replies the person has sent so far (0..5). */
  userReplies: number;
}

export interface CallOptions {
  /** Aborts the call (leaving the screen, or a timeout). */
  signal?: AbortSignal;
  /** Called with the text so far as it streams in. */
  onText?: (soFar: string) => void;
}

/**
 * The seam between the app and whoever plays the skeptic and Coach.
 * `cannedProvider` reads scripts. `liveProvider` calls the server, which calls Claude.
 */
export interface ConversationProvider {
  mode: ProviderMode;
  /** The skeptic's first message. */
  opening(ctx: ProviderContext, opts?: CallOptions): Promise<string>;
  /** The skeptic's reply to the person's latest reply. After reply 5 this is the closing line. */
  reply(ctx: ProviderContext, opts?: CallOptions): Promise<string>;
  /** Coach help: a nudge, then an outline, then a sample reply. */
  coach(ctx: ProviderContext, opts?: CallOptions): Promise<CoachContent>;
  /** The review shown after turn 5. No scores. */
  review(ctx: ProviderContext, opts?: CallOptions): Promise<Review>;
}

/** An error whose message is safe and useful to show to the person. */
export class ProviderError extends Error {
  constructor(
    message: string,
    public code: 'limit' | 'offline' | 'timeout' | 'unavailable' | 'bad_request' = 'unavailable',
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export function contextOf(c: Conversation): ProviderContext {
  return {
    questionId: c.questionId,
    persona: c.persona,
    difficulty: c.difficulty,
    messages: c.messages,
    userReplies: c.userReplies,
  };
}

/** A message for the person, whatever went wrong. */
export function describeError(err: unknown): string {
  if (err instanceof ProviderError) return err.message;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'You appear to be offline.';
  return 'Something went wrong on our side.';
}
