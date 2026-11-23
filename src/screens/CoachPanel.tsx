import { useEffect, useState } from 'react';
import { useApp } from '../app/AppContext';
import { Button } from '../components/Button';
import { DraftNote } from '../components/Notice';
import { Segments } from '../components/TurnProgress';
import { contextOf, describeError } from '../conversation/provider';
import type { Conversation } from '../conversation/types';
import { isDraft } from '../data/scripts';
import { cx } from '../lib/cx';
import ui from '../styles/ui.module.css';
import s from './CoachPanel.module.css';

const STEP_NAMES = ['nudge', 'outline', 'sample reply'] as const;

function Step({
  title,
  text,
  locked,
  lockedText,
}: {
  title: string;
  text?: string;
  locked: boolean;
  lockedText: string;
}) {
  return (
    <div className={cx(s.step, locked && s.locked)}>
      <h3 className={ui.h3}>{title}</h3>
      {locked ? <p className={ui.muted}>{lockedText}</p> : <p className={cx(ui.text, s.stepText)}>{text}</p>}
    </div>
  );
}

interface Props {
  conversation: Conversation;
  /** Whether the panel is showing. Help is only fetched once it is. */
  open: boolean;
  onClose: () => void;
}

/** Help in steps. The outline and sample reply stay locked until the person asks for them. */
export function CoachPanel({ conversation, open, onClose }: Props) {
  const { provider, mode, dispatch } = useApp();
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const { id, coach, coachStep: step, awaiting, userReplies } = conversation;
  const live = provider.mode === 'live';
  // Coach helps with the skeptic's latest message, so wait until there is one to help with.
  const waiting = awaiting;

  useEffect(() => {
    if (!open || coach || waiting || mode === 'checking') return;
    let cancelled = false;
    const ctrl = new AbortController();
    setError(null);
    provider
      .coach(contextOf(conversation), { signal: ctrl.signal })
      .then((content) => !cancelled && dispatch(id, { type: 'COACH_LOADED', coach: content, forReplies: userReplies }))
      .catch((err: unknown) => !cancelled && setError(describeError(err)));
    return () => {
      cancelled = true;
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, coach, waiting, mode, id, userReplies, attempt, provider]);

  return (
    <div className={s.coach}>
      <div className={cx(ui.row, ui.between)}>
        <h2 id="coach-title" className={ui.h2} tabIndex={-1}>
          Coach
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
      <p className={ui.muted}>
        {live
          ? 'AI help in steps. Stop whenever you like.'
          : 'Help for this question, in steps. Stop whenever you like.'}
      </p>

      {waiting ? (
        <p className={cx(ui.text, s.wait)}>Coach can help as soon as the skeptic has replied.</p>
      ) : error ? (
        <div className={s.step} role="alert">
          <p className={ui.text}>Coach could not load. {error}</p>
          <Button variant="secondary" size="sm" className={s.retry} onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </Button>
        </div>
      ) : !coach ? (
        <div className={ui.skeleton} role="status" aria-label="Coach is thinking" />
      ) : (
        <>
          <div className={s.progress}>
            <Segments total={3} on={step} />
            <span className={ui.small} role="status">
              Step {step} of 3: {STEP_NAMES[step - 1]}
            </span>
          </div>
          <Step title="Nudge" text={coach.nudge} locked={false} lockedText="" />
          <Step title="Outline" text={coach.outline} locked={step < 2} lockedText="Shows when you ask." />
          <Step title="Sample reply" text={coach.sample} locked={step < 3} lockedText="Shows after the outline." />
          {!live && isDraft(conversation.questionId) && <DraftNote />}
          {step < 3 && (
            <Button variant="primary" block onClick={() => dispatch(id, { type: 'COACH_STEP' })}>
              {step === 1 ? 'Show outline' : 'Show sample reply'}
            </Button>
          )}
        </>
      )}
      <Button variant="ghost" block onClick={onClose}>
        Back to my reply
      </Button>
    </div>
  );
}
