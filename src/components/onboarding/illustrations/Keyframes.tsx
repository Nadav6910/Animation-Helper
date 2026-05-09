import { motion } from 'framer-motion';

/**
 * Three diamond keyframe handles on a horizontal track. The middle one
 * gets dragged left/right by an invisible ghost cursor; a faint glow
 * follows it to suggest "tweaking the keyframe".
 */
export function KeyframesIllustration() {
  return (
    <div className="relative h-32 w-full overflow-hidden rounded-xl bg-gradient-to-br from-bg-soft via-bg-panel to-bg-soft ring-1 ring-border/60">
      {/* track */}
      <div className="absolute left-4 right-4 top-1/2 h-2 -translate-y-1/2 rounded-full border border-border/70 bg-bg-soft/80">
        {/* progress fill */}
        <motion.div
          className="h-full rounded-full bg-accent/50"
          animate={{ width: ['25%', '60%', '25%'] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      {/* keyframe diamonds at 0 / draggable / 100 */}
      <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2">
        {/* fixed left */}
        <motion.span
          className="absolute h-5 w-5 rounded-md border-2 border-border-strong bg-bg-panel"
          style={{ left: '0%', x: '-50%', y: '-50%', rotate: 45, top: '50%' }}
        />
        {/* draggable middle */}
        <motion.span
          className="absolute h-6 w-6 rounded-md border-2 border-accent bg-accent shadow-glow"
          style={{ y: '-50%', rotate: 45, top: '50%' }}
          animate={{
            x: ['-50%', '-50%', '-50%'],
            left: ['25%', '60%', '25%'],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* fixed right */}
        <motion.span
          className="absolute h-5 w-5 rounded-md border-2 border-border-strong bg-bg-panel"
          style={{ left: '100%', x: '-100%', y: '-50%', rotate: 45, top: '50%' }}
        />
      </div>
      {/* drag arrows */}
      <motion.svg
        viewBox="0 0 60 12"
        className="absolute left-1/2 top-[78%] h-3 w-16 -translate-x-1/2 text-fg-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M5 6 H55 M5 6 L10 2 M5 6 L10 10 M55 6 L50 2 M55 6 L50 10" />
      </motion.svg>
    </div>
  );
}
