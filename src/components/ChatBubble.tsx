import type { Message } from '../conversation/types';

export function ChatBubble({ message }: { message: Message }) {
  if (message.from === 'me') return <div className="bub me">{message.text}</div>;
  return (
    <div className="mw">
      <span className="who">Simulated skeptic</span>
      <div className="bub sk">{message.text}</div>
    </div>
  );
}

export function TypingBubble() {
  return (
    <div className="mw">
      <span className="who">Simulated skeptic</span>
      <div className="bub sk row" style={{ gap: 6, padding: '16px 18px' }} role="status" aria-label="Skeptic is replying">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
        <span className="muted" style={{ fontSize: 13, marginLeft: 6 }}>Replying</span>
      </div>
    </div>
  );
}
