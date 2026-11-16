import { MicrophoneIcon, PaperAirplaneIcon, StopIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useId, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { MAX_REPLY_CHARS } from '../conversation/types';
import { cx } from '../lib/cx';
import ui from '../styles/ui.module.css';
import { useSpeechInput } from '../voice/useSpeechInput';
import { Button } from './Button';
import s from './Composer.module.css';

interface Props {
  value: string;
  onChange: (text: string) => void;
  onSend: (text: string) => void;
  /** Off while the skeptic writes. */
  disabled?: boolean;
  placeholder: string;
}

/** Show the character count once the reply is this close to the limit. */
const COUNT_FROM = MAX_REPLY_CHARS * 0.8;

export function Composer({ value, onChange, onSend, disabled, placeholder }: Props) {
  const id = useId();
  const field = useRef<HTMLTextAreaElement>(null);

  const append = useCallback(
    (heard: string) => {
      if (!heard) return;
      const next = value ? `${value.trimEnd()} ${heard}` : heard;
      onChange(next.slice(0, MAX_REPLY_CHARS));
    },
    [value, onChange],
  );
  const speech = useSpeechInput(append);

  // Grow with the text, up to the height set in CSS.
  const shown = speech.listening && speech.interim ? `${value ? value.trimEnd() + ' ' : ''}${speech.interim}` : value;
  useEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [shown]);

  // Hand focus back to the field when it is the person's turn again.
  const wasDisabled = useRef(disabled);
  useEffect(() => {
    if (wasDisabled.current && !disabled) field.current?.focus({ preventScroll: true });
    wasDisabled.current = disabled;
  }, [disabled]);

  const canSend = !disabled && value.trim().length > 0;

  const send = () => {
    if (!canSend) return;
    if (speech.listening) speech.stop();
    onSend(value);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    send();
  };

  // Enter sends, Shift+Enter makes a new line. Not while an input method is composing text.
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  const left = MAX_REPLY_CHARS - value.length;

  return (
    <form className={cx(ui.container, s.dock)} onSubmit={submit}>
      {speech.error && (
        <p className={s.note} role="alert">
          {speech.error}
        </p>
      )}
      <div className={cx(s.field, disabled && s.off)}>
        <label htmlFor={id} className="sr-only">
          Your reply
        </label>
        <textarea
          id={id}
          ref={field}
          className={s.input}
          rows={1}
          value={shown}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={speech.listening ? 'Listening' : placeholder}
          disabled={disabled}
          readOnly={speech.listening}
          maxLength={MAX_REPLY_CHARS}
          autoComplete="off"
          enterKeyHint="send"
        />
        {value.length >= COUNT_FROM && (
          <span className={cx(s.count, left <= 0 && s.countFull)} aria-live="polite">
            {left} left
          </span>
        )}
        {speech.supported ? (
          <Button
            variant={speech.listening ? 'primary' : 'secondary'}
            size="icon"
            className={cx(speech.listening && s.listening)}
            aria-label={speech.listening ? 'Stop listening' : 'Speak your reply'}
            aria-pressed={speech.listening}
            disabled={disabled}
            onClick={speech.listening ? speech.stop : speech.start}
          >
            {speech.listening ? <StopIcon aria-hidden="true" /> : <MicrophoneIcon aria-hidden="true" />}
          </Button>
        ) : null}
        <Button variant="primary" size="icon" type="submit" aria-label="Send" disabled={!canSend}>
          <PaperAirplaneIcon aria-hidden="true" />
        </Button>
      </div>
      {!speech.supported && (
        <p className={s.note}>Voice input is not available in this browser. You can type your reply.</p>
      )}
    </form>
  );
}
