import { CrossGlyph } from './Icon';

/** Round "AI" chip that opens Coach help. The cross is a stand-in until the logo file exists. */
export function CoachFab({ disabled, onClick }: { disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" className={disabled ? 'fab dis' : 'fab'} aria-label="Ask Apologist" disabled={disabled} onClick={onClick}>
      <CrossGlyph />
      <span>AI</span>
    </button>
  );
}
