import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '../App';
import { createCannedProvider, INSTANT_TIMING } from '../conversation/cannedProvider';
import type { ConversationProvider } from '../conversation/provider';
import { ProviderError } from '../conversation/provider';
import { TAGLINE } from '../data/copy';
import { CLOSING, SCRIPTS } from '../data/scripts';
import { memoryStorage, type StorageLike } from '../store/storage';
import { createStore, type Store } from '../store/store';
import { AppProvider } from './AppContext';

let storage: StorageLike;
let store: Store;

function renderApp(path = '/', provider: ConversationProvider = createCannedProvider(INSTANT_TIMING)) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <AppProvider storage={storage} store={store} provider={provider}>
      <RouterProvider router={router} />
    </AppProvider>,
  );
  return router;
}

const reply = async (user: ReturnType<typeof userEvent.setup>, text: string) => {
  const box = screen.getByRole('textbox', { name: 'Your reply' });
  await waitFor(() => expect(box).toBeEnabled());
  await user.type(box, `${text}{Enter}`);
};

beforeEach(() => {
  window.scrollTo = vi.fn();
  storage = memoryStorage();
  store = createStore(storage);
  // Skip the first-run intro unless a test is about it.
  store.update((d) => ({ ...d, seenIntro: true }));
});

afterEach(cleanup);

describe('a whole practice conversation', () => {
  it('goes from Home through five turns to the review, and is saved', async () => {
    const user = userEvent.setup();
    const router = renderApp();

    expect(screen.getByRole('heading', { level: 1, name: 'Practice a hard talk' })).toBeInTheDocument();
    expect(screen.getByText(TAGLINE)).toBeInTheDocument();
    await user.click(
      within(screen.getByRole('region', { name: 'Suggested to start' })).getByRole('link', { name: 'Start' }),
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'Why does God allow suffering?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Start' }));

    expect(await screen.findByText(SCRIPTS.suffering.opening)).toBeInTheDocument();
    expect(screen.getByText('Turn 1 of 5')).toBeInTheDocument();

    await reply(user, 'First reply');
    expect(await screen.findByText(SCRIPTS.suffering.replies[0])).toBeInTheDocument();
    expect(screen.getByText('Turn 2 of 5')).toBeInTheDocument();

    for (let n = 2; n <= 4; n++) {
      await reply(user, `Reply ${n}`);
      expect(await screen.findByText(SCRIPTS.suffering.replies[n - 1])).toBeInTheDocument();
    }
    await reply(user, 'Reply 5');

    expect(await screen.findByRole('heading', { name: 'Coach review' })).toBeInTheDocument();
    expect(router.state.location.pathname).toMatch(/^\/review\//);
    expect(screen.getAllByText(CLOSING).length).toBeGreaterThan(0);
    expect(await screen.findByText(SCRIPTS.suffering.review.couldAdd)).toBeInTheDocument();
    // A scripted review never claims to know what the person covered.
    expect(screen.queryByText('What you covered')).not.toBeInTheDocument();
    // No sources yet, so no empty Sources card.
    expect(screen.queryByRole('heading', { name: 'Sources' })).not.toBeInTheDocument();
    expect(screen.getByText(/Psalm 34:18/)).toBeInTheDocument();

    const saved = Object.values(store.get().conversations);
    expect(saved).toHaveLength(1);
    expect(saved[0].status).toBe('ended');
    expect(saved[0].messages).toHaveLength(11);
  });

  it('resumes a saved conversation where it stopped', async () => {
    const user = userEvent.setup();
    renderApp('/practice/bible');
    await user.click(await screen.findByRole('button', { name: 'Start' }));
    await screen.findByText(SCRIPTS.bible.opening);
    await reply(user, 'A reply before leaving');
    await screen.findByText(SCRIPTS.bible.replies[0]);
    const id = Object.keys(store.get().conversations)[0];
    cleanup();

    // A fresh app over the same storage, as after a reload.
    store = createStore(storage);
    renderApp('/');
    const resume = await screen.findByRole('region', { name: 'Pick up where you left off' });
    expect(within(resume).getByText('Can I trust the Bible?')).toBeInTheDocument();
    await user.click(within(resume).getByRole('link', { name: 'Resume' }));

    expect(await screen.findByText('A reply before leaving')).toBeInTheDocument();
    expect(screen.getByText(SCRIPTS.bible.replies[0])).toBeInTheDocument();
    expect(Object.keys(store.get().conversations)).toEqual([id]);
  });

  it('shows an error with a way to try again when a reply fails, then recovers', async () => {
    const user = userEvent.setup();
    const canned = createCannedProvider(INSTANT_TIMING);
    let failNext = true;
    const flaky: ConversationProvider = {
      ...canned,
      reply: (ctx, opts) => {
        if (failNext) {
          failNext = false;
          return Promise.reject(new ProviderError('Could not reach the server. Check your connection.', 'offline'));
        }
        return canned.reply(ctx, opts);
      },
    };
    renderApp('/practice/suffering', flaky);
    await user.click(await screen.findByRole('button', { name: 'Start' }));
    await screen.findByText(SCRIPTS.suffering.opening);
    await reply(user, 'Hello');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Could not reach the server');
    expect(screen.getByRole('textbox', { name: 'Your reply' })).toBeDisabled();

    await user.click(within(alert).getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText(SCRIPTS.suffering.replies[0])).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('Coach', () => {
  it('reveals the nudge, then the outline, then the sample reply', async () => {
    const user = userEvent.setup();
    renderApp('/practice/suffering');
    await user.click(await screen.findByRole('button', { name: 'Start' }));
    await screen.findByText(SCRIPTS.suffering.opening);

    await user.click(screen.getByRole('button', { name: 'Ask Apologist AI' }));
    expect(await screen.findByText(SCRIPTS.suffering.coach.nudge)).toBeInTheDocument();
    expect(screen.getByText('Shows when you ask.')).toBeInTheDocument();
    expect(screen.queryByText(SCRIPTS.suffering.coach.sample)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show outline' }));
    expect(screen.getByText('Step 2 of 3: outline')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show sample reply' }));
    expect(screen.getByText(SCRIPTS.suffering.coach.sample)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Show/ })).not.toBeInTheDocument();
  });
});

describe('library and history', () => {
  it('filters questions by search and by topic', async () => {
    const user = userEvent.setup();
    renderApp('/questions');
    expect(screen.getAllByRole('listitem')).toHaveLength(16);

    await user.type(screen.getByRole('searchbox', { name: 'Search questions' }), 'prayer');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);

    await user.clear(screen.getByRole('searchbox', { name: 'Search questions' }));
    await user.click(screen.getByRole('button', { name: 'Jesus' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Jesus' })).toHaveAttribute('aria-pressed', 'true');

    await user.type(screen.getByRole('searchbox', { name: 'Search questions' }), 'zzzz');
    expect(screen.getByRole('heading', { name: 'No questions match' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(16);
  });

  it('shows an empty history, and needs two taps to clear a full one', async () => {
    const user = userEvent.setup();
    renderApp('/history');
    expect(screen.getByRole('heading', { name: 'No conversations yet' })).toBeInTheDocument();
    cleanup();

    renderApp('/practice/suffering');
    await user.click(await screen.findByRole('button', { name: 'Start' }));
    await screen.findByText(SCRIPTS.suffering.opening);
    cleanup();

    renderApp('/history');
    expect(screen.getByRole('link', { name: /Why does God allow suffering/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear history' }));
    expect(Object.keys(store.get().conversations)).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Tap again to clear everything' }));
    expect(Object.keys(store.get().conversations)).toHaveLength(0);
    expect(screen.getByRole('heading', { name: 'No conversations yet' })).toBeInTheDocument();
  });

  it('explains a missing question or conversation instead of crashing', async () => {
    renderApp('/practice/not-a-question');
    expect(screen.getByRole('heading', { name: 'We could not find that question' })).toBeInTheDocument();
    cleanup();
    renderApp('/talk/gone');
    expect(screen.getByRole('heading', { name: 'We could not find that conversation' })).toBeInTheDocument();
  });
});

describe('first visit', () => {
  it('does not cover the landing page, and shows How it works on the first Start only', async () => {
    const user = userEvent.setup();
    store.update((d) => ({ ...d, seenIntro: false }));
    const router = renderApp('/practice/suffering');
    expect(screen.queryByRole('heading', { name: 'How it works' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Start' }));
    expect(await screen.findByRole('heading', { name: 'How it works' })).toBeInTheDocument();
    expect(screen.getByText(/leave out names and private details/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'The Apologist Project' })).toHaveAttribute(
      'href',
      'https://apologistproject.org/',
    );
    await user.click(screen.getByRole('button', { name: 'Got it' }));

    // Closing it carries on into the conversation.
    expect(await screen.findByText(SCRIPTS.suffering.opening)).toBeInTheDocument();
    expect(router.state.location.pathname).toMatch(/^\/talk\//);
    expect(store.get().seenIntro).toBe(true);
  });
});
