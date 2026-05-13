import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Copy } from 'lucide-react';
import { useAnimationStore } from '@/store/animationStore';
import { useUiStore } from '@/store/uiStore';
import {
  EASING_PRESETS,
  easingToCss,
  easingToCubicPreview,
  parseEasing,
} from '@/lib/easings';
import { BezierEditor, easingDescription } from './BezierEditor';
import { CurveThumbnail } from '@/components/ui/CurveThumbnail';
import { NumberInput } from '@/components/ui/NumberInput';
import { copyToClipboard } from '@/lib/clipboard';
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
              const previewCurve = easingToCubicPreview(value);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setEasing(value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors focus-ring',
                    active
                      ? 'bg-accent/15 border-accent/50 text-fg shadow-glow'
                      : 'bg-bg-soft border-border/70 text-fg-muted hover:border-border-strong hover:text-fg'
                  )}
                >
                  {previewCurve && <CurveThumbnail value={previewCurve} />}
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
            <CubicPasteInput
              onApply={(v) => setEasing({ kind: 'cubic', v })}
            />
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

function CubicPasteInput({
  onApply,
}: {
  onApply: (v: [number, number, number, number]) => void;
}) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Set briefly by the Escape handler before triggering blur — the
  // subsequent onBlur reads this and skips its submit() call. Without
  // the guard, Escape-then-blur would still run submit() and rely on
  // the empty-string short-circuit, which works today but only
  // incidentally.
  const cancelNextBlur = useRef(false);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError(null);
      return;
    }
    const parsed = parseEasing(trimmed);
    if (parsed && parsed.kind === 'cubic') {
      onApply(parsed.v);
      setText('');
      setError(null);
      return;
    }
    // Non-cubic parses (presets, steps) are rejected here on purpose:
    // accepting them silently would change the easing kind out from
    // under the cubic tab, leaving the editor showing a stale curve.
    setError(
      'Need a cubic-bezier value, e.g. cubic-bezier(0.4, 0, 0.2, 1) or 0.4, 0, 0.2, 1'
    );
  };

  return (
    <div className="flex flex-col gap-1">
      <input
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="Paste cubic-bezier(...) or 0.4, 0, 0.2, 1"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (error) setError(null);
        }}
        onBlur={() => {
          if (cancelNextBlur.current) {
            cancelNextBlur.current = false;
            return;
          }
          submit();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          } else if (e.key === 'Escape') {
            cancelNextBlur.current = true;
            setText('');
            setError(null);
            (e.target as HTMLInputElement).blur();
          }
        }}
        aria-label="Paste cubic-bezier value"
        aria-invalid={error !== null}
        aria-errormessage={error ? 'bezier-paste-error' : undefined}
        aria-describedby={error ? 'bezier-paste-error' : undefined}
        className={cn(
          'h-8 rounded-lg border bg-bg-soft px-3 text-xs font-mono outline-none transition-colors focus-ring',
          error
            ? 'border-red-500/60'
            : 'border-border/70 focus:border-accent/60'
        )}
      />
      {error && (
        <span
          id="bezier-paste-error"
          role="alert"
          className="text-[10px] text-red-400"
        >
          {error}
        </span>
      )}
    </div>
  );
}

function CurrentEasingHint({ easing }: { easing: Easing }) {
  const showToast = useUiStore((s) => s.showToast);
  const [justCopied, setJustCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  // Clear the pending check-icon timer on unmount so we don't call
  // setJustCopied on a stale component if the user copies and then
  // navigates away within 1.5s.
  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const onCopy = async () => {
    const css = easingToCss(easing);
    const ok = await copyToClipboard(css);
    if (ok) {
      // Match the phrasing of the app's primary copy paths (CodePanel,
      // CopyButton) — short, action-past-tense — so the toast stream
      // reads consistently regardless of which copy affordance the user
      // hit. The CSS value isn't echoed here because it's already
      // visible right next to the button.
      showToast('Easing copied to clipboard');
      setJustCopied(true);
      // Reset the checkmark affordance after a beat. Tracked in a ref
      // so a second copy click before the timer fires doesn't leave a
      // stale timer dangling.
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        setJustCopied(false);
        copyTimerRef.current = null;
      }, 1500);
    } else {
      showToast('Clipboard unavailable', 'error');
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-bg-soft/50 px-3 py-1.5">
      <ChevronDown size={14} className="text-fg-subtle rotate-[-90deg]" />
      <span className="text-[11px] text-fg-subtle">Active</span>
      <span className="ml-auto font-mono text-[11px] text-fg-muted">
        {easingDescription(easing)}
      </span>
      <button
        type="button"
        onClick={onCopy}
        aria-label={`Copy ${easingToCss(easing)} to clipboard`}
        title="Copy easing as CSS"
        className="grid h-5 w-5 place-items-center rounded text-fg-subtle hover:bg-bg-panel hover:text-fg focus-ring transition-colors"
      >
        {justCopied ? (
          <Check size={12} className="text-emerald-400" />
        ) : (
          <Copy size={12} />
        )}
      </button>
    </div>
  );
}
