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
    id: 'hostile',
    label: 'Hostile',
    blurb: 'Openly against it. Pushes hard, stays civil.',
    prompt:
      'Openly hostile to the argument and unconvinced. You say plainly when an answer sounds like a dodge, and you push hard on the reasoning. You never insult or demean the person, and you stay civil toward them.',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    blurb: 'Fair-minded. Weighs both sides.',
    prompt:
      'Fair-minded and undecided. You weigh both sides, grant good points, and press where an answer is thin. You want the best case, not a fight.',
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
