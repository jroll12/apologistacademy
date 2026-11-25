import { useSyncExternalStore } from 'react';

/** True while the media query matches. False where matchMedia does not exist (tests). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false),
    () => false,
  );
}

/** The width at which the layout switches from phone to desktop. Keep in step with the CSS. */
export const DESKTOP = '(min-width: 1024px)';

/** Below the desktop width the topic chips are a swipeable row (phones and tablets); from there up they wrap. Keep in step with the CSS. */
export const NARROW = '(max-width: 1023px)';
