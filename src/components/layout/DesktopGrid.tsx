import { motion } from 'framer-motion';
import { ControlsPanel } from '@/components/controls/ControlsPanel';
import { PreviewStage } from '@/components/preview/PreviewStage';
import { CodePanel } from '@/components/code/CodePanel';

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const sideVariants = (from: 'left' | 'right' | 'center') => ({
  hidden: {
    opacity: 0,
    x: from === 'left' ? -24 : from === 'right' ? 24 : 0,
    y: from === 'center' ? 16 : 0,
    scale: from === 'center' ? 0.98 : 1,
  },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 200, damping: 26 },
  },
});

export function DesktopGrid() {
  return (
    <motion.div
      variants={containerVariants}
      // `grid-rows-[minmax(0,1fr)]` (`grid-rows-1` in Tailwind 3.4+
      // resolves to the same `minmax(0, 1fr)` shape) caps the row at
      // the container's height — auto-rows would let any single
      // overflowing column push the whole row taller, which is what
      // made the CodePanel's long output drag the timeline / stage
      // out of frame on desktop. Combined with `min-h-0` on each
      // panel, every column scrolls inside its own card instead.
      className="grid h-full grid-cols-12 grid-rows-1 gap-4 p-4 sm:p-6"
    >
      <motion.aside
        variants={sideVariants('left')}
        className="col-span-12 lg:col-span-4 xl:col-span-3 min-h-0 overflow-y-auto scrollbar-thin pr-1"
      >
        <ControlsPanel />
      </motion.aside>
      <motion.section
        variants={sideVariants('center')}
        className="col-span-12 lg:col-span-5 xl:col-span-6 min-h-0"
      >
        <PreviewStage />
      </motion.section>
      <motion.section
        variants={sideVariants('right')}
        className="col-span-12 lg:col-span-3 min-h-0"
      >
        <CodePanel />
      </motion.section>
    </motion.div>
  );
}
