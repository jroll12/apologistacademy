import type { ReactNode } from 'react';
import { cx } from '../lib/cx';
import s from './Notice.module.css';

/** Decorative blurred gradient behind a screen. One per screen at most. */
export function Blob() {
  return <div className={s.blob} aria-hidden="true" />;
}

/** Shown wherever scripted copy on screen has not been reviewed yet. */
export function DraftNote() {
  return (
    <p className={s.draft}>
      <span className={s.draftTag}>Draft copy</span>
      This text is waiting for review.
    </p>
  );
}

interface StateProps {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  /** Buttons or links. */
  actions?: ReactNode;
  /** Announce it to screen readers as soon as it appears. */
  alert?: boolean;
  className?: string;
}

/** Empty, error and limit states: an icon tile, a heading, a sentence, and what to do next. */
export function StateCard({ icon, title, children, actions, alert, className }: StateProps) {
  return (
    <div className={cx(s.state, className)} role={alert ? 'alert' : undefined}>
      {icon && (
        <span className={s.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      <h2 className={s.title}>{title}</h2>
      {children}
      {actions && <div className={s.actions}>{actions}</div>}
    </div>
  );
}
