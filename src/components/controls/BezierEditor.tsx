import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Easing } from '@/types/animation';

type Props = {
  value: [number, number, number, number];
  onChange: (v: [number, number, number, number]) => void;
};

const SIZE = 200;
const PAD = 16;

export function BezierEditor({ value, onChange }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState<0 | 1 | null>(null);

  const inner = SIZE - PAD * 2;
  const toPx = (x: number, y: number) => ({
    x: PAD + x * inner,
    y: PAD + (1 - y) * inner,
  });
  const fromPx = (px: number, py: number): [number, number] => {
    const x = (px - PAD) / inner;
    const y = 1 - (py - PAD) / inner;
    // clamp X to [0, 1] to remain a valid cubic-bezier curve; allow Y outside for elastic feel
    return [Math.max(0, Math.min(1, x)), Math.max(-1.5, Math.min(2.5, y))];
  };

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
      const next: [number, number, number, number] =
        idx === 0 ? [nx, ny, value[2], value[3]] : [value[0], value[1], nx, ny];
      onChange(next);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setDragging(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const pathD = useMemo(
    () =>
      `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`,
    [p0, p1, p2, p3]
  );

  return (
    <div ref={wrapRef} className="relative" style={{ width: SIZE, height: SIZE }}>
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
      {[
        { idx: 0 as const, p: p1 },
        { idx: 1 as const, p: p2 },
      ].map(({ idx, p }) => (
        <button
          key={idx}
          type="button"
          onPointerDown={(e) => handlePointer(e, idx)}
          aria-label={`Bezier handle ${idx + 1}`}
          className={
            'absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-glow border-2 border-bg cursor-grab focus-ring ' +
            (dragging === idx ? 'cursor-grabbing scale-125' : '')
          }
          style={{ left: p.x, top: p.y, transition: 'transform .15s ease' }}
        />
      ))}
    </div>
  );
}

export function easingDescription(e: Easing): string {
  if (e.kind === 'preset') return e.value;
  if (e.kind === 'steps') return `steps(${e.n}, jump-${e.jump})`;
  return `cubic-bezier(${e.v.map((n) => Number(n.toFixed(2))).join(', ')})`;
}
