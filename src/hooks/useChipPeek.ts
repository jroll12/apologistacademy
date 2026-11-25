import { useLayoutEffect, type RefObject } from 'react';

/** A chip must show at least this much, and hide at least this much, to read as "more to swipe". */
const MIN_SHOWN = 22;
const MIN_HIDDEN = 14;
/** How far the row's start may move: a little left (the margin is 16px) or a fair way right. */
const MIN_SHIFT = -12;
const MAX_SHIFT = 34;

/**
 * Makes sure a swipeable row of chips always has one cut off by the right edge of the screen.
 * Depending on the phone's width, a gap between two chips can land exactly on the edge, which
 * hides the hint that there is more. When that happens, the row's start is nudged by a few pixels.
 * The nudge is passed to the CSS as --chip-shift. Turned off (and reset) when `active` is false.
 */
export function useChipPeek(ref: RefObject<HTMLElement | null>, active: boolean) {
  useLayoutEffect(() => {
    const row = ref.current;
    if (!row) return;

    const fit = () => {
      const current = parseFloat(row.style.getPropertyValue('--chip-shift')) || 0;
      const set = (px: number) => {
        if (px === current) return;
        if (px === 0) row.style.removeProperty('--chip-shift');
        else row.style.setProperty('--chip-shift', `${px}px`);
      };
      // The visible right edge is the page's, which leaves out a scrollbar on a narrow desktop window.
      const width = Math.min(row.clientWidth, document.documentElement.clientWidth - row.getBoundingClientRect().left);
      const chips = [...row.children] as HTMLElement[];
      if (!active || !chips.length || row.scrollWidth - current <= width + 1) return set(0);
      // Where each chip is with no nudge applied.
      const base = chips.map((c) => ({ left: c.offsetLeft - current, right: c.offsetLeft - current + c.offsetWidth }));
      // Smallest nudge first, either way.
      for (let step = 0; step <= Math.max(MAX_SHIFT, -MIN_SHIFT); step += 2) {
        for (const s of step === 0 ? [0] : [step, -step]) {
          if (s < MIN_SHIFT || s > MAX_SHIFT) continue;
          if (base.some((b) => b.left + s <= width - MIN_SHOWN && b.right + s >= width + MIN_HIDDEN)) return set(s);
        }
      }
      set(0);
    };

    fit();
    // Web fonts change the chips' widths once they load.
    void document.fonts?.ready.then(fit);
    // Where ResizeObserver is missing (very old browsers, the unit tests' simulated browser), the row just isn't nudged.
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(fit);
    // The whole outer width, not the inside: the row's padding grows as the screen does, so on a tablet
    // the inside width stays the same while the screen changes size.
    observer.observe(row, { box: 'border-box' });
    return () => observer.disconnect();
  }, [ref, active]);
}
