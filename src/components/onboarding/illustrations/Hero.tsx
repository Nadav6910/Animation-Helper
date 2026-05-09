import { motion } from 'framer-motion';

/**
 * Hero card illustration: a stylised "card-with-sparkles" graphic plus
 * a slow gradient sweep across the headline area. Designed to read at a
 * glance — this is the very first thing a brand-new visitor sees.
 */
export function HeroIllustration() {
  return (
    <div className="relative h-32 w-full overflow-hidden rounded-xl bg-gradient-to-br from-accent/20 via-accent/10 to-accent/30 ring-1 ring-accent/30">
      {/* Slow accent sweep */}
      <motion.div
        aria-hidden
        className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ['0%', '400%'] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Three preset cards stacked diagonally */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative h-20 w-20">
          {[2, 1, 0].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-lg border border-accent/40 bg-bg-panel/85 shadow-glow"
              initial={{ rotate: -8 + i * 8, x: -16 + i * 16, scale: 0.92 + i * 0.04 }}
              animate={{
                rotate: -8 + i * 8,
                x: -16 + i * 16,
                scale: i === 1 ? [0.96, 1.05, 0.96] : 0.92 + i * 0.04,
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.18,
              }}
              style={{ zIndex: i }}
            >
              <div className="absolute inset-2 rounded-md bg-accent/40" />
              <motion.div
                className="absolute inset-x-2 bottom-1 h-1 rounded-full bg-accent"
                animate={{ scaleX: [0.2, 1, 0.2] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.2,
                }}
                style={{ transformOrigin: 'left center' }}
              />
            </motion.div>
          ))}
        </div>
      </div>
      {/* Twinkling sparkles in the corners */}
      {[
        { x: '12%', y: '20%', delay: 0 },
        { x: '88%', y: '30%', delay: 0.6 },
        { x: '78%', y: '78%', delay: 1.2 },
        { x: '20%', y: '70%', delay: 1.8 },
      ].map((s, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute h-1.5 w-1.5 rounded-full bg-white"
          style={{ left: s.x, top: s.y }}
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            delay: s.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
