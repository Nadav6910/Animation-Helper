import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useAnimationStore } from '@/store/animationStore';
import { EASING_PRESETS } from '@/lib/easings';
import { BezierEditor, easingDescription } from './BezierEditor';
import { cn } from '@/lib/cn';
import type { Easing } from '@/types/animation';

export function EasingPicker() {
  const easing = useAnimationStore((s) => s.config.easing);
  const setEasing = useAnimationStore((s) => s.setEasing);
  const [showCustom, setShowCustom] = useState(easing.kind === 'cubic');

  const isActive = (e: Easing): boolean => {
    if (e.kind !== easing.kind) return false;
    if (e.kind === 'preset' && easing.kind === 'preset') return e.value === easing.value;
    if (e.kind === 'cubic' && easing.kind === 'cubic') {
      return e.v.every((n, i) => Math.abs(n - easing.v[i]) < 0.001);
    }
    return false;
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {EASING_PRESETS.map(({ name, value }) => {
          const active = isActive(value);
          return (
            <button
              key={name}
              type="button"
              onClick={() => setEasing(value)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs transition-colors focus-ring',
                active
                  ? 'bg-accent/15 border-accent/50 text-fg shadow-glow'
                  : 'bg-bg-soft border-border/70 text-fg-muted hover:border-border-strong hover:text-fg'
              )}
            >
              {name}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setShowCustom((v) => !v)}
        className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-bg-soft px-3 py-2 text-xs text-fg-muted hover:text-fg focus-ring"
      >
        <span>Custom cubic-bezier</span>
        <span className="font-mono text-[11px] text-fg-subtle">
          {easingDescription(easing)}
        </span>
        <motion.span
          animate={{ rotate: showCustom ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        >
          <ChevronDown size={14} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {showCustom && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="overflow-hidden"
          >
            <div className="grid place-items-center pt-1">
              <BezierEditor
                value={easing.kind === 'cubic' ? easing.v : [0.4, 0, 0.2, 1]}
                onChange={(v) => setEasing({ kind: 'cubic', v })}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
