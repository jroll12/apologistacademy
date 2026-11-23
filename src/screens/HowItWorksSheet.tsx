import { useApp } from '../app/AppContext';
import { Button } from '../components/Button';
import { Sheet } from '../components/Sheet';
import { DAILY_LIMIT } from '../conversation/dailyLimit';
import { cx } from '../lib/cx';
import ui from '../styles/ui.module.css';
import s from './HowItWorksSheet.module.css';

const STEPS = [
  ['Pick a question', 'Start with a suggestion or browse.'],
  ['Talk for five turns', 'Speak or type. The skeptic pushes back.'],
  ['Ask for help anytime', 'A nudge, then an outline, then a sample reply.'],
  ['Read your review', 'What to add, one possible answer, and sources. No scores.'],
] as const;

/** Opens from any top bar, and once on a first visit. Holds the AI disclosure. */
export function HowItWorksSheet() {
  const { howOpen, closeHow, mode } = useApp();
  return (
    <Sheet open={howOpen} onClose={closeHow} labelledBy="how-title">
      <div className={cx(ui.row, ui.between)}>
        <h2 id="how-title" className={ui.h2}>
          How it works
        </h2>
        <Button variant="ghost" size="sm" onClick={closeHow}>
          Close
        </Button>
      </div>
      <ol className={s.steps}>
        {STEPS.map(([title, body], i) => (
          <li key={title} className={s.step}>
            <span className={s.num} aria-hidden="true">
              {i + 1}
            </span>
            <div>
              <h3 className={ui.h3}>{title}</h3>
              <p className={ui.muted}>{body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className={ui.card}>
        <h3 className={s.cardTitle}>About the AI</h3>
        <p className={cx(ui.muted, s.cardBody)}>
          The skeptic is a simulated character, not a real person.{' '}
          {mode === 'live'
            ? 'The skeptic and Coach are both AI.'
            : 'In this version the skeptic and Coach follow a script. With live AI switched on, both are AI.'}
        </p>
      </div>
      <div className={ui.card}>
        <h3 className={s.cardTitle}>Daily limit</h3>
        <p className={cx(ui.muted, s.cardBody)}>
          You can begin {DAILY_LIMIT} new conversations a day. A conversation you have started is never cut off.
        </p>
      </div>
      <Button variant="primary" block onClick={closeHow}>
        Got it
      </Button>
    </Sheet>
  );
}
