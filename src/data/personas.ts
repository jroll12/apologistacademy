import type { Difficulty, PersonaId } from '../conversation/types';

export interface Persona {
  id: PersonaId;
  label: string;
  blurb: string;
  /** Instruction given to the live skeptic. Not shown in the app. */
  prompt: string;
}

export const PERSONAS: Persona[] = [
  {
    id: 'curious',
    label: 'Curious',
    blurb: 'Asks honest questions and wants to understand.',
    prompt:
      'Open-minded and sincerely curious. You are not trying to win. You ask honest follow-up questions and say so when something makes sense to you.',
  },
  {
    id: 'hurting',
    label: 'Hurting',
    blurb: 'Asks from a place of personal pain.',
    prompt:
      'The question is personal for your character. Something painful sits behind it. Abstract arguments leave you cold, and you notice whether the other person listens before they explain.',
  },
  {
    id: 'analytical',
    label: 'Analytical',
    blurb: 'Wants evidence and clear reasoning.',
    prompt:
      'Careful and evidence-minded. You ask what a claim rests on, point out gaps in reasoning, and are not moved by feelings or by appeals to authority.',
  },
  {
    id: 'blunt',
    label: 'Blunt',
    blurb: 'Direct and unconvinced. Pushes hard, stays civil.',
    prompt:
      'Direct and unconvinced. You say plainly when an answer sounds like a dodge. You push hard on the argument and stay civil toward the person.',
  },
];

export interface DifficultyOption {
  id: Difficulty;
  label: string;
  blurb: string;
  prompt: string;
}

export const DIFFICULTIES: DifficultyOption[] = [
  {
    id: 'gentle',
    label: 'Gentle',
    blurb: 'Gives you room.',
    prompt: 'Go easy. Accept fair points readily and keep follow-ups simple.',
  },
  {
    id: 'standard',
    label: 'Standard',
    blurb: 'A realistic conversation.',
    prompt: 'Push back the way a thoughtful person would in a real conversation.',
  },
  {
    id: 'tough',
    label: 'Tough',
    blurb: 'Presses on weak spots.',
    prompt: 'Press on the weakest part of each reply. Do not let a vague answer pass without asking what it means.',
  },
];

export const DEFAULT_PERSONA: PersonaId = 'curious';
export const DEFAULT_DIFFICULTY: Difficulty = 'standard';

export function findPersona(id: string): Persona | undefined {
  return PERSONAS.find((p) => p.id === id);
}

export function findDifficulty(id: string): DifficultyOption | undefined {
  return DIFFICULTIES.find((d) => d.id === id);
}
