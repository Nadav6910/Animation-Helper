import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Easing } from '@/types/animation';
import { NumberInput } from '@/components/ui/NumberInput';
import { cn } from '@/lib/cn';

type Props = {
  value: [number, number, number, number];
  onChange: (v: [number, number, number, number]) => void;
};

const SIZE = 200;
const PAD = 16;
// X is clamped to [0,1] so the curve remains a valid cubic-bezier.
// Y is allowed outside [0,1] so users can author overshoot/elastic curves
// (e.g. easeOutBack peaks above 1) without the editor fighting them.
const X_MIN = 0;
const X_MAX = 1;
const Y_MIN = -1.5;
const Y_MAX = 2.5;

// Round dragged / typed values to 3 decimals. Keeps state free of float
// crud (no 0.4000000000000001 artefacts in the generated CSS) without
// losing perceptible precision — 0.001 ≈ 1/5 of a pixel on this editor.
// Normalise `-0` away so JSON-serialised state and CSS output never
// surface a stray minus sign.
const round3 = (n: number) => {
  const r = Math.round(n * 1000) / 1000;
  return r === 0 ? 0 : r;
};
const clampX = (x: number) => Math.max(X_MIN, Math.min(X_MAX, x));
const clampY = (y: number) => Math.max(Y_MIN, Math.min(Y_MAX, y));

export function BezierEditor({ value, onChange }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState<0 | 1 | null>(null);
  const reactId = useId();
  const helpId = `bezier-help-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  // Mirror the latest `value` into a ref so the pointermove closure
  // can read fresh state without re-attaching listeners on every render.
  // Without this, a drag started at render N keeps a snapshot of `value`
  // from that render; if the user types into the OTHER handle's number
  // input mid-drag (rare but possible with finger + keyboard on tablets),
  // the drag would clobber the typed value with the stale snapshot.
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const inner = SIZE - PAD * 2;
  const toPx = (x: number, y: number) => ({
    x: PAD + x * inner,
    y: PAD + (1 - y) * inner,
  });
  const fromPx = (px: number, py: number): [number, number] => {
    const x = (px - PAD) / inner;
    const y = 1 - (py - PAD) / inner;
    return [clampX(x), clampY(y)];
  };

  const setHandle = useCallback(
    (idx: 0 | 1, nx: number, ny: number) => {
      const cx = round3(clampX(nx));
      const cy = round3(clampY(ny));
      const cur = valueRef.current;
      const next: [number, number, number, number] =
        idx === 0 ? [cx, cy, cur[2], cur[3]] : [cur[0], cur[1], cx, cy];
      onChange(next);
    },
    [onChange]
  );

  const p0 = toPx(0, 0);
  const p3 = toPx(1, 1);
  const p1 = toPx(value[0], value[1]);
  const p2 = toPx(value[2], value[3]);

  const handlePointer = (e: React.PointerEvent, idx: 0 | 1) => {
    e.preventDefault();
    setDragging(idx);
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const move = (ev: PointerEvent) => {
      const px = ev.clientX - rect.left;
      const py = ev.clientY - rect.top;
      const [nx, ny] = fromPx(px, py);
      setHandle(idx, nx, ny);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      setDragging(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    // pointercancel fires when the OS yanks the pointer (e.g. iOS context
    // menu, palm rejection). Without it, the drag stays "stuck" with the
    // window listeners still attached.
    window.addEventListener('pointercancel', up);
  };

  const pathD = useMemo(
    () =>
      `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`,
    [p0, p1, p2, p3]
  );

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Spoken once on handle focus via aria-describedby. Kept off the
          visual layout via sr-only so screen-reader users get the
          shortcut hint without sighted users seeing repeated copy. */}
      <span id={helpId} className="sr-only">
        Use arrow keys to nudge the handle. Hold shift for a larger step.
        Press Home or End to snap X to its endpoints.
      </span>
      <div
        ref={wrapRef}
        className="relative select-none"
        style={{ width: SIZE, height: SIZE }}
      >
        <svg width={SIZE} height={SIZE} className="absolute inset-0">
          {/* grid */}
          <rect
            x={PAD}
            y={PAD}
            width={inner}
            height={inner}
            rx={8}
            className="fill-bg-soft stroke-border/70"
          />
          {[0.25, 0.5, 0.75].map((t) => (
            <g key={t} className="stroke-border/40">
              <line x1={PAD} y1={PAD + t * inner} x2={SIZE - PAD} y2={PAD + t * inner} />
              <line x1={PAD + t * inner} y1={PAD} x2={PAD + t * inner} y2={SIZE - PAD} />
            </g>
          ))}
          {/* baseline */}
          <line
            x1={p0.x}
            y1={p0.y}
            x2={p3.x}
            y2={p3.y}
            className="stroke-border-strong/60"
            strokeDasharray="3 4"
          />
          {/* control lines */}
          <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} className="stroke-accent/50" />
          <line x1={p3.x} y1={p3.y} x2={p2.x} y2={p2.y} className="stroke-accent/50" />
          {/* curve */}
          <motion.path
            d={pathD}
            fill="none"
            className="stroke-accent"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          {/* anchors */}
          <circle cx={p0.x} cy={p0.y} r={3} className="fill-fg-subtle" />
          <circle cx={p3.x} cy={p3.y} r={3} className="fill-fg-subtle" />
        </svg>
        {/* Handles. The <button> is the touch / click target (32 px so it
            clears Apple's 24 px and Google's 24-48 px minimums), with a
            smaller visual circle inside so the editor's look doesn't
            change. touch-action:none stops the browser from claiming the
            gesture for scroll / pull-to-refresh while the user is
            dragging — without it, mobile drags feel sticky and short. */}
        {[
          { idx: 0 as const, p: p1, x: value[0], y: value[1] },
          { idx: 1 as const, p: p2, x: value[2], y: value[3] },
        ].map(({ idx, p, x, y }) => (
          <button
            key={idx}
            type="button"
            onPointerDown={(e) => handlePointer(e, idx)}
            onKeyDown={(e) => {
              // Sighted keyboard users get arrow-key nudges; shift
              // multiplies the step by 10 for coarse moves. Screen-reader
              // users typically navigate via the NumberInputs instead —
              // those expose proper number-input semantics and don't
              // require 2D coordinate navigation. Home/End snap X to the
              // endpoints (a no-op for clamp-bounded x but useful for
              // resetting from a dragged interior).
              //
              // stopPropagation is critical: App.tsx has a window-level
              // ArrowLeft/ArrowRight handler that dispatches
              // `ah:scrub-nudge`, which would otherwise fire alongside
              // the handle nudge and scrub the timeline every time the
              // user adjusted X.
              const handled =
                e.key === 'ArrowLeft' ||
                e.key === 'ArrowRight' ||
                e.key === 'ArrowUp' ||
                e.key === 'ArrowDown' ||
                e.key === 'Home' ||
                e.key === 'End';
              if (!handled) return;
              e.preventDefault();
              e.stopPropagation();
              const step = e.shiftKey ? 0.1 : 0.01;
              switch (e.key) {
                case 'ArrowLeft':
                  setHandle(idx, x - step, y);
                  break;
                case 'ArrowRight':
                  setHandle(idx, x + step, y);
                  break;
                case 'ArrowUp':
                  setHandle(idx, x, y + step);
                  break;
                case 'ArrowDown':
                  setHandle(idx, x, y - step);
                  break;
                case 'Home':
                  setHandle(idx, X_MIN, y);
                  break;
                case 'End':
                  setHandle(idx, X_MAX, y);
                  break;
              }
            }}
            // aria-label carries ONLY the current X/Y so screen readers
            // can announce the value succinctly on each nudge. The static
            // shortcut help moves into an off-screen description span
            // (referenced by aria-describedby) so it's spoken once on
            // focus, not every time the value changes.
            aria-label={`Bezier handle ${idx + 1}, X ${x.toFixed(2)}, Y ${y.toFixed(2)}`}
            aria-describedby={helpId}
            aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Shift+ArrowLeft Shift+ArrowRight Shift+ArrowUp Shift+ArrowDown Home End"
            className="absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full cursor-grab focus-ring touch-none select-none [-webkit-touch-callout:none]"
            style={{ left: p.x, top: p.y }}
          >
            <span
              className={cn(
                'h-4 w-4 rounded-full bg-accent shadow-glow border-2 border-bg transition-transform',
                dragging === idx ? 'scale-125' : ''
              )}
            />
          </button>
        ))}
      </div>
      {/* Numeric inputs. Values round-trip through `setHandle` so the
          same clamp / round-3 logic governs typed entry and drag entry.
          Step 0.01 keeps ± buttons usable for fine tuning; users wanting
          big jumps either drag or type a value directly. */}
      <div className="grid w-full max-w-[260px] grid-cols-4 gap-2">
        <NumberInput
          size="sm"
          label="X1"
          value={value[0]}
          onChange={(n) => setHandle(0, n, value[1])}
          min={X_MIN}
          max={X_MAX}
          step={0.01}
        />
        <NumberInput
          size="sm"
          label="Y1"
          value={value[1]}
          onChange={(n) => setHandle(0, value[0], n)}
          min={Y_MIN}
          max={Y_MAX}
          step={0.01}
        />
        <NumberInput
          size="sm"
          label="X2"
          value={value[2]}
          onChange={(n) => setHandle(1, n, value[3])}
          min={X_MIN}
          max={X_MAX}
          step={0.01}
        />
        <NumberInput
          size="sm"
          label="Y2"
          value={value[3]}
          onChange={(n) => setHandle(1, value[2], n)}
          min={Y_MIN}
          max={Y_MAX}
          step={0.01}
        />
      </div>
      <BezierPreviewBall value={value} />
    </div>
  );
}

type PreviewSpeed = '0.5x' | '1x' | '2x';

const PREVIEW_DURATION_MS: Record<PreviewSpeed, number> = {
  '0.5x': 2400,
  '1x': 1200,
  '2x': 600,
};

const PREVIEW_TRACK_MAX_WIDTH = 260;
const PREVIEW_BALL_SIZE = 12;

function BezierPreviewBall({
  value,
}: {
  value: [number, number, number, number];
}) {
  const [speed, setSpeed] = useState<PreviewSpeed>('1x');
  const trackRef = useRef<HTMLDivElement | null>(null);
  // Measure the actual rendered track width so the ball's end position
  // matches the track on narrow viewports. A hard 260px would overflow
  // narrow controls panels and let the ball travel past the visible
  // edge. Falling back to the max width on layouts that haven't
  // measured yet (SSR / first paint) keeps the ball visible.
  const [trackWidth, setTrackWidth] = useState(PREVIEW_TRACK_MAX_WIDTH);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const el = trackRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const obs = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) setTrackWidth(w);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const slideEnd = Math.max(0, trackWidth - PREVIEW_BALL_SIZE);

  return (
    <div className="flex w-full max-w-[260px] flex-col items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-fg-subtle">
        Live preview
      </span>
      {reduceMotion ? (
        // prefers-reduced-motion users get a static hint instead of an
        // empty track with a frozen dot, which would otherwise read as
        // a broken control. The curve in the editor above already
        // communicates the easing visually.
        <div
          className="grid h-6 w-full place-items-center rounded-full border border-border/70 bg-bg-soft px-2 text-[10px] italic text-fg-subtle"
          role="status"
        >
          Preview paused for reduced motion
        </div>
      ) : (
        <div
          ref={trackRef}
          className="relative h-6 w-full overflow-visible rounded-full border border-border/70 bg-bg-soft"
          aria-hidden
        >
          {/* Driving individual animation-* properties (not the shorthand)
              lets browsers preserve current progress when only the
              duration or timing function changes. Rebuilding the
              shorthand on every speed change restarted the iteration
              in Safari / Firefox. */}
          <span
            className="ah-bezier-preview-ball absolute top-1/2 rounded-full bg-accent shadow-glow"
            style={{
              width: PREVIEW_BALL_SIZE,
              height: PREVIEW_BALL_SIZE,
              ['--slide-end' as string]: `${slideEnd}px`,
              animationName: 'ah-bezier-slide',
              animationDuration: `${PREVIEW_DURATION_MS[speed]}ms`,
              animationTimingFunction: `cubic-bezier(${value.join(', ')})`,
              animationIterationCount: 'infinite',
              animationDirection: 'alternate',
            }}
          />
        </div>
      )}
      <div role="radiogroup" aria-label="Preview speed" className="flex gap-1">
        {(['0.5x', '1x', '2x'] as const).map((s) => {
          const active = speed === s;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSpeed(s)}
              className={cn(
                'rounded-full border px-2 py-0.5 text-[10px] tabular-nums transition-colors focus-ring',
                active
                  ? 'border-accent/50 bg-accent/15 text-fg'
                  : 'border-border/70 bg-bg-soft text-fg-muted hover:text-fg'
              )}
            >
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function easingDescription(e: Easing): string {
  if (e.kind === 'preset') return e.value;
  if (e.kind === 'steps') return `steps(${e.n}, jump-${e.jump})`;
  return `cubic-bezier(${e.v.map((n) => Number(n.toFixed(2))).join(', ')})`;
}
