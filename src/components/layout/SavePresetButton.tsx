import { useState, useRef, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimationStore } from '@/store/animationStore';
import { useSavedPresetsStore } from '@/store/savedPresetsStore';
import { IconButton } from '@/components/ui/IconButton';

export function SavePresetButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [justSaved, setJustSaved] = useState(false);
  const popRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const config = useAnimationStore((s) => s.config);
  const save = useSavedPresetsStore((s) => s.save);
  const saved = useSavedPresetsStore((s) => s.saved);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onClick = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const submit = () => {
    save(name || `Untitled ${saved.length + 1}`, config);
    setName('');
    setOpen(false);
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 1200);
  };

  return (
    <div className="relative" ref={popRef}>
      <IconButton
        variant="ghost"
        size="md"
        label={`Save preset (${saved.length} saved)`}
        onClick={() => setOpen((v) => !v)}
      >
        <motion.span
          animate={justSaved ? { scale: [1, 1.4, 1] } : { scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Heart
            size={16}
            fill={justSaved || saved.length > 0 ? 'currentColor' : 'none'}
            className={justSaved ? 'text-rose-400' : ''}
          />
        </motion.span>
      </IconButton>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-border/70 bg-bg-panel/95 p-3 shadow-2xl backdrop-blur-xl"
          >
            <div className="text-xs font-semibold text-fg mb-1.5">
              Save current animation
            </div>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
              placeholder={`Untitled ${saved.length + 1}`}
              className="h-8 w-full rounded-lg border border-border/70 bg-bg-soft px-2.5 text-sm focus-ring"
            />
            <div className="mt-2 flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-7 rounded-lg px-2.5 text-xs text-fg-muted hover:text-fg focus-ring"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                className="h-7 rounded-lg bg-accent px-3 text-xs font-semibold text-accent-contrast hover:opacity-90 focus-ring"
              >
                Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
