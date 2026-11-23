import s from './CoachFab.module.css';

/** Round "AI" button that opens Coach, with the Apologist mark (the cross, from icon-square.svg). */
export function CoachFab({ expanded, onClick }: { expanded: boolean; onClick: () => void }) {
  return (
    <button type="button" className={s.fab} aria-label="Ask Apologist AI" aria-expanded={expanded} onClick={onClick}>
      <svg width="26" height="26" viewBox="43 43 218 218" fill="currentColor" aria-hidden="true">
        <path d="M95.56,144.05v-36.56h113.51v36.56h-113.51ZM131.49,261.05V43.58h41.66v217.46h-41.66Z" />
      </svg>
      <span>AI</span>
    </button>
  );
}
