import { useApp } from '../app/AppContext';
import { Button } from '../components/Button';
import { Sheet } from '../components/Sheet';
import { APOLOGIST_PROJECT_URL } from '../data/copy';
import { cx } from '../lib/cx';
import ui from '../styles/ui.module.css';
import s from './HowItWorksSheet.module.css';

const STEPS = [
  ['Pick a question', 'Start with a suggestion or browse.'],
  [
    'Talk for five turns',
    "Speak or type. The skeptic pushes back and won't be converted. Aim for a good conversation, not a win.",
  ],
  ['Ask for help anytime', 'A hint, then an outline, then a sample reply.'],
  ['Read your review', 'What to add and one possible answer, with a verse. No scores.'],
] as const;

/** Opens from the menu, and once the first time someone presses Start. Holds the AI and privacy notes. */
export function HowItWorksSheet() {
  const { howOpen, closeHow, mode } = useApp();
  return (
    <Sheet open={howOpen} onClose={closeHow} labelledBy="how-title">
      <h2 id="how-title" className={ui.h2}>
        How it works
      </h2>
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
        <p className={cx(ui.muted, s.cardBody)}>
          What you type is sent to the AI to write replies, so leave out names and private details. Your conversations
          are saved only in this browser.
        </p>
      </div>
      <Button variant="primary" block onClick={closeHow}>
        Got it
      </Button>
      <p className={cx(ui.small, s.credit)}>
        Made by{' '}
        <a className={ui.link} href={APOLOGIST_PROJECT_URL} target="_blank" rel="noreferrer">
          The Apologist Project
        </a>
      </p>
    </Sheet>
  );
}
