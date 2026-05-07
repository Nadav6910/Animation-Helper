import { useAnimationStore } from '@/store/animationStore';
import { Toggle } from '@/components/ui/Toggle';
import { Slider } from '@/components/ui/Slider';
import { motion, AnimatePresence } from 'framer-motion';

export function StaggerControls() {
  const stagger = useAnimationStore((s) => s.config.stagger);
  const setStagger = useAnimationStore((s) => s.setStagger);
  const enabled = !!stagger;

  return (
    <div className="flex flex-col gap-3">
      <Toggle
        label="Per-letter stagger"
        description="Each character animates with a delay"
        checked={enabled}
        onChange={(v) => setStagger(v ? 60 : null)}
      />
      <AnimatePresence initial={false}>
        {enabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="overflow-hidden"
          >
            <div className="pt-1">
              <Slider
                label="Step"
                hint={`${stagger?.step ?? 60}ms per character`}
                value={stagger?.step ?? 60}
                onChange={(v) => setStagger(v)}
                min={10}
                max={400}
                step={10}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
