import { motion } from 'framer-motion';

/**
 * A scrub head that ticks across a ruler while a tiny shape glides
 * left-to-right above it — visually maps "scrub the timeline → element
 * jumps to that frame". Mirrors the live TimelinePanel + PreviewStage
 * pairing the user is about to use.
 */
export function TimelineIllustration() {
  return (
    <div className="relative h-32 w-full overflow-hidden rounded-xl bg-gradient-to-br from-bg-soft via-bg-panel to-bg-soft ring-1 ring-border/60">
      {/* the moving shape — a simple square gliding right */}
      <motion.div
        className="absolute top-4 h-7 w-7 rounded-md bg-accent shadow-glow"
        animate={{
          left: ['10%', '70%', '10%'],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ left: '10%' }}
      />
      {/* timeline track */}
      <div className="absolute inset-x-4 bottom-6 h-3 rounded-full border border-border/70 bg-bg-soft/80">
        {/* progress fill */}
        <motion.div
          className="h-full rounded-full bg-accent/40"
          animate={{ width: ['10%', '70%', '10%'] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      {/* playhead */}
      <motion.span
        className="absolute bottom-4 h-7 w-1 rounded-full bg-accent shadow-[0_0_14px_rgb(var(--accent)/0.7)]"
        animate={{ left: ['10%', '70%', '10%'] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ x: '-50%' }}
      />
      {/* time tick labels */}
      <div className="absolute inset-x-4 bottom-1 flex justify-between text-[9px] text-fg-subtle/70 tabular-nums">
        <span>0ms</span>
        <span>1.0s</span>
        <span>2.0s</span>
      </div>
    </div>
  );
}
