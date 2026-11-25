import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { useApp } from '../app/AppContext';
import { Button } from '../components/Button';
import { ChatBubble, PendingBubble } from '../components/ChatBubble';
import { CoachFab } from '../components/CoachFab';
import { Composer } from '../components/Composer';
import { Sheet } from '../components/Sheet';
import { TopBar } from '../components/TopBar';
import { TurnProgress } from '../components/TurnProgress';
import { turnOf } from '../conversation/conversation';
import { contextOf } from '../conversation/provider';
import { prefetchReview } from '../conversation/reviewPrefetch';
import { TOTAL_TURNS } from '../conversation/types';
import { findQuestion } from '../data/questions';
import { useConversationRunner } from '../hooks/useConversationRunner';
import { DESKTOP, useMediaQuery } from '../hooks/useMediaQuery';
import { useOnline } from '../hooks/useOnline';
import { cx } from '../lib/cx';
import ui from '../styles/ui.module.css';
import { useSpeechOutput } from '../voice/useSpeechOutput';
import { CoachPanel } from './CoachPanel';
import s from './ConversationScreen.module.css';
import { NotFoundScreen } from './NotFoundScreen';

export function ConversationScreen() {
  const { conversationId = '' } = useParams();
  const { data, provider, dispatch, setDraft, setSettings } = useApp();
  const conversation = data.conversations[conversationId];
  const question = findQuestion(conversation?.questionId);

  const streaming = useConversationRunner(conversation);
  const desktop = useMediaQuery(DESKTOP);
  const online = useOnline();
  const speech = useSpeechOutput();
  const [coachOpen, setCoachOpen] = useState(false);
  const thread = useRef<HTMLDivElement>(null);

  const messages = conversation?.messages ?? [];
  const awaiting = conversation?.awaiting ?? false;
  const lastSkeptic = [...messages].reverse().find((m) => m.from === 'skeptic');
  const readAloud = data.settings.readAloud;

  // After the fifth reply, start the review straight away, alongside the skeptic's closing line.
  const allReplies = !!conversation && conversation.status === 'active' && conversation.userReplies >= TOTAL_TURNS;
  useEffect(() => {
    if (!conversation || !allReplies || provider.mode !== 'live') return;
    prefetchReview(conversation.id, provider, contextOf(conversation), (review) =>
      dispatch(conversation.id, { type: 'REVIEW_LOADED', review }),
    );
    // Only the moment the fifth reply lands matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allReplies, conversation?.id]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = thread.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, awaiting, streaming, conversation?.error]);

  // Read each new skeptic message aloud, if asked. Messages already on screen at load stay silent.
  const spoken = useRef(lastSkeptic?.id);
  useEffect(() => {
    if (!lastSkeptic || lastSkeptic.id === spoken.current) return;
    spoken.current = lastSkeptic.id;
    if (readAloud) speech.speak(lastSkeptic.text);
  }, [lastSkeptic, readAloud, speech]);

  // On desktop Coach is a side panel. Move focus to it when it opens.
  useEffect(() => {
    if (coachOpen && desktop) document.getElementById('coach-title')?.focus({ preventScroll: true });
  }, [coachOpen, desktop]);

  if (!conversation || !question) return <NotFoundScreen what="conversation" />;
  if (conversation.status === 'ended') return <Navigate to={`/review/${conversation.id}`} replace />;

  const id = conversation.id;

  const send = (text: string) => {
    speech.cancel();
    dispatch(id, { type: 'SEND', text, now: Date.now() });
    setDraft(id, '');
  };

  const toggleReadAloud = () => {
    if (readAloud) speech.cancel();
    setSettings({ readAloud: !readAloud });
  };

  const closeCoach = () => setCoachOpen(false);

  return (
    <div className={cx(ui.screen, s.screen)}>
      <TopBar title={question.text} backTo="/questions" />
      <div className={s.layout}>
        <div className={s.main}>
          <TurnProgress
            turn={turnOf(conversation)}
            tag={provider.mode === 'live' ? 'AI skeptic' : 'Scripted skeptic'}
            action={
              speech.supported && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-pressed={readAloud}
                  aria-label="Read replies aloud"
                  title={readAloud ? 'Reading replies aloud' : 'Read replies aloud'}
                  onClick={toggleReadAloud}
                >
                  {readAloud ? <SpeakerWaveIcon aria-hidden="true" /> : <SpeakerXMarkIcon aria-hidden="true" />}
                </Button>
              )
            }
          />

          <div className={s.threadWrap}>
            <div className={s.thread} ref={thread}>
              <div className={cx(ui.container, s.messages)} role="log" aria-label="Conversation" aria-live="polite">
                {messages.map((m, i) => (
                  <ChatBubble key={m.id} message={m} still={i < messages.length - 1} />
                ))}
                {awaiting && !conversation.error && <PendingBubble text={streaming} />}
                {conversation.error && (
                  <div className={s.error} role="alert">
                    <p className={ui.text}>The skeptic's reply did not arrive. {conversation.error}</p>
                    <Button variant="secondary" size="sm" onClick={() => dispatch(id, { type: 'RETRY' })}>
                      Try again
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className={s.fabRail}>
              <div className={cx(ui.container, s.fabSlot)}>
                <CoachFab expanded={coachOpen} onClick={() => setCoachOpen((open) => !open)} />
              </div>
            </div>
          </div>

          {!online && provider.mode === 'live' && (
            <p className={cx(ui.container, ui.small, s.offline)} role="status">
              You are offline. Your conversation is saved and will carry on when you reconnect.
            </p>
          )}

          <Composer
            key={id}
            value={data.drafts[id] ?? ''}
            onChange={(text) => setDraft(id, text)}
            onSend={send}
            disabled={awaiting}
            placeholder={awaiting ? 'Paused while the skeptic writes' : 'Type or speak your reply'}
          />
        </div>

        {desktop && coachOpen && (
          <aside className={s.side} aria-labelledby="coach-title">
            <CoachPanel conversation={conversation} open onClose={closeCoach} />
          </aside>
        )}
      </div>

      {!desktop && (
        <Sheet open={coachOpen} onClose={closeCoach} labelledBy="coach-title">
          <CoachPanel conversation={conversation} open={coachOpen} onClose={closeCoach} />
        </Sheet>
      )}
    </div>
  );
}
