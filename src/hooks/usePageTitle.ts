import { useEffect } from 'react';

const SITE = 'Apologist Academy';

/** Sets the browser tab title for the current screen. */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : SITE;
  }, [title]);
}
