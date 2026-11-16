import { ExclamationTriangleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useRouteError } from 'react-router';
import { ButtonLink } from '../components/Button';
import { StateCard } from '../components/Notice';
import { TopBar } from '../components/TopBar';
import { cx } from '../lib/cx';
import ui from '../styles/ui.module.css';

/** A page, question or saved conversation that does not exist (an old link, or cleared history). */
export function NotFoundScreen({ what = 'page' }: { what?: 'page' | 'question' | 'conversation' }) {
  return (
    <div className={ui.screen}>
      <TopBar title="Not found" backTo="/" />
      <main className={cx(ui.container, ui.page, ui.narrow)}>
        <StateCard
          icon={<MagnifyingGlassIcon />}
          title={`We could not find that ${what}`}
          actions={
            <ButtonLink variant="primary" block to="/questions">
              Browse questions
            </ButtonLink>
          }
        >
          <p className={ui.text}>
            {what === 'conversation'
              ? 'Conversations are saved on the device where they happened. This one is not on this device.'
              : 'The link may be old or mistyped.'}
          </p>
        </StateCard>
      </main>
    </div>
  );
}

/** Shown if a screen crashes, so the person is never left with a blank page. */
export function ErrorScreen() {
  const error = useRouteError();
  console.error(error);
  return (
    <div className={ui.screen}>
      <main className={cx(ui.container, ui.page, ui.narrow)}>
        <StateCard
          alert
          icon={<ExclamationTriangleIcon />}
          title="Something went wrong"
          actions={
            <ButtonLink variant="primary" block to="/" reloadDocument>
              Go to the start
            </ButtonLink>
          }
        >
          <p className={ui.text}>The screen could not be shown. Your saved conversations are safe.</p>
        </StateCard>
      </main>
    </div>
  );
}
