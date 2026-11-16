import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import s from './Sheet.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  /** id of the heading that names the sheet. */
  labelledBy: string;
  children: ReactNode;
}

/** How far the sheet must be dragged down before letting go closes it. */
const DRAG_CLOSE_PX = 96;
const CLOSE_MS = 180;

/**
 * A bottom sheet on phones and a centered dialog on wider screens, built on the native
 * <dialog>. The browser provides the focus trap, Escape, and makes the page behind inert.
 * Focus returns to whatever opened it.
 */
export function Sheet({ open, onClose, labelledBy, children }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const drag = useRef<{ startY: number; dy: number } | null>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) {
      setClosing(false);
      // jsdom has no showModal; fall back to the plain open attribute there.
      if (typeof el.showModal === 'function') el.showModal();
      else el.setAttribute('open', '');
      // Start at the top of the sheet instead of on its first button.
      requestAnimationFrame(() => panel.current?.focus({ preventScroll: true }));
    } else if (!open && el.open) {
      // Play the exit, then actually close.
      setClosing(true);
      const timer = setTimeout(() => {
        if (typeof el.close === 'function') el.close();
        else el.removeAttribute('open');
        setClosing(false);
      }, CLOSE_MS);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = { startY: e.clientY, dy: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !panel.current) return;
    drag.current.dy = Math.max(0, e.clientY - drag.current.startY);
    panel.current.style.transform = `translateY(${drag.current.dy}px)`;
    panel.current.style.transition = 'none';
  };

  const onPointerEnd = () => {
    if (!drag.current || !panel.current) return;
    const { dy } = drag.current;
    drag.current = null;
    panel.current.style.transition = '';
    panel.current.style.transform = '';
    if (dy > DRAG_CLOSE_PX) onClose();
  };

  return (
    <dialog
      ref={dialog}
      className={s.dialog}
      aria-labelledby={labelledBy}
      data-closing={closing || undefined}
      onCancel={(e) => {
        // Escape: close through the parent so state and animation stay in step.
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // A click on the dimmed area lands on the dialog element itself.
        if (e.target === dialog.current) onClose();
      }}
    >
      {(open || closing) && (
        <div ref={panel} className={s.panel} tabIndex={-1}>
          <div
            className={s.grab}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            aria-hidden="true"
          >
            <span className={s.handle} />
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
