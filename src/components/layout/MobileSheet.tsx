import { useState } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { ControlsPanel } from '@/components/controls/ControlsPanel';
import { CodePanel } from '@/components/code/CodePanel';
import { PreviewStage } from '@/components/preview/PreviewStage';
import { Tabs } from '@/components/ui/Tabs';
import { Code2, Sliders, Maximize2, Minimize2 } from 'lucide-react';

type SheetSnap = 'closed' | 'peek' | 'half' | 'full';

const SHEET_HEIGHT: Record<SheetSnap, string> = {
  closed: '64px',
  peek: '24vh',
  half: '58vh',
  full: '92vh',
};

const PREVIEW_BOTTOM: Record<SheetSnap, string> = {
  closed: '72px',
  peek: 'calc(24vh + 8px)',
  half: 'calc(58vh + 8px)',
  full: 'calc(92vh + 8px)',
};

const ORDER: SheetSnap[] = ['closed', 'peek', 'half', 'full'];

function nextSnap(s: SheetSnap, dir: 1 | -1): SheetSnap {
  const i = ORDER.indexOf(s);
  return ORDER[Math.max(0, Math.min(ORDER.length - 1, i + dir))];
}

export function MobileSheet() {
  const [snap, setSnap] = useState<SheetSnap>('half');
  const [tab, setTab] = useState<'controls' | 'code'>('controls');

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    const v = info.velocity.y;
    const o = info.offset.y;
    if (v > 600 || o > 120) setSnap((s) => nextSnap(s, -1));
    else if (v < -600 || o < -120) setSnap((s) => nextSnap(s, 1));
  };

  const isClosed = snap === 'closed';
  const isFull = snap === 'full';

  return (
    <div className="relative h-full overflow-hidden">
      <motion.div
        animate={{ bottom: PREVIEW_BOTTOM[snap] }}
        transition={{ type: 'spring', stiffness: 320, damping: 36 }}
        className="absolute left-0 right-0 top-0 px-3 pt-3"
      >
        <PreviewStage />
      </motion.div>

      <motion.div
        animate={{ height: SHEET_HEIGHT[snap] }}
        transition={{ type: 'spring', stiffness: 320, damping: 36 }}
        drag="y"
        dragElastic={0.05}
        dragConstraints={{ top: 0, bottom: 0 }}
        onDragEnd={handleDragEnd}
        className="absolute inset-x-0 bottom-0 z-30 flex flex-col rounded-t-3xl border-t border-border/70 bg-bg-panel/90 backdrop-blur-xl shadow-glass"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <button
          type="button"
          aria-label={isClosed ? 'Open controls' : 'Cycle sheet height'}
          onClick={() =>
            setSnap((s) =>
              s === 'closed' ? 'half' : s === 'full' ? 'half' : nextSnap(s, 1),
            )
          }
          className="group flex w-full justify-center py-3 focus-ring"
        >
          <span className="h-1.5 w-14 rounded-full bg-border-strong/80 group-hover:bg-border-strong transition-colors" />
        </button>

        {!isClosed && (
          <div className="flex items-center gap-2 px-3 pb-3">
            <div className="flex-1">
              <Tabs
                value={tab}
                onChange={setTab}
                fullWidth
                tabs={[
                  {
                    value: 'controls',
                    label: 'Controls',
                    icon: <Sliders size={14} />,
                  },
                  { value: 'code', label: 'Code', icon: <Code2 size={14} /> },
                ]}
              />
            </div>
            <button
              type="button"
              onClick={() => setSnap(isFull ? 'closed' : 'full')}
              aria-label={isFull ? 'Focus preview' : 'Expand sheet'}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border/70 bg-bg-soft text-fg-muted transition-colors hover:text-fg focus-ring"
            >
              {isFull ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        )}

        {isClosed && (
          <button
            type="button"
            onClick={() => setSnap('half')}
            className="flex w-full items-center justify-center gap-2 px-4 py-1 text-xs font-medium text-fg-muted focus-ring"
          >
            <Sliders size={14} />
            Tap to open controls
          </button>
        )}

        {!isClosed && (
          <div
            className="flex-1 overflow-y-auto scrollbar-thin px-2 sm:px-3"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}
          >
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
                  className="h-full min-h-[240px] pb-6"
                >
                  <CodePanel />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}
