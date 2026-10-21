import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './Layout';
import { AppearanceSync } from './AppearanceSync';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';

// The designer pulls in three.js and the geometry kernel, so it is code-split.
const DesignerPage = lazy(() => import('../pages/DesignerPage'));
const PickPage = lazy(() => import('../pages/PickPage'));
const FinderPage = lazy(() => import('../pages/FinderPage'));
const CalibratePage = lazy(() => import('../pages/CalibratePage'));
const LearnPage = lazy(() => import('../pages/LearnPage'));
const LimitsPage = lazy(() => import('../pages/LimitsPage'));
const PrintHelpPage = lazy(() => import('../pages/PrintHelpPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));

function Loading() {
  return (
    <div role="status" className="p-8 text-muted">
      Loading…
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppearanceSync />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="find" element={<FinderPage />} />
            <Route path="design" element={<PickPage />} />
            <Route path="design/:familyId" element={<DesignerPage />} />
            <Route path="calibrate" element={<CalibratePage />} />
            <Route path="learn" element={<LearnPage />} />
            <Route path="limits" element={<LimitsPage />} />
            <Route path="print-help" element={<PrintHelpPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
