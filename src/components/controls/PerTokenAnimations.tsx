import { useMemo, useState } from 'react';
import { useAnimationStore } from '@/store/animationStore';
import { TEXT_PRESETS } from '@/lib/presets/text';
import {
  tokenize,
  tokenizeModeOf,
  buildTokenPresetMap,
  assignTokenPreset,
  clearTokenPreset,
} from '@/lib/tokenize';
import { cn } from '@/lib/cn';

const isWhitespace = (s: string) => /^\s+$/.test(s);

// Stable ring palette so chips sharing a preset read as a group.
// Cycled by first-seen order of presetId in tokenAnimations.
const RING = [
  'ring-sky-400/70',
  'ring-violet-400/70',
  'ring-emerald-400/70',
  'ring-amber-400/70',
  'ring-rose-400/70',
  'ring-cyan-400/70',
];

export function PerTokenAnimations() {
  const config = useAnimationStore((s) => s.config);
  const setTokenizeMode = useAnimationStore((s) => s.setTokenizeMode);
  const setTokenAnimations = useAnimationStore((s) => s.setTokenAnimations);

  const mode = tokenizeModeOf(config);
  const display = config.text || 'Animate';
  const tokens = useMemo(() => tokenize(display, mode), [display, mode]);
  const presetMap = useMemo(
    () => buildTokenPresetMap(config.tokenAnimations),
    [config.tokenAnimations]
  );

  // First-seen presetId order → ring colour, so the legend and the
  // chips agree regardless of which token the user inspects.
  const presetColor = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of config.tokenAnimations ?? []) {
      if (!m.has(e.presetId)) m.set(e.presetId, RING[m.size % RING.length]);
    }
    return m;
  }, [config.tokenAnimations]);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [anchor, setAnchor] = useState<number | null>(null);
  const [presetId, setPresetId] = useState(TEXT_PRESETS[0]?.id ?? '');

  const wsIndices = useMemo(() => {
    const s = new Set<number>();
    tokens.forEach((t, i) => isWhitespace(t) && s.add(i));
    return s;
  }, [tokens]);

  function toggle(i: number, shift: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (shift && anchor !== null) {
        const [lo, hi] = anchor < i ? [anchor, i] : [i, anchor];
        for (let k = lo; k <= hi; k++) {
          if (!wsIndices.has(k)) next.add(k);
        }
      } else if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
      }
      return next;
    });
    setAnchor(i);
  }

  const selectedArr = useMemo(() => [...selected], [selected]);
  const hasSelection = selectedArr.length > 0;
  const hasOverrides = !!config.tokenAnimations?.length;

  function apply() {
    if (!hasSelection || !presetId) return;
    setTokenAnimations(
      assignTokenPreset(config.tokenAnimations, selectedArr, presetId)
    );
    setSelected(new Set());
    setAnchor(null);
  }

  function clearSelection() {
    if (!hasSelection) return;
    setTokenAnimations(clearTokenPreset(config.tokenAnimations, selectedArr));
    setSelected(new Set());
    setAnchor(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="text-[11px] uppercase tracking-wider text-fg-subtle font-semibold mb-1.5">
          Per-token animations
        </div>
        <p className="text-[11px] text-fg-subtle mb-2">
          Give specific {mode === 'word' ? 'words' : 'letters'} their own
          animation. Click to select, Shift-click for a range.
        </p>
      </div>

      <div
        className="flex rounded-lg border border-border/70 bg-bg-soft p-0.5 text-xs"
        role="group"
        aria-label="Tokenize mode"
      >
        {(['letter', 'word'] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setTokenizeMode(m)}
            className={cn(
              'flex-1 rounded-md px-2 py-1 font-medium capitalize transition-colors focus-ring',
              mode === m
                ? 'bg-accent text-white shadow-glow'
                : 'text-fg-subtle hover:text-fg'
            )}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tokens.map((tok, i) => {
          if (wsIndices.has(i)) {
            return (
              <span
                key={i}
                aria-hidden
                className="w-2 self-center"
              />
            );
          }
          const sel = selected.has(i);
          const assigned = presetMap.get(i);
          const ring = assigned ? presetColor.get(assigned) : undefined;
          return (
            <button
              key={i}
              type="button"
              aria-pressed={sel}
              title={assigned ? `Animated by “${assigned}”` : undefined}
              onClick={(e) => toggle(i, e.shiftKey)}
              className={cn(
                'min-w-[1.75rem] rounded-md border px-2 py-1 text-sm font-medium transition-colors focus-ring',
                sel
                  ? 'border-accent bg-accent/15 text-fg'
                  : 'border-border/70 bg-bg-soft text-fg hover:border-accent/60',
                assigned && 'ring-2 ring-offset-0',
                ring
              )}
            >
              {tok}
            </button>
          );
        })}
      </div>

      {presetColor.size > 0 && (
        <div className="flex flex-col gap-1">
          {[...presetColor.entries()].map(([pid, ring]) => (
            <div
              key={pid}
              className="flex items-center gap-2 text-[11px] text-fg-subtle"
            >
              <span
                className={cn(
                  'inline-block h-3 w-3 rounded-sm ring-2',
                  ring
                )}
              />
              <span className="truncate">
                {TEXT_PRESETS.find((p) => p.id === pid)?.name ?? pid}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-[11px] uppercase tracking-wider text-fg-subtle font-semibold">
          Apply preset
        </label>
        <select
          value={presetId}
          onChange={(e) => setPresetId(e.target.value)}
          className="rounded-lg border border-border/70 bg-bg-soft px-2 py-1.5 text-sm text-fg focus-ring"
        >
          {TEXT_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!hasSelection || !presetId}
            onClick={apply}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white shadow-glow transition-opacity hover:opacity-90 focus-ring disabled:opacity-40"
          >
            Apply to selection ({selectedArr.length})
          </button>
          <button
            type="button"
            disabled={!hasSelection}
            onClick={clearSelection}
            className="rounded-lg border border-border/70 bg-bg-soft px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:border-accent/60 focus-ring disabled:opacity-40"
          >
            Reset selection
          </button>
          <button
            type="button"
            disabled={!hasOverrides}
            onClick={() => {
              setTokenAnimations(undefined);
              setSelected(new Set());
              setAnchor(null);
            }}
            className="rounded-lg border border-border/70 bg-bg-soft px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:border-accent/60 focus-ring disabled:opacity-40"
          >
            Reset all
          </button>
        </div>
      </div>
    </div>
  );
}
