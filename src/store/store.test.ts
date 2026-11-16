import { describe, expect, it, vi } from 'vitest';
import { createConversation, reduce } from '../conversation/conversation';
import type { Conversation } from '../conversation/types';
import { memoryStorage } from './storage';
import {
  createStore,
  emptyData,
  listConversations,
  MAX_CONVERSATIONS,
  practicedIds,
  resumable,
  STORE_KEY,
} from './store';

const convo = (id: string, now: number, patch: Partial<Conversation> = {}): Conversation => ({
  ...createConversation({
    id,
    questionId: 'suffering',
    persona: 'curious',
    difficulty: 'standard',
    mode: 'canned',
    now,
  }),
  ...patch,
});

const add = (store: ReturnType<typeof createStore>, c: Conversation) =>
  store.update((d) => ({ ...d, conversations: { ...d.conversations, [c.id]: c } }));

describe('store', () => {
  it('starts empty', () => {
    expect(createStore(memoryStorage()).get()).toEqual(emptyData);
  });

  it('saves changes and reloads them', () => {
    const storage = memoryStorage();
    const store = createStore(storage);
    add(store, convo('a', 1));
    store.update((d) => ({ ...d, seenIntro: true, settings: { readAloud: true } }));

    const reloaded = createStore(storage).get();
    expect(Object.keys(reloaded.conversations)).toEqual(['a']);
    expect(reloaded.seenIntro).toBe(true);
    expect(reloaded.settings.readAloud).toBe(true);
  });

  it('notifies subscribers, and only on a real change', () => {
    const store = createStore(memoryStorage());
    const listener = vi.fn();
    const stop = store.subscribe(listener);
    store.update((d) => d);
    expect(listener).not.toHaveBeenCalled();
    store.update((d) => ({ ...d, seenIntro: true }));
    expect(listener).toHaveBeenCalledTimes(1);
    stop();
    store.update((d) => ({ ...d, seenIntro: false }));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('falls back to empty on corrupt or foreign data', () => {
    const storage = memoryStorage();
    storage.setItem(STORE_KEY, '{not json');
    expect(createStore(storage).get()).toEqual(emptyData);
    storage.setItem(STORE_KEY, JSON.stringify({ v: 99, conversations: { x: {} } }));
    expect(createStore(storage).get()).toEqual(emptyData);
  });

  it('fills in fields missing from older saved data', () => {
    const storage = memoryStorage();
    storage.setItem(STORE_KEY, JSON.stringify({ v: 1, seenIntro: true }));
    const data = createStore(storage).get();
    expect(data.conversations).toEqual({});
    expect(data.settings).toEqual(emptyData.settings);
  });

  it('keeps working when storage refuses writes', () => {
    const storage = {
      ...memoryStorage(),
      setItem: () => {
        throw new Error('full');
      },
    };
    const store = createStore(storage);
    expect(() => add(store, convo('a', 1))).not.toThrow();
    expect(store.get().conversations.a).toBeDefined();
  });

  it('drops the oldest finished conversations past the cap, never ones in progress', () => {
    const store = createStore(memoryStorage());
    add(store, convo('active-old', 0));
    for (let i = 1; i <= MAX_CONVERSATIONS + 5; i++) add(store, convo(`e${i}`, i, { status: 'ended', updatedAt: i }));
    const ids = Object.keys(store.get().conversations);
    expect(ids).toHaveLength(MAX_CONVERSATIONS);
    expect(ids).toContain('active-old');
    expect(ids).not.toContain('e1');
    expect(ids).toContain(`e${MAX_CONVERSATIONS + 5}`);
  });
});

describe('selectors', () => {
  const started = reduce(convo('started', 5), { type: 'SKEPTIC', text: 'Opening', now: 5 });
  const data = {
    ...emptyData,
    conversations: {
      empty: convo('empty', 9),
      started,
      done: convo('done', 3, { status: 'ended', questionId: 'bible', updatedAt: 3 }),
    },
  };

  it('lists newest first', () => {
    expect(listConversations(data).map((c) => c.id)).toEqual(['empty', 'started', 'done']);
  });

  it('offers to resume only a conversation that has begun', () => {
    expect(resumable(data)?.id).toBe('started');
    expect(resumable(emptyData)).toBeUndefined();
  });

  it('counts a question as practiced only when finished', () => {
    expect([...practicedIds(data)]).toEqual(['bible']);
  });
});
