import { useAnimationStore } from '@/store/animationStore';
import { NumberInput } from '@/components/ui/NumberInput';

// Paths are intentionally small and centred near (0,0) because offset-path
// is anchored to the element's own box origin — large numbers would push
// the element well off-stage. The viewBox in the picker SVG below is
// sized -100..100 / -60..60 to match.
const PRESETS: { label: string; d: string }[] = [
  { label: 'Straight', d: 'M-80,0 L80,0' },
  { label: 'Arc', d: 'M-80,30 Q0,-50 80,30' },
  { label: 'Wave', d: 'M-80,0 Q-40,-40 0,0 T80,0' },
  { label: 'Circle', d: 'M0,0 m-50,0 a50,50 0 1,0 100,0 a50,50 0 1,0 -100,0' },
  { label: 'Loop', d: 'M-80,30 Q-40,30 -40,0 Q-40,-30 0,-30 Q40,-30 40,0 Q40,30 80,30' },
  { label: 'Zigzag', d: 'M-80,30 L-40,-30 L0,30 L40,-30 L80,30' },
];

export function OffsetPathSection() {
  const offsetPath = useAnimationStore((s) => s.config.offsetPath);
  const keyframes = useAnimationStore((s) => s.config.keyframes);
  const selectedId = useAnimationStore((s) => s.selectedKeyframeId);
  const setOffsetPath = useAnimationStore((s) => s.setOffsetPath);
  const updateKeyframe = useAnimationStore((s) => s.updateKeyframe);

  const enabled = !!offsetPath;
  const selected = keyframes.find((k) => k.id === selectedId);
  const distance = selected?.offsetDistance ?? 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-fg-muted">
          Move the target along an SVG path.
        </div>
        <button
          type="button"
          onClick={() =>
            enabled
              ? setOffsetPath(undefined)
              : setOffsetPath({ d: PRESETS[1].d, rotate: 'auto' })
          }
          className={
            'h-7 rounded-lg border px-2.5 text-xs focus-ring transition-colors ' +
            (enabled
              ? 'bg-accent/15 border-accent/50 text-fg'
              : 'bg-bg-soft border-border/70 text-fg-muted hover:text-fg')
          }
        >
          {enabled ? 'On' : 'Off'}
        </button>
      </div>
      {enabled && offsetPath && (
        <>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-fg-subtle font-semibold mb-1.5">
              Path presets
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {PRESETS.map((p) => {
                const active = offsetPath.d === p.d;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setOffsetPath({ ...offsetPath, d: p.d })}
                    className={
                      'flex flex-col items-center gap-1 rounded-lg border p-1.5 focus-ring transition-colors ' +
                      (active
                        ? 'bg-accent/10 border-accent/50'
                        : 'bg-bg-soft border-border/70 hover:border-border-strong')
                    }
                  >
                    <svg viewBox="-100 -60 200 120" width="100%" height="32" preserveAspectRatio="xMidYMid meet">
                      <path
                        d={p.d}
                        fill="none"
                        stroke="rgb(var(--accent))"
                        strokeWidth={4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-[11px] text-fg-muted">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wider text-fg-subtle font-semibold mb-1.5">
              SVG path · d=
            </div>
            <textarea
              rows={2}
              value={offsetPath.d}
              onChange={(e) => setOffsetPath({ ...offsetPath, d: e.target.value })}
              className="w-full rounded-lg border border-border/70 bg-bg-soft p-2 font-mono text-[11px] focus-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumberInput
              size="sm"
              label="Selected · distance"
              value={distance}
              onChange={(v) => selected && updateKeyframe(selected.id, { offsetDistance: v })}
              min={0}
              max={100}
              step={5}
              suffix="%"
            />
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-wider text-fg-subtle font-semibold">
                Rotate
              </span>
              <div className="flex items-stretch rounded-lg border border-border/70 bg-bg-soft overflow-hidden h-8">
                {(['auto', 'reverse', 'none'] as const).map((mode) => {
                  const active =
                    (mode === 'none' && offsetPath.rotate === undefined) ||
                    offsetPath.rotate === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() =>
                        setOffsetPath({
                          ...offsetPath,
                          rotate: mode === 'none' ? undefined : mode,
                        })
                      }
                      className={
                        'flex-1 text-xs transition-colors focus-ring ' +
                        (active ? 'bg-accent/15 text-fg' : 'text-fg-muted hover:text-fg')
                      }
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
