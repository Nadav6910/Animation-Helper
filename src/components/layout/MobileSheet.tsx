import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, type PanInfo } from 'framer-motion';
import { ControlsPanel } from '@/components/controls/ControlsPanel';
import { CodePanel } from '@/components/code/CodePanel';
import { PreviewStage } from '@/components/preview/PreviewStage';
import { Tabs } from '@/components/ui/Tabs';
import { Code2, Sliders, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type SheetSnap = 'closed' | 'half' | 'full';

const CLOSED_PILL_PX = 64;
const PREVIEW_GAP_PX = 8;

// Fractions of the available container height for non-closed snaps.
// Resolved to pixels at runtime via a ResizeObserver so framer-motion can
// interpolate between concrete numbers (mixed-unit tweens like
// '64px' ↔ '58dvh' silently snap instead of animating).
const SNAP_FRACTION: Record<Exclude<SheetSnap, 'closed'>, number> = {
  half: 0.58,
  full: 0.92,
};

const ORDER: SheetSnap[] = ['closed', 'half', 'full'];

function nextSnap(s: SheetSnap, dir: 1 | -1): SheetSnap {
  const i = ORDER.indexOf(s);
  return ORDER[Math.max(0, Math.min(ORDER.length - 1, i + dir))];
}

const SHEET_SPRING = { type: 'spring' as const, stiffness: 260, damping: 24, mass: 1 };

export function MobileSheet() {
  const [snap, setSnap] = useState<SheetSnap>('half');
  const [tab, setTab] = useState<'controls' | 'code'>('controls');

  // Track the actual container height so dvh-based snaps interpolate as
  // concrete pixels. Init from window.innerHeight - top-bar so the first
  // paint is close to the right size; ResizeObserver refines after mount.
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerH, setContainerH] = useState<number>(() =>
    typeof window !== 'undefined' ? Math.max(0, window.innerHeight - 64) : 600,
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerH(el.clientHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const sheetHeights = useMemo<Record<SheetSnap, number>>(
    () => ({
      closed: CLOSED_PILL_PX,
      half: Math.max(180, Math.round(containerH * SNAP_FRACTION.half)),
      full: Math.max(280, Math.round(containerH * SNAP_FRACTION.full)),
    }),
    [containerH],
  );

  const previewBottoms = useMemo<Record<SheetSnap, number>>(
    () => ({
      closed: CLOSED_PILL_PX + PREVIEW_GAP_PX,
      half: sheetHeights.half + PREVIEW_GAP_PX,
      full: sheetHeights.full + PREVIEW_GAP_PX,
    }),
    [sheetHeights],
  );

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    const v = info.velocity.y;
    const o = info.offset.y;
    if (v > 600 || o > 120) setSnap((s) => nextSnap(s, -1));
    else if (v < -600 || o < -120) setSnap((s) => nextSnap(s, 1));
  };

  const isClosed = snap === 'closed';
  const isFull = snap === 'full';

  return (
    <div ref={containerRef} className="relative h-full overflow-hidden">
      <motion.div
        animate={{ bottom: previewBottoms[snap] }}
        transition={SHEET_SPRING}
        className="absolute left-0 right-0 top-0 px-3 pt-3"
      >
        <PreviewStage />
      </motion.div>

      <motion.div
        animate={{ height: sheetHeights[snap] }}
        transition={SHEET_SPRING}
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
            {/* Both panels stay mounted — toggling visibility instead of
                unmounting avoids AnimatePresence wait-mode stalls and
                preserves each panel's local state (e.g. CodePanel format,
                ControlsPanel scroll position) across tab swaps. */}
            <div className={cn('pb-6', tab === 'controls' ? 'block' : 'hidden')}>
              <ControlsPanel />
            </div>
            <div
              className={cn(
                'h-full min-h-[240px] pb-6',
                tab === 'code' ? 'block' : 'hidden',
              )}
            >
              <CodePanel />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
