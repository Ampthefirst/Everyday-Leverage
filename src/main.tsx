import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/atkinson-hyperlegible-mono/400.css';
import '@fontsource/atkinson-hyperlegible-mono/700.css';
import '@fontsource/vt323/400.css';
import './styles/index.css';
import { App } from './app/App';

// Offline support (production only; dev uses Vite's live server).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
