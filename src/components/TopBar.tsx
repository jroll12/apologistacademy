import { Button } from './Button';
import { Logo } from './Logo';

interface Props {
  title?: string;
  onBack?: () => void;
  onHow: () => void;
}

/** Home shows the wordmark; every other screen shows Back + a centered title. */
export function TopBar({ title, onBack, onHow }: Props) {
  return (
    <header className="top">
      {onBack ? (
        <>
          <Button variant="sec" size="sm" onClick={onBack}>Back</Button>
          <h1 className="ttl">{title}</h1>
        </>
      ) : (
        // Placeholder wordmark, set as in the design board (Outfit 600, 20px).
        <Logo height={20} style={{ letterSpacing: 'normal', lineHeight: 1.5 }} />
      )}
      <Button variant="ghost" size="sm" onClick={onHow}>How it works</Button>
    </header>
  );
}
