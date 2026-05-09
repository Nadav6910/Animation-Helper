import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Film, Loader2, X } from 'lucide-react';
import { useAnimationStore } from '@/store/animationStore';
import { useUiStore } from '@/store/uiStore';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { totalDuration, formatTime } from '@/lib/timing';
import { cn } from '@/lib/cn';
import {
  recordPreview,
  RecorderAbortError,
  type RecordFormat,
  type RecordOptions,
} from '@/lib/recorder';

type FormatChoice = { value: RecordFormat; label: string; hint: string };

const FORMATS: FormatChoice[] = [
  { value: 'mp4', label: 'MP4', hint: 'H.264 video — Slack / Figma / slides' },
  { value: 'webm', label: 'WebM', hint: 'VP9, smaller file, supports transparency' },
  { value: 'gif', label: 'GIF', hint: 'Universal compatibility, larger file' },
];

const FRAMERATES = [24, 30, 60] as const;

type Resolution = { value: number | 'auto'; label: string };
const RESOLUTIONS: Resolution[] = [
  { value: 'auto', label: 'Preview size' },
  { value: 512, label: '512 px' },
  { value: 1024, label: '1024 px' },
];

type Background =
  | { kind: 'transparent'; label: string }
  | { kind: 'solid'; label: string; color: string };

const BACKGROUNDS: Background[] = [
  { kind: 'transparent', label: 'Transparent' },
  { kind: 'solid', label: 'Black', color: '#000000' },
  { kind: 'solid', label: 'White', color: '#ffffff' },
  { kind: 'solid', label: 'Stage', color: '#0b0b14' },
];

const ITERATIONS = [1, 2, 5] as const;

function backgroundFor(
  format: RecordFormat,
  bg: Background
): string | null {
  if (bg.kind === 'solid') return bg.color;
  // MP4 (H.264) doesn't carry alpha — fall back to a solid black so the
  // user isn't surprised by a black background after export.
  if (format === 'mp4') return '#000000';
  return null;
}

export function ExportModal() {
  const open = useUiStore((s) => s.exportOpen);
  const setOpen = useUiStore((s) => s.setExportOpen);
  const targetClassName = useUiStore((s) => s.previewTargetClassName);
  const config = useAnimationStore((s) => s.config);
  const showToast = useUiStore((s) => s.showToast);

  const [format, setFormat] = useState<RecordFormat>('webm');
  const [fps, setFps] = useState<(typeof FRAMERATES)[number]>(30);
  const [resolution, setResolution] = useState<Resolution['value']>('auto');
  const [background, setBackground] = useState<Background>(BACKGROUNDS[0]);
  const [iterations, setIterations] =
    useState<(typeof ITERATIONS)[number]>(1);

  const [recording, setRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  useFocusTrap(dialogRef, open, closeRef);

  // Reset transient state every time the modal opens.
  useEffect(() => {
    if (!open) return;
    setProgress(0);
    setError(null);
  }, [open]);

  // Abort an in-flight recording ONLY when the component unmounts.
  // Earlier this was bundled into the open-effect's cleanup, which
  // meant React 18 StrictMode (and any toggle of `open`) tore down
  // the AbortController out from under the user — clicking Record
  // immediately after open could land on a controller that had
  // already been aborted by StrictMode's double-invoke. Now the
  // controller's lifecycle is bound to the component, not the
  // open/close cycle.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  // Esc closes (in addition to focus-trap arrow handling).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !recording) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, recording, setOpen]);

  const totalMs = useMemo(() => totalDuration(config), [config]);
  const estDurationMs = totalMs * iterations;
  const estFrames = Math.max(1, Math.round((estDurationMs / 1000) * fps));

  const startRecord = useCallback(async () => {
    setError(null);
    if (!targetClassName) {
      setError('Preview not ready yet — try again in a moment.');
      return;
    }
    const el = document.querySelector<HTMLElement>(`.${targetClassName}`);
    if (!el) {
      setError('Could not find the preview element.');
      return;
    }
    const animations = el.getAnimations();
    const anim = animations.find(
      (a) =>
        (a as Animation & { animationName?: string }).animationName?.startsWith(
          'ah-anim-'
        )
    );
    if (!anim) {
      setError('No live animation to record.');
      return;
    }

    const ac = new AbortController();
    abortRef.current = ac;
    setRecording(true);
    setProgress(0);

    const rect = el.getBoundingClientRect();
    const widthHeight: { width?: number; height?: number } =
      resolution === 'auto'
        ? {
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          }
        : {
            width: resolution,
            height: resolution,
          };

    const opts: RecordOptions = {
      format,
      fps,
      iterations,
      background: backgroundFor(format, background),
      onProgress: setProgress,
      signal: ac.signal,
      ...widthHeight,
    };

    try {
      const result = await recordPreview(el, anim, config, opts);
      // Trigger the download with the same deferred-revoke trick CodePanel
      // uses for text exports.
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      showToast(
        `Exported ${result.filename} (${result.frameCount} frames)`,
        'info'
      );
      setOpen(false);
    } catch (err) {
      if (err instanceof RecorderAbortError) {
        // Silent — user cancelled.
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      }
    } finally {
      setRecording(false);
      abortRef.current = null;
    }
  }, [
    targetClassName,
    config,
    format,
    fps,
    iterations,
    resolution,
    background,
    setOpen,
    showToast,
  ]);

  const cancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setRecording(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[105] grid place-items-center bg-bg/70 backdrop-blur-md p-4"
          onClick={() => !recording && setOpen(false)}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={{ y: 14, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="w-full max-w-md rounded-2xl border border-border/70 bg-bg-panel/95 shadow-2xl backdrop-blur-xl overflow-hidden focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <Film size={16} className="text-accent" aria-hidden />
                <h2 id={titleId} className="text-sm font-semibold text-fg">
                  Export as video / GIF
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => !recording && setOpen(false)}
                disabled={recording}
                className="grid h-6 w-6 place-items-center rounded-full text-fg-muted hover:text-fg focus-ring disabled:opacity-30"
                aria-label="Close export modal"
              >
                <X size={14} />
              </button>
            </div>

            <div className="px-4 py-3 flex flex-col gap-3.5">
              <Field label="Format">
                <ChipGroup
                  options={FORMATS.map((f) => ({
                    label: f.label,
                    value: f.value,
                    hint: f.hint,
                  }))}
                  value={format}
                  onChange={(v) => setFormat(v as RecordFormat)}
                  disabled={recording}
                />
              </Field>

              <Field label="Framerate">
                <ChipGroup
                  options={FRAMERATES.map((f) => ({
                    label: `${f} fps`,
                    value: f,
                  }))}
                  value={fps}
                  onChange={(v) =>
                    setFps(v as (typeof FRAMERATES)[number])
                  }
                  disabled={recording}
                />
              </Field>

              <Field label="Resolution">
                <ChipGroup
                  options={RESOLUTIONS.map((r) => ({
                    label: r.label,
                    value: r.value,
                  }))}
                  value={resolution}
                  onChange={(v) =>
                    setResolution(v as Resolution['value'])
                  }
                  disabled={recording}
                />
              </Field>

              <Field label="Background">
                <ChipGroup
                  options={BACKGROUNDS.map((b) => ({
                    label: b.label,
                    value: b.label,
                  }))}
                  value={background.label}
                  onChange={(v) => {
                    const next = BACKGROUNDS.find((b) => b.label === v);
                    if (next) setBackground(next);
                  }}
                  disabled={recording}
                />
                {format === 'mp4' && background.kind === 'transparent' && (
                  <p className="mt-1 text-[10px] text-amber-300">
                    MP4 doesn't carry alpha — transparent will export as black.
                  </p>
                )}
              </Field>

              <Field label="Iterations">
                <ChipGroup
                  options={ITERATIONS.map((i) => ({
                    label: `${i}×`,
                    value: i,
                  }))}
                  value={iterations}
                  onChange={(v) =>
                    setIterations(v as (typeof ITERATIONS)[number])
                  }
                  disabled={recording}
                />
              </Field>

              <div className="rounded-md border border-border/50 bg-bg-soft/50 px-3 py-2 text-[11px] text-fg-muted">
                Will capture <span className="font-semibold text-fg">{estFrames}</span> frames over{' '}
                <span className="font-semibold text-fg">{formatTime(estDurationMs)}</span>.
              </div>

              {recording && (
                <div className="space-y-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-bg-soft">
                    <motion.div
                      className="h-full bg-accent"
                      animate={{ width: `${Math.round(progress * 100)}%` }}
                      transition={{ type: 'spring', stiffness: 240, damping: 30 }}
                    />
                  </div>
                  <div className="text-[10px] text-fg-subtle text-center tabular-nums">
                    {Math.round(progress * 100)}%
                  </div>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="rounded-md border border-rose-500/50 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-300"
                >
                  {error}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-1.5 border-t border-border/60 px-4 py-3">
              {recording ? (
                <button
                  type="button"
                  onClick={cancel}
                  className="h-8 rounded-lg px-3 text-xs text-fg-muted hover:text-fg focus-ring"
                >
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-8 rounded-lg px-3 text-xs text-fg-muted hover:text-fg focus-ring"
                >
                  Close
                </button>
              )}
              <button
                type="button"
                onClick={startRecord}
                disabled={recording || !targetClassName}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold focus-ring transition-colors',
                  recording || !targetClassName
                    ? 'bg-accent/40 text-accent-contrast cursor-not-allowed'
                    : 'bg-accent text-accent-contrast hover:opacity-90'
                )}
              >
                {recording ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Recording…
                  </>
                ) : (
                  <>
                    <Download size={12} />
                    Record
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-fg-subtle font-semibold">
        {label}
      </span>
      {children}
    </div>
  );
}

function ChipGroup<T extends string | number>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { label: string; value: T; hint?: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" className="flex flex-wrap gap-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            title={o.hint}
            className={cn(
              'h-7 rounded-md border px-2.5 text-xs focus-ring transition-colors',
              active
                ? 'bg-accent/15 border-accent/50 text-fg'
                : 'bg-bg-soft border-border/70 text-fg-muted hover:text-fg',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
