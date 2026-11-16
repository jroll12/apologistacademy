export const TOTAL_TURNS = 5;
/** Longest reply a person can send. Enforced in the composer and again on the server. */
export const MAX_REPLY_CHARS = 600;

export type TopicId = 'suffering' | 'bible' | 'jesus' | 'science' | 'god' | 'morality' | 'faiths' | 'church';

export interface Topic {
  id: TopicId;
  label: string;
}

export interface Verse {
  ref: string;
  text: string;
  /** Berean Standard Bible. Every quotation is checked against the source text. */
  translation: 'BSB';
}

export interface Source {
  title: string;
  publisher: string;
  href: string;
}

export interface Question {
  id: string;
  text: string;
  topic: TopicId;
  verse: Verse;
  /** Curated by the team. The app never shows a source that is not in this list. */
  sources: Source[];
}

export interface Message {
  id: string;
  from: 'skeptic' | 'me';
  text: string;
}

export type CoachStep = 1 | 2 | 3;

export interface CoachContent {
  nudge: string;
  outline: string;
  sample: string;
}

export interface Review {
  /** True when the review responds to what the person actually said (live AI only). */
  personalized: boolean;
  /** Only present on a personalized review. A scripted review cannot know this. */
  covered: string | null;
  couldAdd: string;
  possibleAnswer: string;
}

export type PersonaId = 'curious' | 'hurting' | 'analytical' | 'blunt';
export type Difficulty = 'gentle' | 'standard' | 'tough';
export type ProviderMode = 'canned' | 'live';

export interface Conversation {
  id: string;
  questionId: string;
  persona: PersonaId;
  difficulty: Difficulty;
  mode: ProviderMode;
  messages: Message[];
  /** Replies the person has sent (0..5). */
  userReplies: number;
  status: 'active' | 'ended';
  /** Waiting on the skeptic. The composer is paused. */
  awaiting: boolean;
  /** Why the last skeptic reply failed, if it did. Cleared on retry. */
  error: string | null;
  coachStep: CoachStep;
  coach: CoachContent | null;
  review: Review | null;
  /** Whether this conversation has been counted against the daily limit. */
  counted: boolean;
  startedAt: number;
  updatedAt: number;
  endedAt: number | null;
}
