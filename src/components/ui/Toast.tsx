import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';

type Props = {
  visible: boolean;
  message: string;
};

export function Toast({ visible, message }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 24, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 12, opacity: 0, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 rounded-full border border-accent/40 bg-bg-panel/90 px-4 py-2 text-sm shadow-glow backdrop-blur-xl">
            <span className="grid place-items-center h-5 w-5 rounded-full bg-accent text-accent-contrast">
              <Check size={12} strokeWidth={3} />
            </span>
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
