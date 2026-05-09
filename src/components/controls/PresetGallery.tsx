import { useMemo, useState } from 'react';
import { Shuffle, Heart, X, Eraser } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAnimationStore } from '@/store/animationStore';
import { useSavedPresetsStore } from '@/store/savedPresetsStore';
import {
  PRESETS,
  PRESET_CATEGORIES,
  presetsByCategory,
  randomPreset,
  type Preset,
  type PresetCategory,
} from '@/lib/presets';
import { PresetMiniPreview } from './PresetMiniPreview';
import { cn } from '@/lib/cn';

type TabId = PresetCategory | 'saved';

const TABS: { id: TabId; label: string }[] = [
  ...PRESET_CATEGORIES.map((c) => ({ id: c.id as TabId, label: c.label })),
  { id: 'saved' as TabId, label: 'Saved' },
];

export function PresetGallery() {
  const [tab, setTab] = useState<TabId>('entrance');
  // Track the last preset Surprise-me dished out so we never roll the
  // same one two clicks in a row — feels broken when it happens.
  const [lastSurpriseId, setLastSurpriseId] = useState<string | null>(null);
  const applyPreset = useAnimationStore((s) => s.applyPreset);
  const resetAll = useAnimationStore((s) => s.resetAll);
  const saved = useSavedPresetsStore((s) => s.saved);
  const remove = useSavedPresetsStore((s) => s.remove);

  const items: { key: string; name: string; build: () => ReturnType<Preset['build']>; deletable?: boolean; id?: string }[] =
    useMemo(() => {
      if (tab === 'saved') {
        return saved.map((s) => ({
          key: s.id,
          id: s.id,
          name: s.name,
          build: () => JSON.parse(JSON.stringify(s.config)),
          deletable: true,
        }));
      }
      return presetsByCategory(tab).map((p) => ({
        key: p.id,
        name: p.name,
        build: p.build,
      }));
    }, [tab, saved]);

  const onSurprise = () => {
    const p = randomPreset(lastSurpriseId ?? undefined);
    setLastSurpriseId(p.id);
    applyPreset(p.build());
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" className="flex flex-wrap gap-1 rounded-xl border border-border/70 bg-bg-soft p-1">
          {TABS.map((t) => {
            const active = t.id === tab;
            const count =
              t.id === 'saved'
                ? saved.length
                : PRESETS.filter((p) => p.category === t.id).length;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={cn(
                  'relative h-7 rounded-lg px-2.5 text-xs transition-colors focus-ring',
                  active ? 'text-fg' : 'text-fg-muted hover:text-fg'
                )}
              >
                {active && (
                  <motion.span
                    layoutId="preset-tab-indicator"
                    className="absolute inset-0 rounded-lg bg-bg-panel border border-border-strong/60"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
                  {t.label}
                  <span className="text-[10px] tabular-nums text-fg-subtle">{count}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={resetAll}
            aria-label="Clear and start with a blank canvas"
            className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border/70 bg-bg-soft px-2.5 text-xs text-fg-muted hover:text-fg focus-ring transition-colors"
            title="Clear and start with a blank canvas"
          >
            <Eraser size={13} />
            Start blank
          </button>
          <button
            type="button"
            onClick={onSurprise}
            aria-label="Apply a random preset"
            className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border/70 bg-bg-soft px-2.5 text-xs text-fg-muted hover:text-fg focus-ring transition-colors"
            title="Apply a random preset"
          >
            <Shuffle size={13} />
            Surprise me
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {items.map((it) => (
            <PresetCard
              key={it.key}
              name={it.name}
              build={it.build}
              onApply={() => applyPreset(it.build())}
              onDelete={it.deletable && it.id ? () => remove(it.id!) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PresetCard({
  name,
  build,
  onApply,
  onDelete,
}: {
  name: string;
  build: () => ReturnType<Preset['build']>;
  onApply: () => void;
  onDelete?: () => void;
}) {
  const cfg = useMemo(() => build(), [build]);
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onApply}
        className="flex w-full flex-col gap-1.5 rounded-xl border border-border/60 bg-bg-panel p-2 text-left transition-colors hover:border-accent/60 focus-ring"
      >
        <PresetMiniPreview config={cfg} />
        <div className="px-0.5 text-xs font-medium text-fg truncate">{name}</div>
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-bg-soft text-fg-muted opacity-0 transition-opacity hover:text-rose-400 focus-ring group-hover:opacity-100"
          aria-label="Delete saved preset"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

function EmptyState({ tab }: { tab: TabId }) {
  if (tab === 'saved') {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 bg-bg-soft/40 px-4 py-6 text-center">
        <Heart size={18} className="text-fg-muted" />
        <div className="text-sm text-fg">No saved presets yet</div>
        <div className="text-xs text-fg-subtle">
          Tap the heart in the top bar to save the current animation here.
        </div>
      </div>
    );
  }
  return null;
}
