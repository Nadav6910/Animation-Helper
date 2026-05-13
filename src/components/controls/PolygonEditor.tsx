import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import {
  type ClipPathPoint,
  insertPointAt,
} from '@/lib/clipPath';
import { cn } from '@/lib/cn';

type Props = {
  /** Points in % space (0–100). Caller owns the array. */
  points: ReadonlyArray<ClipPathPoint>;
  onChange: (points: ClipPathPoint[]) => void;
  /** Pixel size of the square canvas. Defaults to 240 — comfortable for
   *  the modal use case while still fitting in the controls column. */
  size?: number;
  /** Minimum vertex count enforced for delete. Default 3 (any polygon). */
  minPoints?: number;
  /** When true, the editor renders the polygon and vertex visuals but
   *  ignores all input — pointer drags, canvas-tap inserts, vertex
   *  keyboard nudges, and the × delete overlay are all suppressed.
   *  Vertex buttons also get `tabIndex={-1}` so they drop out of the
   *  tab order; otherwise a user could focus a vertex via keyboard
   *  and watch arrow keys mutate state that the host then silently
   *  discards. Used by the edit-mode of `CustomShapeModal`. */
  readOnly?: boolean;
};

// 3-decimal grid matches the round-trip precision in clipPath.ts.
function round3(n: number): number {
  const r = Math.round(n * 1000) / 1000;
  return r === 0 ? 0 : r;
}

function clampPct(n: number): number {
  return Math.max(0, Math.min(100, n));
}

// Pre-tuned spring used for non-drag vertex movements (load a custom
// shape, undo, paste-in). Drag updates bypass the spring so the
// cursor and the vertex stay locked together.
const VERTEX_SPRING = {
  type: 'spring' as const,
  stiffness: 540,
  damping: 38,
  mass: 0.45,
};

/**
 * Polygon authoring surface for the custom-shape modal and the
 * clip-path animation card.
 *
 * Affordances:
 *  - SVG canvas with a soft grid; the live polygon renders with a
 *    semi-transparent accent fill so users see the resulting shape,
 *    not just the wireframe.
 *  - Vertex handles are layered (outer ring + inner dot) so the
 *    drag target reads as a "grommet" the user can grab. Framer
 *    Motion drives the spring on non-drag moves; the vertex snaps
 *    to the pointer during a drag for zero lag.
 *  - Hovering / pointer-moving inside the canvas shows a ghost
 *    "insert here" dot on the closest edge — tapping commits.
 *  - During a drag, a tiny tooltip floats above the vertex
 *    showing the live X / Y in percentage units.
 *  - Each vertex has a small × overlay (24×24 hit area, tabIndex=-1)
 *    to remove. Backspace / Delete on a focused vertex does the same.
 *  - Arrow keys nudge ±1 %, Shift+Arrow ±5 %.
 *
 * Coordinate system: input/output points are in 0 – 100 % to match
 * CSS clip-path syntax; the SVG renders them at the canvas's pixel
 * scale via `toPx` / `fromPx`. State updates round-trip through the
 * round3 grid so generated CSS stays clean.
 */
export function PolygonEditor({
  points,
  onChange,
  size = 240,
  minPoints = 3,
  readOnly = false,
}: Props) {
  const PAD = 12;
  const inner = size - PAD * 2;
  const reactId = useId();
  const helpId = `polygon-help-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [insertHint, setInsertHint] = useState<ClipPathPoint | null>(null);
  // Same anti-stale-closure pattern as BezierEditor: the pointermove
  // listener captures `points` from the render that fired the drag.
  // valueRef lets the move read the latest array without re-binding
  // window listeners every render.
  const pointsRef = useRef(points);
  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  const toPx = useCallback(
    (x: number, y: number) => ({
      x: PAD + (x / 100) * inner,
      y: PAD + (y / 100) * inner,
    }),
    [PAD, inner]
  );

  const fromPx = useCallback(
    (px: number, py: number): ClipPathPoint => {
      const x = ((px - PAD) / inner) * 100;
      const y = ((py - PAD) / inner) * 100;
      return [clampPct(x), clampPct(y)];
    },
    [PAD, inner]
  );

  const setPoint = useCallback(
    (idx: number, x: number, y: number) => {
      const cur = pointsRef.current;
      const next: ClipPathPoint[] = cur.map((p, i) =>
        i === idx ? ([round3(clampPct(x)), round3(clampPct(y))] as const) : p
      );
      onChange(next);
    },
    [onChange]
  );

  const onVertexPointerDown = (e: React.PointerEvent, idx: number) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    setDragIdx(idx);
    setInsertHint(null);
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      /* setPointerCapture can throw on detached targets; ignore. */
    }
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const move = (ev: PointerEvent) => {
      const [x, y] = fromPx(ev.clientX - rect.left, ev.clientY - rect.top);
      setPoint(idx, x, y);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      setDragIdx(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  const onCanvasPointerDown = (e: React.PointerEvent) => {
    if (readOnly) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const [x, y] = fromPx(e.clientX - rect.left, e.clientY - rect.top);
    onChange(insertPointAt(pointsRef.current, [round3(x), round3(y)]));
    setInsertHint(null);
  };

  const onCanvasPointerMove = (e: React.PointerEvent) => {
    if (readOnly || dragIdx !== null) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    // Ignore pointer outside the inner padded area — keeps the ghost
    // from rendering on the edge ring or beyond.
    if (
      px < PAD ||
      py < PAD ||
      px > size - PAD ||
      py > size - PAD
    ) {
      setInsertHint(null);
      return;
    }
    setInsertHint(fromPx(px, py));
  };

  const onCanvasPointerLeave = () => {
    setInsertHint(null);
  };

  const removePoint = (idx: number) => {
    const cur = pointsRef.current;
    if (cur.length <= minPoints) return;
    onChange(cur.filter((_, i) => i !== idx));
  };

  const handleVertexKey = (e: React.KeyboardEvent, idx: number) => {
    if (readOnly) return;
    const step = e.shiftKey ? 5 : 1;
    const handled =
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === ' ' ||
      e.code === 'Space';
    if (!handled) return;
    e.preventDefault();
    // React's stopPropagation only halts the synthetic-event tree.
    // App.tsx's keydown handler is on `window` so we need to stop the
    // native bubble path too, or ArrowRight would also scrub the
    // timeline and Space would replay the animation.
    e.nativeEvent.stopImmediatePropagation();
    if (e.key === ' ' || e.code === 'Space') return;
    const cur = pointsRef.current[idx];
    if (!cur) return;
    const [x, y] = cur;
    switch (e.key) {
      case 'ArrowLeft':
        setPoint(idx, x - step, y);
        break;
      case 'ArrowRight':
        setPoint(idx, x + step, y);
        break;
      case 'ArrowUp':
        setPoint(idx, x, y - step);
        break;
      case 'ArrowDown':
        setPoint(idx, x, y + step);
        break;
      case 'Backspace':
      case 'Delete':
        removePoint(idx);
        break;
    }
  };

  // Polygon path string for the SVG <polygon>. Uses pixel coords.
  const polyPoints = points
    .map((p) => {
      const px = toPx(p[0], p[1]);
      return `${px.x},${px.y}`;
    })
    .join(' ');

  const insertHintPx = insertHint ? toPx(insertHint[0], insertHint[1]) : null;

  return (
    <div className="flex flex-col items-center gap-3">
      <span id={helpId} className="sr-only">
        Drag the vertices to reshape the polygon. Hover or tap an empty
        area inside the canvas to add a new vertex at the closest edge.
        Use arrow keys to nudge a focused vertex; hold shift for a
        larger step. Backspace or Delete removes the focused vertex
        when more than {minPoints} remain.
      </span>
      <div
        ref={wrapRef}
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onCanvasPointerMove}
        onPointerLeave={onCanvasPointerLeave}
        className="relative select-none touch-none"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className="absolute inset-0 pointer-events-none overflow-visible"
          aria-hidden
        >
          <defs>
            {/* Subtle inner glow on the polygon fill — gives the shape
                a touch of depth so it doesn't read as a flat overlay. */}
            <linearGradient id={`${helpId}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0.22" />
              <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="0.08" />
            </linearGradient>
          </defs>
          <rect
            x={PAD}
            y={PAD}
            width={inner}
            height={inner}
            rx={10}
            className="fill-bg-soft stroke-border/70"
          />
          {/* Quarter / half / three-quarter gridlines. Slightly lower
              opacity than the previous version so the polygon dominates
              visually. */}
          {[0.25, 0.5, 0.75].map((t) => (
            <g key={t} className="stroke-border/30">
              <line
                x1={PAD}
                y1={PAD + t * inner}
                x2={size - PAD}
                y2={PAD + t * inner}
              />
              <line
                x1={PAD + t * inner}
                y1={PAD}
                x2={PAD + t * inner}
                y2={size - PAD}
              />
            </g>
          ))}
          {points.length >= 3 && (
            // motion.polygon animates the `points` attribute on
            // non-drag updates (load a different shape, undo). During
            // a drag we render directly because the points stream is
            // already at pointer cadence.
            <motion.polygon
              points={polyPoints}
              fill={`url(#${helpId}-fill)`}
              className="stroke-accent"
              strokeWidth={1.75}
              strokeLinejoin="round"
              animate={dragIdx === null ? { points: polyPoints } : undefined}
              transition={dragIdx === null ? { duration: 0.12, ease: [0.22, 1, 0.36, 1] } : undefined}
            />
          )}
          {/* Insertion ghost: faint dot at the position the user's
              click would land. Sits on the polygon edge if pointer is
              near a side, snaps to wherever the user actually presses
              otherwise. Hidden during drags. */}
          {insertHintPx && dragIdx === null && (
            <g className="pointer-events-none">
              <circle
                cx={insertHintPx.x}
                cy={insertHintPx.y}
                r={7}
                className="fill-accent/15 stroke-accent/60"
                strokeDasharray="3 3"
              />
              <circle
                cx={insertHintPx.x}
                cy={insertHintPx.y}
                r={2}
                className="fill-accent"
              />
            </g>
          )}
        </svg>
        {points.map((p, idx) => {
          const px = toPx(p[0], p[1]);
          const canDelete = points.length > minPoints;
          const isDragging = dragIdx === idx;
          const isHover = hoverIdx === idx;
          return (
            <motion.div
              key={idx}
              className="absolute"
              animate={{ x: px.x, y: px.y }}
              transition={isDragging ? { duration: 0 } : VERTEX_SPRING}
              style={{ translate: '-50% -50%' }}
            >
              <button
                type="button"
                onPointerDown={(e) => onVertexPointerDown(e, idx)}
                onPointerEnter={() => setHoverIdx(idx)}
                onPointerLeave={() => setHoverIdx((v) => (v === idx ? null : v))}
                onFocus={() => setHoverIdx(idx)}
                onBlur={() => setHoverIdx((v) => (v === idx ? null : v))}
                onKeyDown={(e) => handleVertexKey(e, idx)}
                tabIndex={readOnly ? -1 : 0}
                aria-disabled={readOnly || undefined}
                aria-label={`Vertex ${idx + 1}, X ${p[0].toFixed(1)}, Y ${p[1].toFixed(1)}`}
                aria-describedby={helpId}
                aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Shift+ArrowLeft Shift+ArrowRight Shift+ArrowUp Shift+ArrowDown Backspace Delete"
                className={cn(
                  'group/vertex relative grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full focus-ring touch-none select-none [-webkit-touch-callout:none]',
                  readOnly
                    ? 'cursor-default'
                    : isDragging
                      ? 'cursor-grabbing'
                      : 'cursor-grab'
                )}
              >
                {/* Outer halo — fades in on hover / drag for affordance. */}
                <span
                  aria-hidden
                  className={cn(
                    'absolute inset-0 m-auto h-6 w-6 rounded-full bg-accent/20 transition-all duration-150',
                    isDragging
                      ? 'scale-125 bg-accent/40'
                      : isHover
                        ? 'scale-110'
                        : 'scale-90 opacity-0 group-focus-visible/vertex:opacity-100 group-focus-visible/vertex:scale-110'
                  )}
                />
                {/* Outer ring — the visible "grommet" edge. */}
                <span
                  aria-hidden
                  className={cn(
                    'relative grid h-4 w-4 place-items-center rounded-full border-2 border-accent bg-bg shadow-glow transition-transform duration-150',
                    isDragging ? 'scale-125' : isHover ? 'scale-110' : 'scale-100'
                  )}
                >
                  {/* Inner dot — fills the centre so the handle reads
                      as a solid target rather than an empty ring. */}
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
              </button>
              {canDelete && !readOnly && (
                // 24×24 hit area satisfies WCAG 2.5.5; the visual icon
                // is 10 px. tabIndex=-1 keeps keyboard users tabbing
                // through vertices only — Backspace/Delete on the
                // vertex covers keyboard deletion.
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    removePoint(idx);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label={`Remove vertex ${idx + 1}`}
                  className={cn(
                    'absolute -right-4 -top-4 grid h-6 w-6 place-items-center rounded-full border border-border bg-bg-panel text-fg-muted hover:text-red-400 hover:border-red-500/60 focus-ring transition-all duration-150',
                    isHover || isDragging
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-75 pointer-events-none'
                  )}
                >
                  <X size={10} />
                </button>
              )}
              {/* Live coordinate tooltip — only renders during drag. */}
              {isDragging && (
                <div
                  aria-hidden
                  className="absolute left-1/2 top-full mt-2 -translate-x-1/2 rounded-md border border-accent/40 bg-bg-panel/90 px-1.5 py-0.5 text-[10px] font-mono tabular-nums text-fg-muted shadow-glass backdrop-blur whitespace-nowrap pointer-events-none"
                >
                  {p[0].toFixed(1)}, {p[1].toFixed(1)}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      <p className="text-[11px] text-fg-subtle text-center max-w-[260px]">
        {points.length} {points.length === 1 ? 'vertex' : 'vertices'}
        {' · '}
        Drag to reshape, tap empty space to add, × or Delete to remove
      </p>
    </div>
  );
}
