import { useAnimationStore } from '@/store/animationStore';
import { Slider } from '@/components/ui/Slider';

export function ColorFilterSection() {
  const selectedId = useAnimationStore((s) => s.selectedKeyframeId);
  const keyframe = useAnimationStore((s) =>
    s.config.keyframes.find((k) => k.id === selectedId)
  );
  const update = useAnimationStore((s) => s.updateKeyframe);

  if (!keyframe) return null;

  const opacity = keyframe.opacity ?? 1;
  const blur = keyframe.blur ?? 0;
  const hue = keyframe.hueRotate ?? 0;
  const color = keyframe.color ?? '';
  const bg = keyframe.bg ?? '';

  return (
    <div className="flex flex-col gap-4">
      <Slider
        label="Opacity"
        hint={`${Math.round(opacity * 100)}%`}
        value={opacity}
        onChange={(v) => update(keyframe.id, { opacity: v })}
        min={0}
        max={1}
        step={0.01}
      />
      <Slider
        label="Blur"
        hint={`${blur.toFixed(0)}px`}
        value={blur}
        onChange={(v) => update(keyframe.id, { blur: v })}
        min={0}
        max={20}
        step={0.5}
      />
      <Slider
        label="Hue rotate"
        hint={`${hue}°`}
        value={hue}
        onChange={(v) => update(keyframe.id, { hueRotate: v })}
        min={0}
        max={360}
        step={1}
      />
      <div className="grid grid-cols-2 gap-3">
        <ColorField
          label="Fill / text color"
          value={color}
          onChange={(v) => update(keyframe.id, { color: v || undefined })}
        />
        <ColorField
          label="Background"
          value={bg}
          onChange={(v) => update(keyframe.id, { bg: v || undefined })}
        />
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wider text-fg-subtle font-semibold">
        {label}
      </span>
      <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-bg-soft px-2 h-10 focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/30">
        <input
          type="color"
          value={value || '#7c5cff'}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-7 rounded-md border border-border/60 bg-transparent cursor-pointer"
          aria-label={label}
        />
        <input
          type="text"
          value={value}
          placeholder="—"
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 bg-transparent text-xs font-mono outline-none"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-fg-subtle hover:text-fg text-xs"
            aria-label={`Clear ${label}`}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
