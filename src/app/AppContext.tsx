import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { createCannedProvider, DEFAULT_TIMING, type CannedTiming } from '../conversation/cannedProvider';
import { createConversation, reduce, type Action } from '../conversation/conversation';
import { liveAvailable, liveProvider } from '../conversation/liveProvider';
import type { ConversationProvider } from '../conversation/provider';
import type { Difficulty, PersonaId, ProviderMode } from '../conversation/types';
import { defaultStorage, type StorageLike } from '../store/storage';
import { createStore, type AppData, type Settings, type Store } from '../store/store';

export interface AppValue {
  data: AppData;
  storage: StorageLike;
  /** 'checking' until the server has said whether live AI is on. */
  mode: 'checking' | ProviderMode;
  provider: ConversationProvider;
  /** Apply an action to one saved conversation. */
  dispatch: (conversationId: string, action: Action) => void;
  /** Create a conversation and return its id. Waits for the live-AI check first. */
  startConversation: (questionId: string, persona: PersonaId, difficulty: Difficulty) => Promise<string>;
  setDraft: (conversationId: string, text: string) => void;
  setSettings: (patch: Partial<Settings>) => void;
  clearHistory: () => void;
  howOpen: boolean;
  /** Open "How it works". `then` runs when it closes. */
  openHow: (then?: () => void) => void;
  closeHow: () => void;
}

const Ctx = createContext<AppValue | null>(null);

export function useApp(): AppValue {
  const value = useContext(Ctx);
  if (!value) throw new Error('useApp must be used inside <AppProvider>');
  return value;
}

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 13)
    : Math.random().toString(36).slice(2, 12) + Date.now().toString(36);

// VITE_FAST=1 shortens scripted pauses so browser tests run quickly.
const fastTiming: CannedTiming = { openingMs: 60, replyMs: 250, wordMs: 0 };
const timing = import.meta.env.VITE_FAST === '1' ? fastTiming : DEFAULT_TIMING;

interface Props {
  children: ReactNode;
  /** Tests pass their own. */
  storage?: StorageLike;
  store?: Store;
  /** Tests pass a provider to skip the server check. */
  provider?: ConversationProvider;
}

export function AppProvider({ children, storage: storageProp, store: storeProp, provider: providerProp }: Props) {
  const storage = useMemo(() => storageProp ?? defaultStorage(), [storageProp]);
  const store = useMemo(() => storeProp ?? createStore(storage), [storeProp, storage]);
  const data = useSyncExternalStore(store.subscribe, store.get);

  const canned = useMemo(() => createCannedProvider(timing), []);
  const [mode, setMode] = useState<AppValue['mode']>(providerProp ? providerProp.mode : 'checking');
  const ready = useRef<Promise<ProviderMode> | null>(null);

  useEffect(() => {
    if (providerProp) return;
    // VITE_FORCE_CANNED=1 builds a copy that never looks for a server (the hosted preview).
    const check = import.meta.env.VITE_FORCE_CANNED === '1' ? Promise.resolve(false) : liveAvailable();
    ready.current = check.then((live) => (live ? 'live' : 'canned'));
    let current = true;
    ready.current.then((m) => current && setMode(m));
    return () => {
      current = false;
    };
  }, [providerProp]);

  const provider = providerProp ?? (mode === 'live' ? liveProvider : canned);

  // "How it works" opens from the menu, and once on its own: the first time someone presses Start.
  // Whatever they were starting carries on when they close it.
  const [howOpen, setHowOpen] = useState(false);
  const afterHow = useRef<(() => void) | null>(null);
  const openHow = useCallback((then?: () => void) => {
    afterHow.current = then ?? null;
    setHowOpen(true);
  }, []);
  const closeHow = useCallback(() => {
    setHowOpen(false);
    store.update((d) => (d.seenIntro ? d : { ...d, seenIntro: true }));
    const then = afterHow.current;
    afterHow.current = null;
    then?.();
  }, [store]);

  const dispatch = useCallback(
    (id: string, action: Action) => {
      store.update((d) => {
        const current = d.conversations[id];
        if (!current) return d;
        const next = reduce(current, action);
        return next === current ? d : { ...d, conversations: { ...d.conversations, [id]: next } };
      });
    },
    [store],
  );

  const startConversation = useCallback(
    async (questionId: string, persona: PersonaId, difficulty: Difficulty) => {
      const resolved = providerProp ? providerProp.mode : ((await ready.current) ?? 'canned');
      const conversation = createConversation({
        id: newId(),
        questionId,
        persona,
        difficulty,
        mode: resolved,
        now: Date.now(),
      });
      store.update((d) => ({ ...d, conversations: { ...d.conversations, [conversation.id]: conversation } }));
      return conversation.id;
    },
    [providerProp, store],
  );

  const setDraft = useCallback(
    (id: string, text: string) => {
      store.update((d) => {
        if ((d.drafts[id] ?? '') === text) return d;
        const drafts = { ...d.drafts };
        if (text) drafts[id] = text;
        else delete drafts[id];
        return { ...d, drafts };
      });
    },
    [store],
  );

  const setSettings = useCallback(
    (patch: Partial<Settings>) => store.update((d) => ({ ...d, settings: { ...d.settings, ...patch } })),
    [store],
  );

  const clearHistory = useCallback(() => store.update((d) => ({ ...d, conversations: {}, drafts: {} })), [store]);

  const value = useMemo<AppValue>(
    () => ({
      data,
      storage,
      mode,
      provider,
      dispatch,
      startConversation,
      setDraft,
      setSettings,
      clearHistory,
      howOpen,
      openHow,
      closeHow,
    }),
    [
      data,
      storage,
      mode,
      provider,
      dispatch,
      startConversation,
      setDraft,
      setSettings,
      clearHistory,
      howOpen,
      openHow,
      closeHow,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
