import { useEffect, useRef } from 'react';
import { createBrowserRouter, createMemoryRouter, Outlet, useLocation, type RouteObject } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { AppProvider } from './app/AppContext';
import { ConversationScreen } from './screens/ConversationScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { HomeScreen } from './screens/HomeScreen';
import { HowItWorksSheet } from './screens/HowItWorksSheet';
import { LibraryScreen } from './screens/LibraryScreen';
import { ErrorScreen, NotFoundScreen } from './screens/NotFoundScreen';
import { PreBriefScreen } from './screens/PreBriefScreen';
import { ReviewScreen } from './screens/ReviewScreen';

/** Wraps every screen. Moves focus and scroll to the top when the screen changes. */
function Shell() {
  const { pathname } = useLocation();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo(0, 0);
    // Focus the new screen's heading so screen readers announce it and Tab starts from the top.
    document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  }, [pathname]);

  const skip = (e: React.MouseEvent) => {
    e.preventDefault();
    document.querySelector<HTMLElement>('h1')?.focus();
  };

  return (
    <>
      <a href="#" className="skip-link" onClick={skip}>
        Skip to content
      </a>
      <Outlet />
      <HowItWorksSheet />
    </>
  );
}

export const routes: RouteObject[] = [
  {
    element: <Shell />,
    errorElement: <ErrorScreen />,
    children: [
      { path: '/', element: <HomeScreen /> },
      { path: '/questions', element: <LibraryScreen /> },
      { path: '/practice/:questionId', element: <PreBriefScreen /> },
      { path: '/talk/:conversationId', element: <ConversationScreen /> },
      { path: '/review/:conversationId', element: <ReviewScreen /> },
      { path: '/history', element: <HistoryScreen /> },
      { path: '*', element: <NotFoundScreen /> },
    ],
  },
];

// VITE_ROUTER=memory builds a copy that keeps its place in memory instead of the address bar,
// for hosts that do not serve the app from the site root.
const router = import.meta.env.VITE_ROUTER === 'memory' ? createMemoryRouter(routes) : createBrowserRouter(routes);

export default function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}
