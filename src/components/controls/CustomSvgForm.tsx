import { useId, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { useCustomPathsStore } from '@/store/customPathsStore';
import { useAnimationStore } from '@/store/animationStore';
import { isSafePathD } from '@/lib/svgPathSafety';

export function CustomSvgForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const add = useCustomPathsStore((s) => s.add);
  const setSvgPath = useAnimationStore((s) => s.setSvgPath);
  const [label, setLabel] = useState('');
  const [d, setD] = useState('');
  const [viewBox, setViewBox] = useState('0 0 24 24');
  const [error, setError] = useState<string | null>(null);

  const labelId = useId();
  const viewBoxId = useId();
  const dId = useId();
  const errorId = useId();

  const submit = () => {
    setError(null);
    const trimmed = d.trim();
    if (!trimmed) {
      setError('Path data is required');
      return;
    }
    if (!isSafePathD(trimmed)) {
      setError('Path contains characters that are not valid SVG path commands');
      return;
    }
    const entry = add({
      label: label.trim() || 'Custom path',
      d: trimmed,
      viewBox: viewBox.trim() || '0 0 24 24',
    });
    setSvgPath(entry.id);
    setLabel('');
    setD('');
    setViewBox('0 0 24 24');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="overflow-hidden"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="rounded-xl border border-border/70 bg-bg-soft/60 p-3 mt-2"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-fg">Add custom SVG path</span>
              <button
                type="button"
                onClick={onClose}
                className="grid h-5 w-5 place-items-center rounded-full text-fg-muted hover:text-fg focus-ring"
                aria-label="Close"
              >
                <X size={12} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor={labelId}
                  className="text-[10px] uppercase tracking-wider text-fg-subtle"
                >
                  Name
                </label>
                <input
                  id={labelId}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Custom path"
                  className="h-8 rounded-lg border border-border/70 bg-bg-panel px-2.5 text-sm focus-ring"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor={viewBoxId}
                  className="text-[10px] uppercase tracking-wider text-fg-subtle"
                >
                  viewBox
                </label>
                <input
                  id={viewBoxId}
                  value={viewBox}
                  onChange={(e) => setViewBox(e.target.value)}
                  placeholder="0 0 24 24"
                  className="h-8 rounded-lg border border-border/70 bg-bg-panel px-2.5 text-xs font-mono focus-ring"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor={dId}
                className="text-[10px] uppercase tracking-wider text-fg-subtle"
              >
                Path data (d=)
              </label>
              <textarea
                id={dId}
                value={d}
                onChange={(e) => setD(e.target.value)}
                placeholder="M5 12.5 L10 17.5 L19 7"
                rows={3}
                aria-invalid={error !== null}
                aria-describedby={error ? errorId : undefined}
                className="w-full rounded-lg border border-border/70 bg-bg-panel px-2.5 py-2 text-xs font-mono focus-ring"
              />
            </div>
            {error && (
              <div
                id={errorId}
                role="alert"
                aria-live="polite"
                className="mt-1.5 text-[11px] text-rose-400"
              >
                {error}
              </div>
            )}
            <div className="flex items-center justify-end gap-1.5 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="h-7 rounded-lg px-2.5 text-xs text-fg-muted hover:text-fg focus-ring"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-semibold text-accent-contrast hover:opacity-90 focus-ring"
              >
                <Plus size={12} /> Add
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
