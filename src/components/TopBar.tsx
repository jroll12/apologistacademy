import { Bars3Icon, ChevronLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useRef } from 'react';
import { Link, NavLink } from 'react-router';
import { useApp } from '../app/AppContext';
import { DESKTOP, useMediaQuery } from '../hooks/useMediaQuery';
import { usePageTitle } from '../hooks/usePageTitle';
import { cx } from '../lib/cx';
import { Logo } from './Logo';
import s from './TopBar.module.css';

interface Props {
  /** The screen's heading. Leave out when the page sets its own h1. */
  title?: string;
  /** Where Back goes. Leave out on Home. */
  backTo?: string;
  /** Line the heading row up with a reading-width page column on desktop. */
  narrow?: boolean;
}

function BackLink({ to }: { to: string }) {
  return (
    <Link to={to} viewTransition className={s.back}>
      <ChevronLeftIcon aria-hidden="true" />
      Back
    </Link>
  );
}

const navClass = ({ isActive }: { isActive: boolean }) => cx(s.navLink, isActive && s.navActive);

/** Phone: everything else lives behind one menu button. */
function NavMenu() {
  const { openHow } = useApp();
  const dialog = useRef<HTMLDialogElement>(null);

  const open = () => dialog.current?.showModal?.();
  const close = () => dialog.current?.close?.();
  const how = () => {
    close();
    // Open the sheet after the menu has handed focus back to its button, so the sheet returns it there.
    requestAnimationFrame(openHow);
  };

  return (
    <>
      <button type="button" className={s.menuButton} aria-label="Menu" aria-haspopup="dialog" onClick={open}>
        <Bars3Icon aria-hidden="true" />
      </button>
      <dialog
        ref={dialog}
        className={s.menu}
        aria-label="Menu"
        onClick={(e) => {
          if (e.target === dialog.current) close();
        }}
      >
        <nav className={s.menuPanel} aria-label="Main">
          <button type="button" className={s.menuClose} aria-label="Close menu" onClick={close}>
            <XMarkIcon aria-hidden="true" />
          </button>
          <NavLink to="/questions" viewTransition className={s.menuLink} onClick={close}>
            Questions
          </NavLink>
          <NavLink to="/history" viewTransition className={s.menuLink} onClick={close}>
            History
          </NavLink>
          <button type="button" className={s.menuLink} onClick={how}>
            How it works
          </button>
        </nav>
      </dialog>
    </>
  );
}

/**
 * Desktop: the wordmark on the left, navigation on the right, and Back with the title on a row below.
 * Phone: Back (or the wordmark on Home), the title, and a menu button.
 */
export function TopBar({ title, backTo, narrow }: Props) {
  const { openHow } = useApp();
  const desktop = useMediaQuery(DESKTOP);
  usePageTitle(title);

  const brand = (
    <Link to="/" viewTransition className={s.brand} aria-label="Apologist Academy, home">
      <Logo />
    </Link>
  );

  const heading = title && (
    <h1 className={s.title} tabIndex={-1}>
      {title}
    </h1>
  );

  if (!desktop) {
    return (
      <header className={s.bar}>
        <div className={s.inner}>
          {backTo ? <BackLink to={backTo} /> : brand}
          {heading || <span className={s.spacer} />}
          <NavMenu />
        </div>
      </header>
    );
  }

  return (
    <header className={s.bar}>
      <div className={s.inner}>
        {brand}
        <span className={s.spacer} />
        <nav className={s.nav} aria-label="Main">
          <NavLink to="/questions" viewTransition className={navClass}>
            Questions
          </NavLink>
          <NavLink to="/history" viewTransition className={navClass}>
            History
          </NavLink>
          <button type="button" className={s.navLink} onClick={openHow}>
            How it works
          </button>
        </nav>
      </div>
      {(backTo || heading) && (
        <div className={cx(s.headRow, narrow && s.headNarrow)}>
          {backTo && <BackLink to={backTo} />}
          {heading}
        </div>
      )}
    </header>
  );
}
