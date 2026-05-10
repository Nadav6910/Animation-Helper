import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/globals.css';

// Activate the deferred Google Fonts stylesheet (loaded with
// `media="print"` in index.html so it stayed off the critical
// render path during HTML parse / first paint). Flipping `media`
// to `all` here applies the font without ever using an inline
// `onload=` handler — that pattern violates our CSP. Runs at
// module-init, before React renders, so the swap is effectively
// instant from the user's perspective.
const fontLink = document.getElementById('ah-font-css') as HTMLLinkElement | null;
if (fontLink) fontLink.media = 'all';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
