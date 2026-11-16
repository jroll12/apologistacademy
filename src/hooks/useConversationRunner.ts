import { useEffect, useState } from 'react';
import { useApp } from '../app/AppContext';
import { contextOf, describeError } from '../conversation/provider';
import type { Conversation } from '../conversation/types';

/** How long to wait for the skeptic before giving up and offering "Try again". */
const TIMEOUT_MS = 45_000;

/**
 * Fetches the skeptic's next message whenever one is owed: the opening of a new
 * conversation, a reply after the person sends theirs, or a reply that was still
 * pending when the page was reloaded. Returns the text so far while it streams in.
 */
export function useConversationRunner(conversation: Conversation | undefined): string {
  const { provider, mode, dispatch } = useApp();
  const [streaming, setStreaming] = useState('');

  const id = conversation?.id;
  const owed = !!conversation && conversation.status === 'active' && conversation.awaiting && !conversation.error;
  const replies = conversation?.userReplies ?? 0;

  useEffect(() => {
    if (!conversation || !owed || mode === 'checking') return;
    let cancelled = false;
    let timedOut = false;
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      timedOut = true;
      ctrl.abort();
    }, TIMEOUT_MS);

    setStreaming('');
    const ctx = contextOf(conversation);
    const opts = { signal: ctrl.signal, onText: (text: string) => !cancelled && setStreaming(text) };
    const call = ctx.messages.length === 0 ? provider.opening(ctx, opts) : provider.reply(ctx, opts);

    call
      .then((text) => {
        if (cancelled) return;
        setStreaming('');
        dispatch(conversation.id, { type: 'SKEPTIC', text, now: Date.now() });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStreaming('');
        const message = timedOut ? 'The reply took too long.' : describeError(err);
        dispatch(conversation.id, { type: 'FAIL', message });
      })
      .finally(() => clearTimeout(timer));

    return () => {
      cancelled = true;
      clearTimeout(timer);
      ctrl.abort();
    };
    // The conversation object changes on every keystroke-free update; these are the values that decide a fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, owed, replies, mode, provider]);

  return streaming;
}
