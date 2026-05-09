import { motion } from 'framer-motion';

/**
 * Animated "hand picks a card" — a hand cursor glyph drifts across a
 * 3-card grid, hovers each card in sequence, and a subtle highlight
 * lifts under it. Conveys the "tap a preset" action without text.
 */
export function PickerIllustration() {
  return (
    <div className="relative h-32 w-full overflow-hidden rounded-xl bg-gradient-to-br from-bg-soft via-bg-panel to-bg-soft ring-1 ring-border/60">
      {/* card grid */}
      <div className="absolute inset-x-4 top-4 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="relative aspect-square rounded-md border border-border/70 bg-bg-panel/80"
            animate={{
              borderColor: [
                'rgb(var(--border))',
                'rgb(var(--accent) / 0.6)',
                'rgb(var(--border))',
              ],
              boxShadow: [
                '0 0 0 0 rgb(var(--accent) / 0)',
                '0 0 16px 0 rgb(var(--accent) / 0.5)',
                '0 0 0 0 rgb(var(--accent) / 0)',
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 1,
              ease: 'easeInOut',
            }}
          >
            <motion.div
              className="absolute inset-1.5 rounded-sm bg-accent/50"
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.85, 0.5] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: i * 0.4,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        ))}
      </div>
      {/* moving cursor — taps each card in sequence */}
      <motion.svg
        viewBox="0 0 24 24"
        className="absolute h-5 w-5 text-fg drop-shadow-[0_2px_6px_rgb(0_0_0/0.5)]"
        animate={{
          x: ['18%', '50%', '82%', '18%'],
          y: ['52%', '58%', '52%', '52%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: [0.6, 0.05, 0.4, 1],
        }}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 11V4a2 2 0 0 1 4 0v8" />
        <path d="M13 9a2 2 0 0 1 4 0v3" />
        <path d="M17 11a2 2 0 0 1 4 0v5a6 6 0 0 1-6 6h-2a6 6 0 0 1-5-3l-3-5a2 2 0 0 1 3-2.5L9 13" />
      </motion.svg>
    </div>
  );
}
