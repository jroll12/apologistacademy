import { Link, NavLink } from 'react-router';
import { useApp } from '../app/AppContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { cx } from '../lib/cx';
import { Button, ButtonLink } from './Button';
import { Logo } from './Logo';
import s from './TopBar.module.css';

interface Props {
  /** The screen's heading. Home has none here: its heading is in the page. */
  title?: string;
  /** Where Back goes. Leave out on Home. */
  backTo?: string;
}

/**
 * Phone: Back, a centered title, and "How it works" (Home shows the wordmark instead of Back).
 * Desktop: wordmark and navigation on one row, with Back and a large title beneath.
 */
export function TopBar({ title, backTo }: Props) {
  const { openHow } = useApp();
  usePageTitle(title);

  const navClass = ({ isActive }: { isActive: boolean }) => cx(s.navLink, isActive && s.navActive);

  return (
    <header className={s.bar}>
      <div className={s.inner}>
        {backTo && (
          <ButtonLink variant="secondary" size="sm" to={backTo} className={s.back}>
            Back
          </ButtonLink>
        )}
        <Link
          to="/"
          viewTransition
          className={cx(s.brand, backTo && s.brandWide)}
          aria-label="Apologist practice, home"
        >
          <Logo />
        </Link>
        <nav className={s.nav} aria-label="Main">
          <NavLink to="/questions" viewTransition className={navClass}>
            Questions
          </NavLink>
          <NavLink to="/history" viewTransition className={navClass}>
            History
          </NavLink>
        </nav>
        {title ? (
          <h1 className={s.title} tabIndex={-1}>
            {title}
          </h1>
        ) : (
          <span className={s.spacer} />
        )}
        <Button variant="ghost" size="sm" className={s.how} onClick={openHow}>
          How it works
        </Button>
      </div>
    </header>
  );
}
