import { Button } from '../components/Button';
import { TopBar } from '../components/TopBar';
import { TurnProgress } from '../components/TurnProgress';
import type { State } from '../conversation/state';
import type { Review } from '../conversation/types';

interface Props {
  state: State;
  onBack: () => void;
  onHow: () => void;
  onAnother: () => void;
  onRetry: () => void;
}

const card = { padding: '12px 16px' } as const;

function ReviewCard({ label, text }: { label: string; text: string }) {
  return (
    <div className="card" style={card}>
      <span className="eb">{label}</span>
      <p className="txt" style={{ marginTop: 2 }}>{text}</p>
    </div>
  );
}

function Cards({ review }: { review: Review }) {
  return (
    <>
      <ReviewCard label="What you covered" text={review.covered} />
      <ReviewCard label="What you could add" text={review.couldAdd} />
      <ReviewCard label="One possible answer" text={review.possibleAnswer} />
      <div className="card" style={card}>
        <span className="eb">Sources</span>
        {review.sources.map((s, i) => (
          <p key={s.title} style={{ fontSize: 14, marginTop: i === 0 ? 2 : 0 }}>
            <a href={s.href} onClick={s.href === '#' ? (e) => e.preventDefault() : undefined}>{s.title}</a>
          </p>
        ))}
      </div>
    </>
  );
}

/** Screen 8: conversation ended and Coach review on one screen. */
export function FeedbackScreen({ state, onBack, onHow, onAnother, onRetry }: Props) {
  const closing = [...state.messages].reverse().find((m) => m.from === 'skeptic');
  return (
    <>
      <TopBar title="Conversation ended" onBack={onBack} onHow={onHow} />
      <TurnProgress turn={5} status="Ended" />
      <main className="body" style={{ gap: 12, paddingTop: 16 }}>
        {closing && (
          <div className="mw">
            <span className="who">Simulated skeptic</span>
            <div className="bub sk">{closing.text}</div>
          </div>
        )}
        <div>
          <h2 className="d" style={{ fontSize: 22 }}>Coach review</h2>
          <p className="muted">Notes for next time. No scores.</p>
        </div>
        {state.review && <Cards review={state.review} />}
      </main>
      <div className="dock col" style={{ gap: 8 }}>
        <Button variant="pri" block onClick={onAnother}>Practice another question</Button>
        <Button variant="sec" block onClick={onRetry}>Try this question again</Button>
      </div>
    </>
  );
}
