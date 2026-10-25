import type { ComponentType } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './Layout';
import { AppearanceSync } from './AppearanceSync';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';

/**
 * Code-split pages load through the route's `lazy`, so the router waits for a page before switching to it.
 * That keeps View Transitions (figures gliding from Pick to a design's screen) from capturing a
 * "Loading…" frame. The designer pulls in three.js and the geometry kernel, so splitting matters there most.
 */
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({
  Component: (await load()).default,
});

function Loading() {
  return (
    <div role="status" className="p-8 text-muted">
      Loading…
    </div>
  );
}

function Root() {
  return (
    <>
      <AppearanceSync />
      <Layout />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <Root />,
    HydrateFallback: Loading,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'find', lazy: page(() => import('../pages/FinderPage')) },
      { path: 'design', lazy: page(() => import('../pages/PickPage')) },
      { path: 'design/:familyId', lazy: page(() => import('../pages/DesignerPage')) },
      { path: 'pick/:familyId', lazy: page(() => import('../pages/DesignScreen')) },
      { path: 'calibrate', lazy: page(() => import('../pages/CalibratePage')) },
      { path: 'learn', lazy: page(() => import('../pages/LearnPage')) },
      { path: 'limits', lazy: page(() => import('../pages/LimitsPage')) },
      { path: 'print-help', lazy: page(() => import('../pages/PrintHelpPage')) },
      { path: 'settings', lazy: page(() => import('../pages/SettingsPage')) },
      { path: 'account', lazy: page(() => import('../pages/AccountPage')) },
      { path: 'designs', lazy: page(() => import('../pages/DashboardPage')) },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
