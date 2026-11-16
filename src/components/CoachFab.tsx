import s from './CoachFab.module.css';

/**
 * Round "AI" button that opens Coach. The cross is a stand-in from the design board
 * until the logo file exists; swap the glyph for the mark then.
 */
export function CoachFab({ expanded, onClick }: { expanded: boolean; onClick: () => void }) {
  return (
    <button type="button" className={s.fab} aria-label="Ask Apologist AI" aria-expanded={expanded} onClick={onClick}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M10 2h4v6h6v4h-6v10h-4V12H4V8h6z" />
      </svg>
      <span>AI</span>
    </button>
  );
}
