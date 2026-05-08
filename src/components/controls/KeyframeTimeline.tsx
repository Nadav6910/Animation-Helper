import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Wand2, X } from 'lucide-react';
import { useAnimationStore } from '@/store/animationStore';
import { EASING_PRESETS, easingToCss } from '@/lib/easings';
import { easingDescription } from './BezierEditor';
import { cn } from '@/lib/cn';
import type { Easing } from '@/types/animation';

export function KeyframeTimeline() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const keyframes = useAnimationStore((s) => s.config.keyframes);
  const selectedId = useAnimationStore((s) => s.selectedKeyframeId);
  const select = useAnimationStore((s) => s.selectKeyframe);
  const add = useAnimationStore((s) => s.addKeyframe);
  const remove = useAnimationStore((s) => s.removeKeyframe);
  const update = useAnimationStore((s) => s.updateKeyframe);

  const sorted = [...keyframes].sort((a, b) => a.at - b.at);

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    if ((e.target as HTMLElement).closest('[data-handle]')) return;
    const at = ((e.clientX - rect.left) / rect.width) * 100;
    add(Math.round(Math.max(0, Math.min(100, at))));
  };

  const dragHandle = (id: string, ev: React.PointerEvent) => {
    ev.preventDefault();
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    select(id);
    const move = (e: PointerEvent) => {
      const at = Math.round(
        Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
      );
      update(id, { at });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-fg-muted">
        <span className="font-medium">Keyframes</span>
        <span className="text-fg-subtle">click track to add</span>
      </div>

      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="relative h-12 rounded-xl border border-border/70 bg-bg-soft cursor-copy overflow-hidden"
      >
        <div className="absolute inset-0 flex">
          {[0, 25, 50, 75, 100].map((t) => (
            <div
              key={t}
              className="relative h-full"
              style={{ width: `${t === 100 ? 0 : 25}%` }}
            >
              <span className="absolute right-0 top-1 text-[10px] text-fg-subtle/70 tabular-nums px-1">
                {t}%
              </span>
              <span className="absolute right-0 inset-y-0 w-px bg-border/60" />
            </div>
          ))}
        </div>
        <AnimatePresence>
          {sorted.map((k) => {
            const active = selectedId === k.id;
            return (
              <motion.button
                key={k.id}
                data-handle
                type="button"
                onPointerDown={(e) => dragHandle(k.id, e)}
                onClick={(e) => {
                  e.stopPropagation();
                  select(k.id);
                }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                className={cn(
                  'absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 rounded-md rotate-45 border-2 cursor-grab focus-ring transition-colors',
                  active
                    ? 'bg-accent border-accent shadow-glow'
                    : 'bg-bg-panel border-border-strong hover:border-accent/60'
                )}
                style={{ left: `${k.at}%` }}
                aria-label={`Keyframe at ${k.at}%`}
                aria-pressed={active}
              />
            );
          })}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap gap-1.5 items-center">
        {sorted.map((k) => {
          const active = selectedId === k.id;
          return (
            <div key={k.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => select(k.id)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs tabular-nums transition-colors focus-ring',
                  active
                    ? 'bg-accent/15 border-accent/50 text-fg shadow-glow'
                    : 'bg-bg-soft border-border/70 text-fg-muted hover:text-fg hover:border-border-strong'
                )}
              >
                {k.at}%
              </button>
              <PerKeyframeEasingChip
                easing={k.easing}
                onChange={(easing) => update(k.id, { easing })}
              />
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => add()}
          aria-label="Add keyframe"
          className="ml-auto rounded-full border border-border/70 bg-bg-soft p-1.5 text-fg-muted hover:text-fg hover:border-border-strong focus-ring"
        >
          <Plus size={14} />
        </button>
        {keyframes.length > 2 && (
          <button
            type="button"
            onClick={() => remove(selectedId)}
            aria-label="Remove selected keyframe"
            className="rounded-full border border-border/70 bg-bg-soft p-1.5 text-fg-muted hover:text-red-400 hover:border-red-400/50 focus-ring"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function PerKeyframeEasingChip({
  easing,
  onChange,
}: {
  easing?: Easing;
  onChange: (e: Easing | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={easing ? `Easing: ${easingToCss(easing)}` : 'Inherits global easing'}
        className={cn(
          'grid h-6 w-6 place-items-center rounded-full border focus-ring transition-colors',
          easing
            ? 'bg-accent/15 border-accent/50 text-fg'
            : 'bg-bg-soft border-border/70 text-fg-subtle hover:text-fg'
        )}
      >
        <Wand2 size={11} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-40 mt-2 w-56 rounded-xl border border-border/70 bg-bg-panel/95 p-2 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between px-1 py-1">
              <span className="text-[11px] font-semibold text-fg">
                Per-keyframe easing
              </span>
              {easing && (
                <button
                  type="button"
                  onClick={() => {
                    onChange(undefined);
                    setOpen(false);
                  }}
                  className="grid h-5 w-5 place-items-center rounded-full text-fg-subtle hover:text-fg focus-ring"
                  aria-label="Clear easing"
                >
                  <X size={11} />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1 px-1 pt-1 pb-1">
              {EASING_PRESETS.map(({ name, value }) => {
                const active =
                  easing &&
                  ((value.kind === 'preset' &&
                    easing.kind === 'preset' &&
                    value.value === easing.value) ||
                    (value.kind === 'cubic' &&
                      easing.kind === 'cubic' &&
                      value.v.every((n, i) => Math.abs(n - easing.v[i]) < 0.001)));
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      onChange(value);
                      setOpen(false);
                    }}
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[10px] focus-ring transition-colors',
                      active
                        ? 'bg-accent/15 border-accent/50 text-fg'
                        : 'bg-bg-soft border-border/70 text-fg-muted hover:text-fg'
                    )}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
            <div className="border-t border-border/40 mt-1 pt-1.5 px-1 text-[10px] text-fg-subtle">
              {easing ? easingDescription(easing) : 'Inherits the global easing'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
