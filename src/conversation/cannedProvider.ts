import { CLOSING, SCRIPTS } from '../data/scripts';
import type { ConversationProvider } from './provider';

export const OPENING_DELAY_MS = 500;
export const REPLY_DELAY_MS = 1200;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const cannedProvider: ConversationProvider = {
  async opening(q) {
    await wait(OPENING_DELAY_MS);
    return SCRIPTS[q.id].opening;
  },
  async reply(q, _history, userReplies) {
    await wait(REPLY_DELAY_MS);
    return userReplies >= 5 ? CLOSING : SCRIPTS[q.id].replies[userReplies - 1];
  },
  async coach(q) {
    return SCRIPTS[q.id].coach;
  },
  async review(q) {
    return SCRIPTS[q.id].review;
  },
};
