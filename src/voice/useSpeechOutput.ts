import { useCallback, useEffect } from 'react';

export interface SpeechOutput {
  supported: boolean;
  speak: (text: string) => void;
  cancel: () => void;
}

/** Text to speech, using the voices built into the browser. */
export function useSpeechOutput(): SpeechOutput {
  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  const cancel = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = document.documentElement.lang || 'en';
      window.speechSynthesis.speak(utterance);
    },
    [supported],
  );

  // Never keep talking after the screen is gone.
  useEffect(() => cancel, [cancel]);

  return { supported, speak, cancel };
}
