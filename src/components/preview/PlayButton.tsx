import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCw } from 'lucide-react';

export type PlayButtonState = 'playing' | 'paused' | 'finished';

type Props = {
  state: PlayButtonState;
  onClick: () => void;
  /** When true, button is muted and inert — used when the config has
   *  no meaningful keyframe diffs and there's nothing to play. The
   *  visual change tells the user the animation is empty rather than
   *  paused. */
  disabled?: boolean;
};

const COPY: Record<PlayButtonState, { aria: string; title: string }> = {
  playing: { aria: 'Pause animation', title: 'Pause' },
  paused: { aria: 'Resume animation', title: 'Resume' },
  finished: { aria: 'Replay animation', title: 'Replay (Space)' },
};

export function PlayButton({ state, onClick, disabled }: Props) {
  const { aria, title } = COPY[state];
  return (
    <motion.button
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? undefined : { scale: 1.05 }}
      whileTap={disabled ? undefined : { scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      className={
        'group relative grid h-12 w-12 place-items-center rounded-full text-accent-contrast shadow-glow focus-ring lg:h-14 lg:w-14 ' +
        (disabled
          ? 'bg-bg-soft text-fg-subtle cursor-not-allowed shadow-none'
          : 'bg-accent')
      }
      aria-label={disabled ? 'No animation defined — edit keyframes to play' : aria}
      aria-disabled={disabled}
      title={disabled ? 'No animation defined' : title}
    >
      <span
        className={
          'absolute inset-0 rounded-full blur-xl transition-colors ' +
          (disabled
            ? 'bg-transparent'
            : 'bg-accent/40 group-hover:bg-accent/60')
        }
      />
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
