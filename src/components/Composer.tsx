import { useId, useRef, useState, type FormEvent } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';

interface Props {
  /** Off while the skeptic writes or the daily limit is reached. */
  disabled?: boolean;
  placeholder: string;
  onSend: (text: string) => void;
}

interface Recognition {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

function speechCtor(): (new () => Recognition) | undefined {
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function Composer({ disabled, placeholder, onSend }: Props) {
  const id = useId();
  const [value, setValue] = useState('');
  const [listening, setListening] = useState(false);
  const rec = useRef<Recognition | null>(null);
  const canSpeak = typeof window !== 'undefined' && !!speechCtor();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (disabled || !value.trim()) return;
    onSend(value);
    setValue('');
  };

  const toggleSpeak = () => {
    if (listening) {
      rec.current?.stop();
      return;
    }
    const Ctor = speechCtor();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = document.documentElement.lang || 'en';
    r.interimResults = false;
    r.onresult = (e) => {
      const text = Array.from(e.results).map((x) => x[0].transcript).join(' ');
      setValue((v) => (v ? v + ' ' : '') + text);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
  };

  return (
    <form className="dock" onSubmit={submit}>
      <div className={disabled ? 'chat dis' : 'chat'}>
        <label htmlFor={id} className="sr">Your reply</label>
        <input id={id} className="pht" value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} disabled={disabled} autoComplete="off" />
        <Button
          variant="sec"
          size="ico"
          aria-label={listening ? 'Stop speaking' : 'Speak'}
          aria-pressed={listening}
          title={canSpeak ? undefined : 'Voice input is not supported in this browser'}
          disabled={disabled || !canSpeak}
          onClick={toggleSpeak}
        >
          <Icon name="mic" />
        </Button>
        <Button variant="pri" size="ico" type="submit" aria-label="Send" disabled={disabled}>
          <Icon name="send" />
        </Button>
      </div>
    </form>
  );
}
