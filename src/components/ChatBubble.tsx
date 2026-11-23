import type { Message } from '../conversation/types';
import { cx } from '../lib/cx';
import s from './ChatBubble.module.css';

export function ChatBubble({ message, still }: { message: Pick<Message, 'from' | 'text'>; still?: boolean }) {
  if (message.from === 'me') {
    return (
      <div className={cx(s.bubble, s.me, !still && s.enter)}>
        <span className="sr-only">You: </span>
        {message.text}
      </div>
    );
  }
  return (
    <div className={cx(s.bubble, s.skeptic, !still && s.enter)}>
      <span className="sr-only">Skeptic: </span>
      {message.text}
    </div>
  );
}

/** The skeptic is writing. Shows the words so far once they start arriving. */
export function PendingBubble({ text }: { text: string }) {
  return (
    <div className={cx(s.group, s.enter)}>
      {text ? (
        // Hidden from screen readers while it streams. The finished message is announced once.
        <div className={cx(s.bubble, s.skeptic)} aria-hidden="true">
          {text}
        </div>
      ) : (
        <div className={cx(s.bubble, s.skeptic, s.typing)} role="status" aria-label="Skeptic is replying">
          <span className={s.dot} />
          <span className={s.dot} />
          <span className={s.dot} />
          <span className={s.typingLabel}>Replying</span>
        </div>
      )}
    </div>
  );
}
