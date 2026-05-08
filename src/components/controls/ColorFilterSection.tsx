import { useAnimationStore } from '@/store/animationStore';
import { Slider } from '@/components/ui/Slider';
import { GradientField } from './GradientField';

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
      <div className="flex flex-col gap-3">
        <GradientField
          label="Fill / text color"
          value={color}
          onChange={(v) => update(keyframe.id, { color: v || undefined })}
        />
        <GradientField
          label="Background"
          value={bg}
          onChange={(v) => update(keyframe.id, { bg: v || undefined })}
        />
      </div>
    </div>
  );
}
