import { useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const TITLE = 'Animation Helper';
const TAGLINE = 'Crafting motion';

/**
 * 4 simple shape SVG paths drawn into a 24×24 viewBox, used as orbital
 * accents around the brand. They share `pathLength="100"` so the same
 * stroke-draw timing works for any path complexity.
 */
const ORBIT_SHAPES = [
  {
    id: 'square',
    d: 'M4 4 H20 V20 H4 Z',
    radius: 150,
    angle: 0,
    delay: 0.2,
    color: 'rgb(var(--accent))',
  },
  {
    id: 'triangle',
    d: 'M12 3 L21 20 L3 20 Z',
    radius: 150,
    angle: 90,
    delay: 0.32,
    color: '#ec4899',
  },
  {
    id: 'circle',
    d: 'M12 3 A 9 9 0 1 1 11.99 3 Z',
    radius: 150,
    // Was 180° (straight left) — that put the circle right at title-
    // top level, sitting on top of the "An" of "Animation Helper".
    // 200° lifts the orbit position to up-left so the title reads
    // cleanly while keeping the four-shape compass arrangement.
    angle: 200,
    delay: 0.44,
    color: '#22d3ee',
  },
  {
    id: 'star',
    d: 'M12 3 L14.5 9 L21 9.6 L16 14 L17.5 20.5 L12 17 L6.5 20.5 L8 14 L3 9.6 L9.5 9 Z',
    radius: 150,
    angle: 270,
    delay: 0.56,
    color: '#facc15',
  },
];

const SPARKLE_DOTS = Array.from({ length: 12 }, (_, i) => i);

type Props = { onDone: () => void; minDuration?: number };

export function LoadingScreen({ onDone, minDuration = 2600 }: Props) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const total = reduceMotion ? 700 : minDuration;
    const t = setTimeout(onDone, total);
    return () => clearTimeout(t);
  }, [onDone, minDuration, reduceMotion]);

  const titleChars = useMemo(() => TITLE.split(''), []);

  return (
    <motion.div
      key="loading"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.06, filter: 'blur(8px)' }}
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-bg"
      aria-hidden="false"
      role="status"
      aria-label="Loading Animation Helper"
    >
      {/* Layer 1 — radial backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 45%, rgb(var(--accent) / 0.18), transparent 70%), radial-gradient(40% 50% at 50% 100%, rgb(var(--accent) / 0.10), transparent 70%)',
        }}
      />

      {/* Layer 2 — animated grid mesh */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 1.2 }}
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgb(var(--border) / .35) 0 1px, transparent 1px 40px), repeating-linear-gradient(90deg, rgb(var(--border) / .35) 0 1px, transparent 1px 40px)',
          maskImage:
            'radial-gradient(ellipse at 50% 50%, black 25%, transparent 70%)',
        }}
      />

      {/* Layer 3 — gradient orbs */}
      {!reduceMotion && (
        <>
          <motion.div
            aria-hidden
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{
              opacity: [0, 0.5, 0.5, 0],
              scale: [0.6, 1, 1.1, 1.4],
              x: [-60, -80, -40, 0],
              y: [-40, -10, 10, 60],
            }}
            transition={{
              duration: 2.6,
              ease: [0.4, 0, 0.2, 1],
              times: [0, 0.3, 0.7, 1],
            }}
            className="absolute h-72 w-72 rounded-full blur-3xl"
            style={{ background: 'rgb(var(--accent) / 0.6)' }}
          />
          <motion.div
            aria-hidden
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{
              opacity: [0, 0.4, 0.4, 0],
              scale: [0.7, 1.1, 1.2, 1.5],
              x: [80, 60, 30, -10],
              y: [60, 30, 0, -40],
            }}
            transition={{
              duration: 2.6,
              ease: [0.4, 0, 0.2, 1],
              times: [0, 0.3, 0.7, 1],
              delay: 0.15,
            }}
            className="absolute h-72 w-72 rounded-full blur-3xl"
            style={{ background: '#22d3ee99' }}
          />
        </>
      )}

      {/* Layer 4 — orbital shapes drawing themselves in */}
      {!reduceMotion && (
        <div className="absolute grid place-items-center">
          {ORBIT_SHAPES.map((s) => {
            const rad = (s.angle * Math.PI) / 180;
            const x = Math.cos(rad) * s.radius;
            const y = Math.sin(rad) * s.radius;
            return (
              <motion.svg
                key={s.id}
                aria-hidden
                viewBox="0 0 24 24"
                width="56"
                height="56"
                className="absolute"
                style={{ left: x, top: y }}
                initial={{ opacity: 0, scale: 0.4, rotate: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0.6],
                  scale: [0.4, 1, 1, 1.1],
                  rotate: [0, 30, 360],
                }}
                transition={{
                  duration: 2.2,
                  delay: s.delay,
                  ease: [0.4, 0, 0.2, 1],
                  times: [0, 0.4, 0.7, 1],
                }}
              >
                <motion.path
                  d={s.d}
                  pathLength={100}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ strokeDasharray: 100 }}
                  initial={{ strokeDashoffset: 100 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{
                    duration: 0.9,
                    delay: s.delay + 0.05,
                    ease: [0.5, 0, 0.2, 1],
                  }}
                />
              </motion.svg>
            );
          })}
        </div>
      )}

      {/* Layer 5 — center brand */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 220,
            damping: 16,
            delay: reduceMotion ? 0 : 0.55,
          }}
          className="relative grid h-20 w-20 place-items-center"
        >
          {/* Glow halo */}
          <motion.span
            aria-hidden
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.8, 0.5], scale: [0.6, 1.6, 1.3] }}
            transition={{
              duration: 1.6,
              delay: reduceMotion ? 0 : 0.6,
              ease: [0.4, 0, 0.2, 1],
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            className="absolute inset-0 rounded-3xl bg-accent/40 blur-2xl"
          />
          {/* Sparkle dots */}
          {!reduceMotion &&
            SPARKLE_DOTS.map((i) => {
              const a = (i / SPARKLE_DOTS.length) * Math.PI * 2;
              return (
                <motion.span
                  key={i}
                  aria-hidden
                  className="absolute h-1 w-1 rounded-full bg-accent"
                  style={{ left: '50%', top: '50%' }}
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    x: Math.cos(a) * 90,
                    y: Math.sin(a) * 90,
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.4,
                    delay: 0.9 + i * 0.04,
                    ease: [0.2, 0.8, 0.2, 1],
                  }}
                />
              );
            })}
          {/* Logo */}
          <motion.span
            animate={
              reduceMotion ? {} : { rotate: [0, 360], scale: [1, 1.06, 1] }
            }
            transition={{
              rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
              scale: {
                duration: 1.6,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              },
            }}
            className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-accent via-accent/70 to-accent/30 text-accent-contrast shadow-glow"
          >
            <Sparkles size={30} />
          </motion.span>
        </motion.div>

        {/* Title with letter-stagger reveal */}
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: reduceMotion ? 0 : 0.035,
                delayChildren: reduceMotion ? 0 : 1.0,
              },
            },
          }}
          className="mt-7 font-display text-3xl font-bold sm:text-5xl"
          aria-label={TITLE}
        >
          {titleChars.map((ch, i) => (
            <motion.span
              key={i}
              variants={{
                hidden: {
                  opacity: 0,
                  y: 24,
                  filter: 'blur(10px)',
                },
                visible: {
                  opacity: 1,
                  y: 0,
                  filter: 'blur(0px)',
                  transition: {
                    type: 'spring',
                    stiffness: 280,
                    damping: 22,
                  },
                },
              }}
              className="inline-block gradient-text"
              style={{ whiteSpace: ch === ' ' ? 'pre' : 'normal' }}
            >
              {ch}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: reduceMotion ? 0.1 : 1.7,
            ease: [0.4, 0, 0.2, 1],
          }}
          className="mt-3 text-sm text-fg-muted sm:text-base"
        >
          {TAGLINE}
        </motion.p>
      </div>

      {/* Layer 6 — bottom progress shimmer */}
      <motion.div
        aria-hidden
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{
          duration: (reduceMotion ? 700 : minDuration) / 1000,
          ease: [0.4, 0, 0.2, 1],
        }}
        className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-gradient-to-r from-transparent via-accent to-transparent"
      />
    </motion.div>
  );
}
