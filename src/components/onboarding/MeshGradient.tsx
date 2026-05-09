import { motion, useReducedMotion } from 'framer-motion';

/**
 * Two large radial-gradient blobs that drift slowly across a fixed
 * fullscreen layer behind the onboarding tour. Pure CSS / SVG — no
 * canvas, no Three.js — so the cost is one composited layer that the
 * GPU handles for free.
 *
 * Honours `prefers-reduced-motion`: the blobs hold still in that mode
 * but the overall composition still reads as a tinted backdrop.
 */
export function MeshGradient() {
  const reduced = useReducedMotion();
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <motion.div
        className="absolute -inset-[20%] rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(closest-side, rgb(var(--accent) / 0.35), transparent 70%)',
        }}
        animate={
          reduced
            ? undefined
            : {
                x: ['-15%', '8%', '-15%'],
                y: ['-10%', '12%', '-10%'],
              }
        }
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-1/3 -right-1/4 h-[80vmax] w-[80vmax] rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(closest-side, rgb(var(--accent-soft, 60 40 140) / 0.45), transparent 70%)',
        }}
        animate={
          reduced
            ? undefined
            : {
                x: ['0%', '-12%', '0%'],
                y: ['0%', '-8%', '0%'],
              }
        }
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Subtle grain so the gradient doesn't look CGI-flat */}
      <div
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage:
            'radial-gradient(rgb(255 255 255 / 0.04) 1px, transparent 1px)',
          backgroundSize: '3px 3px',
        }}
      />
    </div>
  );
}
