import { Component, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

/**
 * Top-level error boundary for the entire app. The most common
 * production trigger is React's Suspense throwing a `ChunkLoadError`
 * when a lazy chunk's hash changed underneath an already-loaded tab —
 * exactly what happens during a deploy window.
 *
 * The fallback intentionally uses inline styles + a system-font stack
 * rather than depending on Tailwind, the design tokens, or any of
 * our motion / icon libs, so it renders cleanly even when the lazy
 * chunks failed to load AND when the global stylesheet itself didn't
 * make it (e.g. the `index-*.css` link 404'd post-deploy). Visually
 * it still wears the brand: same dark background, gradient mesh,
 * gradient title, accent-colour CTA.
 *
 * Class component is required — `componentDidCatch` /
 * `getDerivedStateFromError` are not exposed to function components
 * even in React 19.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error): void {
    // eslint-disable-next-line no-console
    console.error('App-level error caught by ErrorBoundary:', error);
  }

  reload = (): void => {
    window.location.reload();
  };

  hardReload = (): void => {
    // For non-chunk errors a soft reload may not help — the error is
    // probably in the user's persisted state. Clear the SW (so the
    // next visit fetches fresh sw.js + assets) and reload. We don't
    // touch localStorage automatically; the user can do that
    // manually if a corrupted preset is the cause.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .catch(() => undefined)
        .finally(() => window.location.reload());
    } else {
      window.location.reload();
    }
  };

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    const isChunk =
      this.state.error.name === 'ChunkLoadError' ||
      /loading chunk|dynamically imported module|failed to fetch/i.test(
        this.state.error.message
      );

    return (
      <div
        role="alert"
        aria-live="assertive"
        style={{
          position: 'fixed',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          padding: '1.5rem',
          margin: 0,
          background: '#0c0d12',
          color: '#e9e9ee',
          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          textAlign: 'center',
          zIndex: 2147483647,
          overflow: 'hidden',
          isolation: 'isolate',
        }}
      >
        {/* Ambient mood layer — pure CSS radial gradients, no JS, no
            external deps. Mirrors the splash screen so users land on
            something visually consistent even when everything else
            failed. */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(60% 60% at 50% 35%, rgba(124, 92, 255, 0.22), transparent 70%), radial-gradient(40% 50% at 50% 100%, rgba(236, 72, 153, 0.16), transparent 70%)',
            pointerEvents: 'none',
            zIndex: -1,
          }}
        />
        {/* Faint grid mesh, also matches the splash. */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 40px), repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 40px)',
            maskImage:
              'radial-gradient(ellipse at 50% 50%, black 30%, transparent 75%)',
            WebkitMaskImage:
              'radial-gradient(ellipse at 50% 50%, black 30%, transparent 75%)',
            opacity: 0.6,
            pointerEvents: 'none',
            zIndex: -1,
          }}
        />

        <div
          style={{
            position: 'relative',
            maxWidth: 480,
            padding: '2rem 1.75rem',
            border: '1px solid rgba(124, 92, 255, 0.35)',
            borderRadius: 20,
            background: 'rgba(18, 19, 28, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow:
              '0 24px 64px -16px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(124, 92, 255, 0.08) inset',
          }}
        >
          {/* Pulsing icon — single CSS keyframe animation defined
              inline below so we don't depend on any external CSS. */}
          <div
            aria-hidden
            style={{
              width: 72,
              height: 72,
              margin: '0 auto 1.25rem',
              display: 'grid',
              placeItems: 'center',
              borderRadius: 20,
              background:
                'linear-gradient(135deg, rgba(124, 92, 255, 0.3) 0%, rgba(236, 72, 153, 0.3) 100%)',
              animation: 'ah-eb-pulse 2.4s ease-in-out infinite',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="32"
              height="32"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: '#ec4899' }}
            >
              {isChunk ? (
                <>
                  <path d="M21 12a9 9 0 1 1-3.5-7.1" />
                  <path d="M21 4v5h-5" />
                </>
              ) : (
                <>
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                  <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
                </>
              )}
            </svg>
          </div>

          <h1
            style={{
              margin: '0 0 0.625rem',
              fontSize: '1.625rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              backgroundImage:
                'linear-gradient(135deg, #7c5cff 0%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {isChunk ? 'New version available' : 'Something went wrong'}
          </h1>
          <p
            style={{
              margin: '0 0 1.5rem',
              opacity: 0.72,
              fontSize: '0.9375rem',
              lineHeight: 1.55,
            }}
          >
            {isChunk
              ? "We just shipped an update and the page couldn't load the latest module. A reload pulls the fresh build cleanly."
              : "The app hit an unexpected error. Reloading should clear it; if it doesn't, your browser's site data may need a wipe."}
          </p>

          <div
            style={{
              display: 'flex',
              gap: '0.625rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={this.reload}
              style={{
                padding: '0.625rem 1.25rem',
                border: 'none',
                borderRadius: 12,
                backgroundImage:
                  'linear-gradient(135deg, #7c5cff 0%, #ec4899 100%)',
                color: '#fff',
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '-0.005em',
                boxShadow:
                  '0 0 0 1px rgba(255,255,255,0.08) inset, 0 12px 32px -8px rgba(124, 92, 255, 0.5)',
                transition: 'transform 120ms ease, box-shadow 120ms ease',
              }}
              onMouseDown={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform =
                  'scale(0.97)';
              }}
              onMouseUp={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = '';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = '';
              }}
            >
              Reload
            </button>
            {!isChunk && (
              <button
                type="button"
                onClick={this.hardReload}
                style={{
                  padding: '0.625rem 1.25rem',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)',
                  color: '#e9e9ee',
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Hard reset & reload
              </button>
            )}
          </div>

          {/* No raw error message exposed — full details are logged
              to console for devs via componentDidCatch above. The
              user gets a friendly recovery flow, not a stack trace. */}
        </div>

        {/* Inline keyframes — keeps the boundary self-sufficient
            even when the global stylesheet failed to load. */}
        <style>{`
          @keyframes ah-eb-pulse {
            0%, 100% { transform: scale(1); opacity: 0.9; }
            50%      { transform: scale(1.05); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }
}
