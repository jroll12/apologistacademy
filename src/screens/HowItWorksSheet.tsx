import { Button } from '../components/Button';
import { Sheet } from '../components/Sheet';

const STEPS = [
  ['Pick a question', 'Start with a suggestion or browse.'],
  ['Talk for five turns', 'Speak or type. The skeptic pushes back.'],
  ['Ask for help anytime', 'A nudge, then an outline, then a sample reply.'],
  ['Read your review', 'What you covered, what to add, and sources. No scores.'],
] as const;

/** Screen 7: opens from any top bar. Holds the AI disclosure. */
export function HowItWorksSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet labelledBy="how-title" onClose={onClose} style={{ gap: 14 }}>
      <div className="row sb">
        <h2 id="how-title" className="d" style={{ fontSize: 22 }}>How it works</h2>
        <Button variant="sec" size="sm" onClick={onClose}>Close</Button>
      </div>
      {STEPS.map(([title, body], i) => (
        <div key={title} className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
          <span className="num" aria-hidden="true">{i + 1}</span>
          <div>
            <h3 className="d" style={{ fontSize: 16 }}>{title}</h3>
            <p className="muted">{body}</p>
          </div>
        </div>
      ))}
      <div className="card">
        <h3 className="d" style={{ fontSize: 15 }}>About the AI</h3>
        <p className="muted" style={{ marginTop: 4 }}>The skeptic is a simulated character, not a real person. The skeptic and Coach are both AI.</p>
      </div>
      <Button variant="pri" block onClick={onClose}>Got it</Button>
    </Sheet>
  );
}
