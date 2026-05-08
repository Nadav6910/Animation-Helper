import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
        className="relative h-10 rounded-xl border border-border/70 bg-bg-soft cursor-copy"
      >
        {/* tick lines (no labels — labels are below) */}
        {[25, 50, 75].map((t) => (
          <span
            key={t}
            className="absolute inset-y-0 w-px bg-border/40"
            style={{ left: `${t}%` }}
          />
        ))}
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
                  'absolute top-1/2 h-6 w-6 rounded-md border-2 cursor-grab focus-ring transition-colors',
                  active
                    ? 'bg-accent border-accent shadow-glow'
                    : 'bg-bg-panel border-border-strong hover:border-accent/60'
                )}
                // left: ${at}% positions the anchor; translateX(-at%) of the
                // diamond's own width keeps it inside the track — at 0 it's
                // flush-left, at 100 it's flush-right, smoothly interpolated.
                // translateY(-50%) handles vertical centring; rotate=45 is
                // the visual rotation. All composed via Motion's individual
                // transform props so the entrance scale/opacity still works.
                style={{
                  left: `${k.at}%`,
                  x: `${-k.at}%`,
                  y: '-50%',
                  rotate: 45,
                }}
                aria-label={`Keyframe at ${k.at}%`}
                aria-pressed={active}
              />
            );
          })}
        </AnimatePresence>
      </div>
      <div className="relative h-3 -mt-1 select-none" aria-hidden>
        {[0, 25, 50, 75, 100].map((t) => (
          <span
            key={t}
            className="absolute top-0 text-[10px] text-fg-subtle/70 tabular-nums"
            style={{
              left: `${t}%`,
              transform:
                t === 0
                  ? 'translateX(0)'
                  : t === 100
                    ? 'translateX(-100%)'
                    : 'translateX(-50%)',
            }}
          >
            {t}%
          </span>
        ))}
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
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Recompute position whenever the popover opens or the viewport changes.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const t = triggerRef.current?.getBoundingClientRect();
      if (!t) return;
      const POP_W = 224;
      const margin = 8;
      let left = t.left + t.width / 2 - POP_W / 2;
      left = Math.max(margin, Math.min(window.innerWidth - POP_W - margin, left));
      const top = t.bottom + 6;
      setPos({ top, left });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  // Click-outside close (covers both portal popover and trigger).
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      )
        return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const popover = (
    <AnimatePresence>
      {open && pos && (
        <motion.div
          ref={popRef}
          initial={{ opacity: 0, y: -4, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed z-[80] w-56 rounded-xl border border-border/70 bg-bg-panel/95 p-2 shadow-2xl backdrop-blur-xl"
          style={{ top: pos.top, left: pos.left }}
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
  );

  return (
    <>
      <button
        ref={triggerRef}
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
      {typeof document !== 'undefined'
        ? createPortal(popover, document.body)
        : null}
    </>
  );
}
