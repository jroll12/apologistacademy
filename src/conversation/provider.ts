import type { CoachContent, Message, Question, Review } from './types';

/**
 * The seam for real AI. The prototype uses cannedProvider. A live provider would call a
 * small server route that holds the API key (a key must never ship in the browser bundle).
 */
export interface ConversationProvider {
  /** Skeptic's first message. */
  opening(q: Question): Promise<string>;
  /** Skeptic's reply after the user's `userReplies`-th reply (1..5). Reply 5 gets the closing line. */
  reply(q: Question, history: Message[], userReplies: number): Promise<string>;
  /** Coach help for the current thread: nudge, then outline, then sample reply. */
  coach(q: Question, history: Message[]): Promise<CoachContent>;
  /** Coach review shown after turn 5. No scores. */
  review(q: Question, history: Message[]): Promise<Review>;
}
