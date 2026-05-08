import { useAnimationStore } from '@/store/animationStore';
import { TEXT_EFFECTS } from '@/lib/textEffects';

export function TextEffectsPicker() {
  const config = useAnimationStore((s) => s.config);
  const applyConfig = useAnimationStore((s) => s.applyConfig);

  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-fg-subtle font-semibold mb-1.5">
        One-tap text effects
      </div>
      <div className="grid grid-cols-2 gap-2">
        {TEXT_EFFECTS.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => applyConfig(e.apply(config))}
            className="flex flex-col items-start gap-0.5 rounded-lg border border-border/70 bg-bg-soft p-2.5 text-left transition-colors hover:border-accent/60 focus-ring"
          >
            <span className="text-xs font-semibold text-fg">{e.name}</span>
            <span className="text-[11px] text-fg-subtle">{e.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
