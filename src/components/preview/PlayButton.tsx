import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

type Props = { onClick: () => void };

export function PlayButton({ onClick }: Props) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      className="group relative grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-contrast shadow-glow focus-ring"
      aria-label="Replay animation"
      title="Replay (Space)"
    >
      <span className="absolute inset-0 rounded-full bg-accent/40 blur-xl group-hover:bg-accent/60 transition-colors" />
      <Play size={20} className="relative" fill="currentColor" />
    </motion.button>
  );
}
