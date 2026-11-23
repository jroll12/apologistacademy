import type { ReactNode } from 'react';
import { TOTAL_TURNS } from '../conversation/types';
import { cx } from '../lib/cx';
import ui from '../styles/ui.module.css';
import s from './TurnProgress.module.css';

/** n-of-total progress bar. Decorative: the text beside it carries the meaning. */
export function Segments({ total, on }: { total: number; on: number }) {
  return (
    <div className={s.segments} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={s.segment}>
          <div className={cx(s.fill, i < on && s.on)} />
        </div>
      ))}
    </div>
  );
}

interface Props {
  turn: number;
  /** A quiet tag on the left, such as "AI skeptic". */
  tag?: string;
  /** Shows one continuous gradient bar: the conversation is finished. */
  complete?: boolean;
  /** Extra control on the right, such as the read-aloud toggle. */
  action?: ReactNode;
  /** Keep to the reading-width column on desktop. */
  narrow?: boolean;
}

/** The turn bar. The count is for screen readers; sighted people see the segments fill. */
export function TurnProgress({ turn, tag, complete, action, narrow }: Props) {
  return (
    <div className={cx(ui.container, narrow && ui.narrow, s.turn)}>
      <div className={cx(ui.row, ui.between, s.top)}>
        {tag ? <span className={s.tag}>{tag}</span> : <span />}
        <span className="sr-only">
          Turn {turn} of {TOTAL_TURNS}
        </span>
        <span className={s.right}>{action}</span>
      </div>
      {complete ? (
        <div className={cx(s.complete, 'ap-gradient-animate')} aria-hidden="true" />
      ) : (
        <Segments total={TOTAL_TURNS} on={turn} />
      )}
    </div>
  );
}
