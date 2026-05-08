import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Command, Keyboard } from 'lucide-react';

const SEEN_KEY = 'ah:onboarded';

export function OnboardingHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seen = window.localStorage.getItem(SEEN_KEY);
    if (!seen) {
      const t = window.setTimeout(() => setShow(true), 600);
      return () => window.clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    try {
      window.localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 12, opacity: 0, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border border-accent/40 bg-bg-panel/95 p-4 shadow-glow backdrop-blur-xl"
          role="dialog"
        >
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/20 text-accent">
              <Sparkles size={18} />
            </span>
            <div className="flex-1">
              <div className="text-sm font-semibold text-fg">Welcome — quick tips</div>
              <ul className="mt-2 flex flex-col gap-1.5 text-xs text-fg-muted">
                <li className="flex items-center gap-2">
                  <Sparkles size={12} className="text-accent" />
                  Pick a preset to start, or hit “Surprise me”
                </li>
                <li className="flex items-center gap-2">
                  <Command size={12} className="text-accent" />
                  Cmd / Ctrl + K opens the command palette
                </li>
                <li className="flex items-center gap-2">
                  <Keyboard size={12} className="text-accent" />
                  Press <kbd className="rounded border border-border/70 bg-bg-soft px-1 font-mono text-[10px]">?</kbd> to see all shortcuts
                </li>
              </ul>
              <button
                type="button"
                onClick={dismiss}
                className="mt-3 h-7 rounded-lg bg-accent px-3 text-xs font-semibold text-accent-contrast hover:opacity-90 focus-ring"
              >
                Got it
              </button>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="grid h-6 w-6 place-items-center rounded-full text-fg-muted hover:text-fg focus-ring"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
