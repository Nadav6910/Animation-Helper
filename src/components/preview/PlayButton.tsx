import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCw } from 'lucide-react';

export type PlayButtonState = 'playing' | 'paused' | 'finished';

type Props = {
  state: PlayButtonState;
  onClick: () => void;
};

const COPY: Record<PlayButtonState, { aria: string; title: string }> = {
  playing: { aria: 'Pause animation', title: 'Pause' },
  paused: { aria: 'Resume animation', title: 'Resume' },
  finished: { aria: 'Replay animation', title: 'Replay (Space)' },
};

export function PlayButton({ state, onClick }: Props) {
  const { aria, title } = COPY[state];
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      className="group relative grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-contrast shadow-glow focus-ring"
      aria-label={aria}
      title={title}
    >
      <span className="absolute inset-0 rounded-full bg-accent/40 blur-xl group-hover:bg-accent/60 transition-colors" />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={state}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.15 }}
          className="relative grid place-items-center"
        >
          {state === 'playing' && <Pause size={20} fill="currentColor" />}
          {state === 'paused' && <Play size={20} fill="currentColor" />}
          {state === 'finished' && <RotateCw size={20} strokeWidth={2.5} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
