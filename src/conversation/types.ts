export const TOTAL_TURNS = 5;

export type Topic = 'Suffering' | 'The Bible' | 'Jesus' | 'Science';

export interface Question {
  id: string;
  text: string;
  topic: Topic;
}

export type Message =
  | { id: string; from: 'skeptic'; text: string }
  | { id: string; from: 'me'; text: string };

export type CoachStep = 1 | 2 | 3;

export interface CoachContent {
  nudge: string;
  outline: string;
  sample: string;
}

export interface Source {
  title: string;
  href: string;
}

export interface Review {
  covered: string;
  couldAdd: string;
  possibleAnswer: string;
  sources: Source[];
}
