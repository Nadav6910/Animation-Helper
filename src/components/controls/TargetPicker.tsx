import { useState } from 'react';
import { Type, Shapes, Spline, Plus, X } from 'lucide-react';
import { useAnimationStore } from '@/store/animationStore';
import { useCustomPathsStore } from '@/store/customPathsStore';
import { Tabs } from '@/components/ui/Tabs';
import { SHAPES } from '@/lib/shapes';
import { SVG_PATHS } from '@/lib/svgPaths';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { CustomSvgForm } from './CustomSvgForm';
import { FontPicker } from './FontPicker';

export function TargetPicker() {
  const config = useAnimationStore((s) => s.config);
  const setTarget = useAnimationStore((s) => s.setTarget);
  const setShape = useAnimationStore((s) => s.setShape);
  const setText = useAnimationStore((s) => s.setText);
  const setSvgPath = useAnimationStore((s) => s.setSvgPath);
  const customPaths = useCustomPathsStore((s) => s.paths);
  const removeCustom = useCustomPathsStore((s) => s.remove);
  const [showCustomForm, setShowCustomForm] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        fullWidth
        value={config.target}
        onChange={(v) => setTarget(v)}
        tabs={[
          { value: 'text', label: 'Text', icon: <Type size={14} /> },
          { value: 'shape', label: 'Shape', icon: <Shapes size={14} /> },
          { value: 'svg', label: 'Path', icon: <Spline size={14} /> },
        ]}
      />

      {config.target === 'text' && (
        <div className="flex flex-col gap-3">
          <textarea
            value={config.text ?? ''}
            onChange={(e) => setText(e.target.value.slice(0, 120))}
            placeholder="Type something to animate"
            rows={2}
            className="w-full resize-none rounded-xl border border-border/70 bg-bg-soft px-3 py-2.5 text-sm focus-ring focus:border-accent/60"
            aria-label="Text to animate"
          />
          <FontPicker />
        </div>
      )}

      {config.target === 'shape' && (
        <div className="grid grid-cols-3 gap-2">
          {SHAPES.map((s) => {
            const active = config.shape === s.kind;
            return (
              <motion.button
                key={s.kind}
                onClick={() => setShape(s.kind)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                className={cn(
                  'group relative aspect-square rounded-xl border bg-bg-soft p-3 focus-ring transition-colors',
                  active
                    ? 'border-accent/60 bg-accent/5 shadow-glow'
                    : 'border-border/70 hover:border-border-strong'
                )}
                aria-pressed={active}
                aria-label={s.label}
              >
                <span
                  className={cn(
                    'block h-full w-full',
                    active
                      ? 'bg-accent'
                      : 'bg-fg-muted/70 group-hover:bg-fg/80 transition-colors'
                  )}
                  style={{
                    clipPath: s.clipPath ?? undefined,
                    borderRadius: s.borderRadius,
                  }}
                />
              </motion.button>
            );
          })}
        </div>
      )}

      {config.target === 'svg' && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2">
            {SVG_PATHS.map((p) => {
              const active = config.svgPath === p.id;
              return (
                <motion.button
                  key={p.id}
                  onClick={() => setSvgPath(p.id)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className={cn(
                    'aspect-square rounded-xl border bg-bg-soft p-3 grid place-items-center focus-ring transition-colors',
                    active
                      ? 'border-accent/60 bg-accent/5 shadow-glow text-accent'
                      : 'border-border/70 text-fg-muted hover:text-fg hover:border-border-strong'
                  )}
                  aria-pressed={active}
                  aria-label={p.label}
                >
                  <svg
                    viewBox={p.viewBox}
                    className="h-full w-full"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={p.d} />
                  </svg>
                </motion.button>
              );
            })}
            {customPaths.map((p) => {
              const active = config.svgPath === p.id;
              return (
                <div key={p.id} className="relative group">
                  <motion.button
                    onClick={() => setSvgPath(p.id)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    className={cn(
                      'aspect-square w-full rounded-xl border bg-bg-soft p-3 grid place-items-center focus-ring transition-colors',
                      active
                        ? 'border-accent/60 bg-accent/5 shadow-glow text-accent'
                        : 'border-border/70 text-fg-muted hover:text-fg hover:border-border-strong'
                    )}
                    aria-pressed={active}
                    aria-label={p.label}
                  >
                    <svg
                      viewBox={p.viewBox}
                      className="h-full w-full"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={p.d} />
                    </svg>
                  </motion.button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCustom(p.id);
                      if (config.svgPath === p.id) setSvgPath('check');
                    }}
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-bg-panel/80 text-fg-muted opacity-0 transition-opacity hover:text-rose-400 focus-ring group-hover:opacity-100"
                    aria-label={`Delete ${p.label}`}
                  >
                    <X size={11} />
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => setShowCustomForm((v) => !v)}
              className={cn(
                'aspect-square rounded-xl border-2 border-dashed bg-bg-soft/50 p-3 grid place-items-center focus-ring transition-colors',
                showCustomForm
                  ? 'border-accent/60 text-accent'
                  : 'border-border/60 text-fg-muted hover:text-fg hover:border-border-strong'
              )}
              aria-label="Add custom SVG path"
              aria-expanded={showCustomForm}
            >
              <Plus size={18} />
            </button>
          </div>
          <CustomSvgForm
            open={showCustomForm}
            onClose={() => setShowCustomForm(false)}
          />
        </div>
      )}
    </div>
  );
}
