import { useState } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { ControlsPanel } from '@/components/controls/ControlsPanel';
import { CodePanel } from '@/components/code/CodePanel';
import { PreviewStage } from '@/components/preview/PreviewStage';
import { Tabs } from '@/components/ui/Tabs';
import { Code2, Sliders } from 'lucide-react';

type SheetSnap = 'peek' | 'half' | 'full';

const SNAP_HEIGHT: Record<SheetSnap, string> = {
  peek: '20%',
  half: '55%',
  full: '92%',
};

export function MobileSheet() {
  const [snap, setSnap] = useState<SheetSnap>('half');
  const [tab, setTab] = useState<'controls' | 'code'>('controls');

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    const v = info.velocity.y;
    const o = info.offset.y;
    if (snap === 'full' && (v > 600 || o > 120)) setSnap('half');
    else if (snap === 'half' && (v > 600 || o > 120)) setSnap('peek');
    else if (snap === 'peek' && (v < -600 || o < -120)) setSnap('half');
    else if (snap === 'half' && (v < -600 || o < -120)) setSnap('full');
  };

  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0 px-4 pt-4 pb-[24%]">
        <PreviewStage />
      </div>
      <motion.div
        animate={{ height: SNAP_HEIGHT[snap] }}
        transition={{ type: 'spring', stiffness: 320, damping: 36 }}
        drag="y"
        dragElastic={0.05}
        dragConstraints={{ top: 0, bottom: 0 }}
        onDragEnd={handleDragEnd}
        className="absolute inset-x-0 bottom-0 z-30 flex flex-col rounded-t-3xl border-t border-border/70 bg-bg-panel/85 backdrop-blur-xl shadow-glass"
      >
        <button
          type="button"
          aria-label="Drag handle"
          onClick={() =>
            setSnap(snap === 'full' ? 'half' : snap === 'half' ? 'full' : 'half')
          }
          className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-border-strong/80"
        />
        <div className="px-4 py-3">
          <Tabs
            value={tab}
            onChange={setTab}
            fullWidth
            tabs={[
              { value: 'controls', label: 'Controls', icon: <Sliders size={14} /> },
              { value: 'code', label: 'Code', icon: <Code2 size={14} /> },
            ]}
          />
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-[env(safe-area-inset-bottom)]">
          <AnimatePresence mode="wait" initial={false}>
            {tab === 'controls' ? (
              <motion.div
                key="controls"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="pb-6"
              >
                <ControlsPanel />
              </motion.div>
            ) : (
              <motion.div
                key="code"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="pb-6 h-full min-h-[320px]"
              >
                <CodePanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
