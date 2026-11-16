import type { Conversation } from '../conversation/types';
import type { StorageLike } from './storage';

export const STORE_KEY = 'ap.practice.v1';
/** Oldest finished conversations are dropped past this, so storage never fills up. */
export const MAX_CONVERSATIONS = 50;

export interface Settings {
  /** Read the skeptic's replies aloud. */
  readAloud: boolean;
}

export interface AppData {
  v: 1;
  conversations: Record<string, Conversation>;
  /** Unsent composer text, by conversation id. */
  drafts: Record<string, string>;
  settings: Settings;
  /** The first-run "How it works" intro has been shown. */
  seenIntro: boolean;
}

export const emptyData: AppData = {
  v: 1,
  conversations: {},
  drafts: {},
  settings: { readAloud: false },
  seenIntro: false,
};

function load(storage: StorageLike): AppData {
  try {
    const raw = storage.getItem(STORE_KEY);
    if (!raw) return emptyData;
    const parsed = JSON.parse(raw) as Partial<AppData>;
    if (parsed.v !== 1) return emptyData;
    return {
      ...emptyData,
      ...parsed,
      settings: { ...emptyData.settings, ...parsed.settings },
      conversations: parsed.conversations ?? {},
      drafts: parsed.drafts ?? {},
    };
  } catch {
    return emptyData;
  }
}

function prune(data: AppData): AppData {
  const all = Object.values(data.conversations);
  if (all.length <= MAX_CONVERSATIONS) return data;
  // Keep everything in progress; drop the oldest finished ones first.
  const ended = all.filter((c) => c.status === 'ended').sort((a, b) => a.updatedAt - b.updatedAt);
  const drop = new Set(ended.slice(0, all.length - MAX_CONVERSATIONS).map((c) => c.id));
  if (!drop.size) return data;
  const conversations = Object.fromEntries(Object.entries(data.conversations).filter(([id]) => !drop.has(id)));
  const drafts = Object.fromEntries(Object.entries(data.drafts).filter(([id]) => !drop.has(id)));
  return { ...data, conversations, drafts };
}

export interface Store {
  get(): AppData;
  update(fn: (data: AppData) => AppData): void;
  subscribe(listener: () => void): () => void;
}

/** A small saved store. State is immutable, so React can subscribe with useSyncExternalStore. */
export function createStore(storage: StorageLike): Store {
  let data = load(storage);
  const listeners = new Set<() => void>();
  return {
    get: () => data,
    update(fn) {
      const next = prune(fn(data));
      if (next === data) return;
      data = next;
      try {
        storage.setItem(STORE_KEY, JSON.stringify(data));
      } catch {
        // Storage is full or blocked. The app keeps working from memory.
      }
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

// ---- Selectors ----

export function listConversations(data: AppData): Conversation[] {
  return Object.values(data.conversations).sort((a, b) => b.updatedAt - a.updatedAt);
}

/** The conversation to offer on Home: the most recent one in progress that has actually begun. */
export function resumable(data: AppData): Conversation | undefined {
  return listConversations(data).find((c) => c.status === 'active' && c.messages.length > 0);
}

/** Questions the person has finished at least once. */
export function practicedIds(data: AppData): Set<string> {
  return new Set(
    Object.values(data.conversations)
      .filter((c) => c.status === 'ended')
      .map((c) => c.questionId),
  );
}
