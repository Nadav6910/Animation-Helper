import { useEffect, useId, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { modKeyLabel, SHIFT_LABEL } from '@/lib/platform';

type Row = { keys: string[]; label: string };

// Keys are looked up from a small registry so we can platform-swap ⌘ for
// Ctrl on non-Mac users at render time.
const buildSections = (mod: string): { title: string; rows: Row[] }[] => [
  {
    title: 'General',
    rows: [
      { keys: ['?'], label: 'Show keyboard shortcuts' },
      { keys: [mod, 'K'], label: 'Open command palette' },
      { keys: ['Esc'], label: 'Close any overlay' },
    ],
  },
  {
    title: 'Editor',
    rows: [
      { keys: [mod, 'Z'], label: 'Undo' },
      { keys: [mod, SHIFT_LABEL, 'Z'], label: 'Redo' },
      { keys: ['R'], label: 'Reset everything' },
    ],
  },
  {
    title: 'Preview',
    rows: [
      { keys: ['Space'], label: 'Replay animation' },
      { keys: ['C'], label: 'Copy code' },
    ],
  },
];

export function ShortcutsOverlay() {
  const open = useUiStore((s) => s.shortcutsOpen);
  const setOpen = useUiStore((s) => s.setShortcutsOpen);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  useFocusTrap(dialogRef, open, closeBtnRef);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName ?? '';
      const inField =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        (e.target as HTMLElement | null)?.isContentEditable;
      // Don't open the shortcuts overlay on top of the command palette —
      // pick one modal at a time so focus / aria don't collide.
      const ui = useUiStore.getState();
      if (
        e.key === '?' &&
        !inField &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !ui.paletteOpen
      ) {
        e.preventDefault();
        setOpen(!ui.shortcutsOpen);
      } else if (e.key === 'Escape' && ui.shortcutsOpen) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setOpen]);

  const sections = buildSections(modKeyLabel());

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[90] grid place-items-center bg-bg/70 backdrop-blur-md p-4"
          onClick={() => setOpen(false)}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={{ y: 12, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="w-full max-w-md rounded-2xl border border-border/70 bg-bg-panel/95 shadow-2xl backdrop-blur-xl overflow-hidden focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <h2 id={titleId} className="text-sm font-semibold text-fg">
                Keyboard shortcuts
              </h2>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-6 w-6 place-items-center rounded-full text-fg-muted hover:text-fg focus-ring"
                aria-label="Close keyboard shortcuts"
              >
                <X size={14} />
              </button>
            </div>
            <div className="px-4 py-3 flex flex-col gap-4">
              {sections.map((s) => (
                <div key={s.title}>
                  <div className="text-[11px] uppercase tracking-wider text-fg-subtle font-semibold mb-1.5">
                    {s.title}
                  </div>
                  <div className="flex flex-col gap-1">
                    {s.rows.map((r) => (
                      <div key={r.label} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-fg-muted">{r.label}</span>
                        <div className="flex items-center gap-1">
                          {r.keys.map((k) => (
                            <kbd
                              key={k}
                              className="grid h-6 min-w-[24px] place-items-center rounded-md border border-border/70 bg-bg-soft px-1.5 text-[11px] font-mono text-fg"
                            >
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
