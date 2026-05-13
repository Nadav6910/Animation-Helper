import { useCallback, useEffect, useId, useRef, useState } from 'react';
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
  /** Pixel size of the square canvas. */
  size?: number;
  /** Minimum vertex count enforced for delete. Default 3 (any polygon). */
  minPoints?: number;
};

// 3-decimal grid matches the round-trip precision in clipPath.ts.
// Keeps state free of float crud so the same value reads "0.4" not
// "0.40000000000000002".
function round3(n: number): number {
  const r = Math.round(n * 1000) / 1000;
  return r === 0 ? 0 : r;
}

function clampPct(n: number): number {
  return Math.max(0, Math.min(100, n));
}

/**
 * Polygon authoring surface for the custom-shape modal and the
 * clip-path animation card. Reuses the BezierEditor pattern: SVG
 * canvas + draggable buttons for each vertex, click empty area to
 * insert a new vertex on the closest edge, × overlay on each vertex
 * to delete (greyed out at the minimum vertex count).
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
}: Props) {
  const PAD = 12;
  const inner = size - PAD * 2;
  const reactId = useId();
  const helpId = `polygon-help-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
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
    e.preventDefault();
    e.stopPropagation(); // don't fire the canvas-tap insert handler
    setDragIdx(idx);
    // setPointerCapture binds the gesture to the vertex element so the
    // browser keeps routing pointer events to us even when the user
    // drags outside the editor / iframe / window. Belt-and-braces:
    // window listeners still drive the actual coordinate updates.
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
    // Tap on empty area → insert a new vertex on the closest edge.
    // The vertex buttons stopPropagation, so this only fires for
    // truly-empty clicks.
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const [x, y] = fromPx(e.clientX - rect.left, e.clientY - rect.top);
    onChange(insertPointAt(pointsRef.current, [round3(x), round3(y)]));
  };

  const removePoint = (idx: number) => {
    const cur = pointsRef.current;
    if (cur.length <= minPoints) return;
    onChange(cur.filter((_, i) => i !== idx));
  };

  const handleVertexKey = (e: React.KeyboardEvent, idx: number) => {
    const step = e.shiftKey ? 5 : 1;
    // Also swallow Space because the browser default fires a button
    // click; without that, Space on a focused vertex would bubble to
    // App's window-level `ah:replay` handler and restart the preview.
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
    // App.tsx's keydown handler is on `window`, which is in the native
    // capture/bubble path, so it would still fire — meaning ArrowRight
    // on a vertex would scrub the timeline as well as nudge the
    // vertex, and Space would replay the animation. stopImmediate-
    // Propagation on the native event halts both paths.
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

  return (
    <div className="flex flex-col items-center gap-3">
      <span id={helpId} className="sr-only">
        Drag the vertices to reshape the polygon. Tap an empty area
        inside the canvas to add a new vertex on the closest edge.
        Use arrow keys to nudge a focused vertex; hold shift for a
        larger step. Backspace or Delete removes the focused vertex
        when more than {minPoints} remain.
      </span>
      <div
        ref={wrapRef}
        onPointerDown={onCanvasPointerDown}
        className="relative select-none touch-none"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className="absolute inset-0 pointer-events-none"
          aria-hidden
        >
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
            <polygon
              points={polyPoints}
              className="fill-accent/15 stroke-accent"
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
          )}
        </svg>
        {points.map((p, idx) => {
          const px = toPx(p[0], p[1]);
          const canDelete = points.length > minPoints;
          return (
            <div
              key={idx}
              className="absolute"
              style={{
                left: px.x,
                top: px.y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <button
                type="button"
                onPointerDown={(e) => onVertexPointerDown(e, idx)}
                onKeyDown={(e) => handleVertexKey(e, idx)}
                aria-label={`Vertex ${idx + 1}, X ${p[0].toFixed(1)}, Y ${p[1].toFixed(1)}`}
                aria-describedby={helpId}
                aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Shift+ArrowLeft Shift+ArrowRight Shift+ArrowUp Shift+ArrowDown Backspace Delete"
                className={cn(
                  'grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full cursor-grab focus-ring touch-none select-none [-webkit-touch-callout:none]',
                  dragIdx === idx && 'cursor-grabbing'
                )}
              >
                <span
                  className={cn(
                    'h-3.5 w-3.5 rounded-full bg-accent shadow-glow border-2 border-bg transition-transform',
                    dragIdx === idx && 'scale-125'
                  )}
                />
              </button>
              {canDelete && (
                // Small × overlay anchored to the vertex; click removes
                // the point. Pointer events on the vertex button take
                // precedence (stopPropagation in the canvas handler),
                // so this only fires when the user explicitly clicks ×.
                // 24×24 hit area satisfies the WCAG 2.5.5 AAA minimum
                // with a 10-px visual icon centred inside. tabIndex=-1
                // keeps keyboard users tabbing through vertices only —
                // the Backspace / Delete shortcut on the vertex itself
                // already covers deletion.
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    removePoint(idx);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label={`Remove vertex ${idx + 1}`}
                  className="absolute -right-4 -top-4 grid h-6 w-6 place-items-center rounded-full border border-border bg-bg-panel text-fg-muted hover:text-red-400 hover:border-red-500/60 focus-ring transition-colors"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-fg-subtle text-center max-w-[260px]">
        {points.length} {points.length === 1 ? 'vertex' : 'vertices'}
        {' · '}
        Drag points to reshape. Tap empty space to add. × to remove.
      </p>
    </div>
  );
}
