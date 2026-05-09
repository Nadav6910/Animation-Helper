import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const COLORS = ['#7c5cff', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#ffffff'];

type Piece = {
  hue: string;
  startX: number;
  endX: number;
  startY: number;
  endY: number;
  rotate: number;
  scale: number;
  delay: number;
  duration: number;
  shape: 'rect' | 'circle';
};

/**
 * One-off confetti burst. Mounts a fixed-position layer of ~36 pieces,
 * each with a random colour / shape / spin and a trajectory that fans
 * outward + down. Designed to be unmounted (or its `key` swapped) when
 * the user advances past the celebration moment.
 *
 * `prefers-reduced-motion` collapses the burst to a single concentric
 * sparkle so the celebration is still acknowledged without choreography.
 */
export function Confetti({ count = 36 }: { count?: number }) {
  const reduced = useReducedMotion();
  const pieces = useMemo<Piece[]>(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 220 + Math.random() * 240;
      return {
        hue: COLORS[i % COLORS.length],
        startX: 0,
        endX: Math.cos(angle) * distance,
        startY: 0,
        endY: Math.sin(angle) * distance + 120, // bias downward (gravity)
        rotate: (Math.random() - 0.5) * 720,
        scale: 0.6 + Math.random() * 0.9,
        delay: Math.random() * 0.15,
        duration: 1.1 + Math.random() * 0.9,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
      };
    });
  }, [count]);

  if (reduced) {
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid place-items-center"
      >
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 2.5, opacity: [0, 1, 0] }}
          transition={{ duration: 0.8 }}
          className="block h-12 w-12 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgb(var(--accent) / 0.6), transparent 70%)',
          }}
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden"
    >
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          initial={{
            x: p.startX,
            y: p.startY,
            rotate: 0,
            opacity: 0,
            scale: 0,
          }}
          animate={{
            x: p.endX,
            y: p.endY,
            rotate: p.rotate,
            opacity: [0, 1, 1, 0],
            scale: p.scale,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.16, 1, 0.3, 1],
            opacity: { times: [0, 0.05, 0.7, 1] },
          }}
          className="absolute"
          style={{
            width: p.shape === 'rect' ? 8 : 10,
            height: p.shape === 'rect' ? 14 : 10,
            background: p.hue,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            boxShadow: `0 0 12px ${p.hue}66`,
          }}
        />
      ))}
    </div>
  );
}
