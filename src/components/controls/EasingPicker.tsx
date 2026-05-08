import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useAnimationStore } from '@/store/animationStore';
import { EASING_PRESETS } from '@/lib/easings';
import { BezierEditor, easingDescription } from './BezierEditor';
import { NumberInput } from '@/components/ui/NumberInput';
import { cn } from '@/lib/cn';
import type { Easing, StepsJump } from '@/types/animation';
import { DEFAULT_SPRING, springToCubic, type SpringConfig } from '@/lib/spring';

type Tab = 'presets' | 'cubic' | 'steps' | 'spring';

const STEPS_JUMPS: StepsJump[] = ['start', 'end', 'none', 'both'];

export function EasingPicker() {
  const easing = useAnimationStore((s) => s.config.easing);
  const setEasing = useAnimationStore((s) => s.setEasing);
  const [tab, setTab] = useState<Tab>(
    easing.kind === 'cubic'
      ? 'cubic'
      : easing.kind === 'steps'
        ? 'steps'
        : 'presets'
  );
  const [spring, setSpring] = useState<SpringConfig>(DEFAULT_SPRING);

  const isPresetActive = (e: Easing): boolean => {
    if (e.kind !== easing.kind) return false;
    if (e.kind === 'preset' && easing.kind === 'preset') return e.value === easing.value;
    if (e.kind === 'cubic' && easing.kind === 'cubic') {
      return e.v.every((n, i) => Math.abs(n - easing.v[i]) < 0.001);
    }
    return false;
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-stretch rounded-lg border border-border/70 bg-bg-soft overflow-hidden h-7">
        {([
          ['presets', 'Presets'],
          ['cubic', 'Cubic'],
          ['steps', 'Steps'],
          ['spring', 'Spring'],
        ] as const).map(([k, label]) => {
          const active = tab === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={cn(
                'flex-1 text-xs transition-colors focus-ring',
                active ? 'bg-accent/15 text-fg' : 'text-fg-muted hover:text-fg'
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'presets' && (
          <motion.div
            key="presets"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="flex flex-wrap gap-1.5"
          >
            {EASING_PRESETS.map(({ name, value }) => {
              const active = isPresetActive(value);
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
          </motion.div>
        )}

        {tab === 'cubic' && (
          <motion.div
            key="cubic"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-2"
          >
            <div className="text-[11px] font-mono text-fg-subtle text-center">
              {easingDescription(easing)}
            </div>
            <div className="grid place-items-center">
              <BezierEditor
                value={easing.kind === 'cubic' ? easing.v : [0.4, 0, 0.2, 1]}
                onChange={(v) => setEasing({ kind: 'cubic', v })}
              />
            </div>
          </motion.div>
        )}

        {tab === 'steps' && (
          <motion.div
            key="steps"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-2"
          >
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                size="sm"
                label="Steps"
                value={easing.kind === 'steps' ? easing.n : 6}
                onChange={(n) =>
                  setEasing({
                    kind: 'steps',
                    n: Math.max(1, Math.round(n)),
                    jump: easing.kind === 'steps' ? easing.jump : 'end',
                  })
                }
                min={1}
                max={50}
                step={1}
              />
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-wider text-fg-subtle font-semibold">
                  Jump
                </span>
                <div className="flex items-stretch rounded-lg border border-border/70 bg-bg-soft overflow-hidden h-8">
                  {STEPS_JUMPS.map((j) => {
                    const current =
                      easing.kind === 'steps' ? easing.jump : 'end';
                    const active = current === j;
                    return (
                      <button
                        key={j}
                        type="button"
                        onClick={() =>
                          setEasing({
                            kind: 'steps',
                            n: easing.kind === 'steps' ? easing.n : 6,
                            jump: j,
                          })
                        }
                        className={cn(
                          'flex-1 text-[11px] transition-colors focus-ring',
                          active ? 'bg-accent/15 text-fg' : 'text-fg-muted hover:text-fg'
                        )}
                      >
                        {j}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="text-[11px] text-fg-subtle">
              Outputs <code className="font-mono">{easingDescription(easing.kind === 'steps' ? easing : { kind: 'steps', n: 6, jump: 'end' })}</code>
            </div>
          </motion.div>
        )}

        {tab === 'spring' && (
          <motion.div
            key="spring"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-2"
          >
            <div className="grid grid-cols-3 gap-2">
              <NumberInput
                size="sm"
                label="Stiffness"
                value={spring.stiffness}
                onChange={(v) => setSpring((s) => ({ ...s, stiffness: v }))}
                min={20}
                max={500}
                step={10}
              />
              <NumberInput
                size="sm"
                label="Damping"
                value={spring.damping}
                onChange={(v) => setSpring((s) => ({ ...s, damping: v }))}
                min={1}
                max={50}
                step={1}
              />
              <NumberInput
                size="sm"
                label="Mass"
                value={spring.mass}
                onChange={(v) => setSpring((s) => ({ ...s, mass: v }))}
                min={0.1}
                max={5}
                step={0.1}
              />
            </div>
            <button
              type="button"
              onClick={() =>
                setEasing({ kind: 'cubic', v: springToCubic(spring) })
              }
              className="h-8 rounded-lg bg-accent text-accent-contrast text-xs font-semibold focus-ring hover:opacity-90"
            >
              Apply spring · approximated as cubic-bezier
            </button>
            <div className="text-[11px] text-fg-subtle text-center">
              Tip: Framer Motion output preserves the real spring config; CSS / Tailwind use the bezier approximation.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CurrentEasingHint easing={easing} />
    </div>
  );
}

function CurrentEasingHint({ easing }: { easing: Easing }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-bg-soft/50 px-3 py-1.5">
      <ChevronDown size={14} className="text-fg-subtle rotate-[-90deg]" />
      <span className="text-[11px] text-fg-subtle">Active</span>
      <span className="ml-auto font-mono text-[11px] text-fg-muted">
        {easingDescription(easing)}
      </span>
    </div>
  );
}
