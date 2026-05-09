import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Surfaces a "New version available" prompt whenever the PWA service
 * worker has finished installing a fresh build in the background.
 *
 * Pairs with `registerType: 'prompt'` in vite.config.ts: the new SW
 * installs but does not auto-skipWaiting, so the page keeps serving
 * the previously-cached assets until the user explicitly accepts the
 * update. Hitting "Update" calls `updateServiceWorker(true)`, which
 * skipWaitings the new SW and reloads the page so the latest build
 * actually loads instead of staying behind the old in-memory bundle.
 *
 * The toast lives bottom-right so it doesn't collide with the app-
 * level GlobalToast (which is bottom-centre and short-lived). The
 * dismiss `X` lets the user defer; the prompt re-appears next reload.
 */
export function UpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      // Registration failures shouldn't take the app down — log and
      // continue without the prompt UX. (Most common cause: running
      // under http:// in dev with the SW disabled, in which case
      // there's nothing to surface anyway.)
      // eslint-disable-next-line no-console
      console.warn('PWA service worker registration failed:', error);
    },
  });

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          key="pwa-update-toast"
          initial={{ y: 24, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 12, opacity: 0, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="fixed bottom-6 right-6 z-[110] max-w-[calc(100vw-3rem)]"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-accent/40 bg-bg-panel/95 px-4 py-3 shadow-[0_24px_64px_-16px_rgb(0_0_0_/_0.55)] backdrop-blur-xl">
            <span
              aria-hidden
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-accent-contrast shadow-glow"
            >
              <Sparkles size={15} strokeWidth={2.5} />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-fg">
                New version available
              </span>
              <span className="text-[11px] text-fg-muted">
                Refresh to load the latest build.
              </span>
            </div>
            <button
              type="button"
              onClick={() => updateServiceWorker(true)}
              className="ml-2 inline-flex h-8 items-center rounded-lg bg-accent px-3 text-xs font-semibold text-accent-contrast shadow-glow hover:opacity-90 focus-ring"
            >
              Update
            </button>
            <button
              type="button"
              onClick={() => setNeedRefresh(false)}
              aria-label="Dismiss update prompt"
              title="Dismiss"
              className="grid h-7 w-7 place-items-center rounded-full text-fg-muted hover:text-fg focus-ring"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
