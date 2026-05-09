import { motion } from 'framer-motion';

/**
 * A code snippet that condenses into a paper-airplane "send" icon, then
 * a chip floats up reading "✓ Copied". Communicates the export / copy
 * step without committing to a specific button shape.
 */
export function ExportIllustration() {
  return (
    <div className="relative h-32 w-full overflow-hidden rounded-xl bg-gradient-to-br from-bg-soft via-bg-panel to-bg-soft ring-1 ring-border/60">
      {/* code lines */}
      <div className="absolute inset-x-4 top-4 flex flex-col gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="h-1.5 rounded-full bg-fg-muted/40"
            style={{ width: `${72 - i * 12}%` }}
            initial={{ opacity: 1, x: 0 }}
            animate={{
              opacity: [1, 0.6, 0, 0, 1],
              x: [0, 30, 80, 0, 0],
            }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              delay: i * 0.06,
              ease: 'easeInOut',
              times: [0, 0.25, 0.5, 0.75, 1],
            }}
          />
        ))}
      </div>
      {/* paper airplane that "consumes" the lines */}
      <motion.svg
        viewBox="0 0 24 24"
        className="absolute h-7 w-7 text-accent drop-shadow-[0_0_10px_rgb(var(--accent)/0.6)]"
        fill="currentColor"
        animate={{
          opacity: [0, 0, 1, 1, 0, 0],
          x: ['90%', '90%', '70%', '110%', '110%', '90%'],
          y: ['40%', '40%', '40%', '20%', '20%', '40%'],
          rotate: [0, 0, 0, -20, -20, 0],
        }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: 'easeInOut',
          times: [0, 0.4, 0.5, 0.7, 0.85, 1],
        }}
      >
        <path d="M3 11l18-8-8 18-2-7-8-3z" />
      </motion.svg>
      {/* "Copied" chip floats up + fades out */}
      <motion.div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-accent/50 bg-bg-panel/95 px-2 py-0.5 text-[10px] font-semibold text-fg shadow-glow"
        initial={{ opacity: 0, y: 8 }}
        animate={{
          opacity: [0, 0, 1, 1, 0],
          y: [8, 8, 0, -10, -16],
        }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: 'easeOut',
          times: [0, 0.55, 0.7, 0.85, 1],
        }}
      >
        ✓ Copied
      </motion.div>
    </div>
  );
}
