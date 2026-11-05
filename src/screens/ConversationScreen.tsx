import { useEffect, useRef } from 'react';
import { Button } from '../components/Button';
import { ChatBubble, TypingBubble } from '../components/ChatBubble';
import { CoachFab } from '../components/CoachFab';
import { Composer } from '../components/Composer';
import { Icon } from '../components/Icon';
import { TopBar } from '../components/TopBar';
import { TurnProgress } from '../components/TurnProgress';
import { getQuestion } from '../data/questions';
import { turnOf, type State } from '../conversation/state';

interface Props {
  state: State;
  resetTime: string;
  onSend: (text: string) => void;
  onCoach: () => void;
  onBack: () => void;
  onHow: () => void;
  onBrowse: () => void;
}

/** Screens 3 (ready), 5 (skeptic replying) and 6 (daily limit reached). */
export function ConversationScreen({ state, resetTime, onSend, onCoach, onBack, onHow, onBrowse }: Props) {
  const q = getQuestion(state.questionId ?? 'suffering');
  const { limited, pending } = state;
  const turn = turnOf(state);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.messages.length, pending]);

  return (
    <>
      <TopBar title={q.text} onBack={onBack} onHow={onHow} />
      {limited ? (
        <TurnProgress turn={0} status="Not started" />
      ) : (
        <TurnProgress turn={turn} status="Practice only" badge="Simulated skeptic. Not a real person." />
      )}

      {limited ? (
        <div className="msgs" style={{ justifyContent: 'center' }}>
          <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="tile"><Icon name="clock" size={24} /></div>
            <h2 className="d" style={{ fontSize: 22 }}>Daily limit reached</h2>
            <p className="txt">You have used today's practice conversations. Come back tomorrow for more.</p>
            <p className="muted">Resets at {resetTime}.</p>
            <Button variant="pri" block style={{ marginTop: 4 }} onClick={onBrowse}>Back to questions</Button>
            <Button variant="ghost" block onClick={onHow}>How limits work</Button>
          </div>
        </div>
      ) : (
        <div className="msgs fabpad" ref={logRef} role="log" aria-label="Conversation" aria-live="polite">
          {state.messages.map((m) => <ChatBubble key={m.id} message={m} />)}
          {pending && <TypingBubble />}
        </div>
      )}

      <Composer
        key={state.convoId}
        disabled={pending || limited}
        placeholder={limited ? 'Off until the limit resets' : pending ? 'Paused while the skeptic writes' : 'Type or speak your reply'}
        onSend={onSend}
      />
      <CoachFab disabled={limited} onClick={onCoach} />
    </>
  );
}
