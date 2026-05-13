import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, AlertTriangle } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { onSavedPresetsPersistError } from '@/store/savedPresetsStore';
import { onCustomPathsPersistError } from '@/store/customPathsStore';
import { onCustomShapesPersistError } from '@/store/customShapesStore';

/**
 * App-level toast surface. Components dispatch via
 * `useUiStore.getState().showToast(message, tone)` and the toast appears
 * here, dismissing after 3.5s or when a newer toast supersedes it.
 *
 * This component also registers store-level error listeners (e.g. saved-
 * preset persistence failures) so callers don't have to know to wire
 * them themselves.
 */
export function GlobalToast() {
  const toast = useUiStore((s) => s.toast);
  const showToast = useUiStore((s) => s.showToast);

  useEffect(() => {
    const offPresets = onSavedPresetsPersistError(() => {
      showToast(
        "Couldn't save preset — local storage is full or unavailable.",
        'error'
      );
    });
    const offPaths = onCustomPathsPersistError(() => {
      showToast(
        "Couldn't save custom path — local storage is full or unavailable.",
        'error'
      );
    });
    const offShapes = onCustomShapesPersistError(() => {
      showToast(
        "Couldn't save custom shape — local storage is full or unavailable.",
        'error'
      );
    });
    return () => {
      offPresets();
      offPaths();
      offShapes();
    };
  }, [showToast]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ y: 24, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 12, opacity: 0, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 z-[110]"
          role={toast.tone === 'error' ? 'alert' : 'status'}
          aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
        >
          <div
            className={
              'flex items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-glow backdrop-blur-xl ' +
              (toast.tone === 'error'
                ? 'border-rose-500/50 bg-bg-panel/95 text-fg'
                : 'border-accent/40 bg-bg-panel/90 text-fg')
            }
          >
            <span
              className={
                'grid place-items-center h-5 w-5 rounded-full ' +
                (toast.tone === 'error'
                  ? 'bg-rose-500 text-white'
                  : 'bg-accent text-accent-contrast')
              }
              aria-hidden
            >
              {toast.tone === 'error' ? (
                <AlertTriangle size={12} strokeWidth={2.5} />
              ) : (
                <Check size={12} strokeWidth={3} />
              )}
            </span>
            {toast.message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
