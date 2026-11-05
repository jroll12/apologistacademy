import { Button } from '../components/Button';
import { Segments } from '../components/Segments';
import { Sheet } from '../components/Sheet';
import type { CoachContent, CoachStep } from '../conversation/types';

interface Props {
  step: CoachStep;
  coach: CoachContent | null;
  onNext: () => void;
  onClose: () => void;
}

const STEP_NAMES = ['nudge', 'outline', 'sample reply'] as const;

function Step({ title, text, locked, lockedText }: { title: string; text?: string; locked: boolean; lockedText: string }) {
  return (
    <div className={locked ? 'step lock' : 'step'}>
      <h3 className="d" style={{ fontSize: 16 }}>{title}</h3>
      {locked ? <p className="muted">{lockedText}</p> : <p className="txt" style={{ marginTop: 4 }}>{text}</p>}
    </div>
  );
}

/** Screen 4: help in steps. Outline and sample reply stay locked until asked for. */
export function CoachSheet({ step, coach, onNext, onClose }: Props) {
  return (
    <Sheet labelledBy="coach-title" onClose={onClose}>
      <div className="row sb">
        <h2 id="coach-title" className="d" style={{ fontSize: 22 }}>Coach</h2>
        <Button variant="sec" size="sm" onClick={onClose}>Close</Button>
      </div>
      <p className="muted">AI help in steps. Stop whenever you like.</p>
      <div className="col" style={{ gap: 6 }}>
        <Segments total={3} on={step} />
        <span className="muted" style={{ fontSize: 13 }}>Step {step} of 3: {STEP_NAMES[step - 1]}</span>
      </div>
      <Step title="Nudge" text={coach?.nudge ?? '…'} locked={false} lockedText="" />
      <Step title="Outline" text={coach?.outline} locked={step < 2} lockedText="Shows when you ask." />
      <Step title="Sample reply" text={coach?.sample} locked={step < 3} lockedText="Shows after the outline." />
      {step < 3 && (
        <Button variant="pri" block style={{ marginTop: 4 }} onClick={onNext}>
          {step === 1 ? 'Show outline' : 'Show sample reply'}
        </Button>
      )}
      <Button variant="ghost" block onClick={onClose}>Back to my reply</Button>
    </Sheet>
  );
}
