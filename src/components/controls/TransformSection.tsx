import { useAnimationStore } from '@/store/animationStore';
import { NumberInput } from '@/components/ui/NumberInput';
import type { Transform, Vec2 } from '@/types/animation';

type Axis = 'translate' | 'rotate' | 'skew' | 'scale';

const AXIS_CONFIG: Record<
  Axis,
  { label: string; suffix?: string; step: number; min?: number; max?: number; defaultVal: Vec2 }
> = {
  translate: { label: 'Translate', suffix: 'px', step: 1, defaultVal: [0, 0] },
  rotate: { label: 'Rotate', suffix: 'deg', step: 5, defaultVal: [0, 0] },
  skew: { label: 'Skew', suffix: 'deg', step: 1, min: -90, max: 90, defaultVal: [0, 0] },
  scale: { label: 'Scale', step: 0.05, min: 0, max: 5, defaultVal: [1, 1] },
};

type Props = {
  axis: Axis;
};

export function TransformSection({ axis }: Props) {
  const cfg = AXIS_CONFIG[axis];
  const selectedId = useAnimationStore((s) => s.selectedKeyframeId);
  const keyframe = useAnimationStore((s) =>
    s.config.keyframes.find((k) => k.id === selectedId)
  );
  const updateKeyframeTransform = useAnimationStore(
    (s) => s.updateKeyframeTransform
  );

  if (!keyframe) return null;

  const value = keyframe.transform?.[axis] ?? cfg.defaultVal;
  const setVec = (v: Vec2) => {
    updateKeyframeTransform(keyframe.id, { [axis]: v } as Partial<Transform>);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <NumberInput
        size="sm"
        label={`${cfg.label} X`}
        value={value[0]}
        onChange={(v) => setVec([v, value[1]])}
        step={cfg.step}
        min={cfg.min}
        max={cfg.max}
        suffix={cfg.suffix}
      />
      <NumberInput
        size="sm"
        label={`${cfg.label} Y`}
        value={value[1]}
        onChange={(v) => setVec([value[0], v])}
        step={cfg.step}
        min={cfg.min}
        max={cfg.max}
        suffix={cfg.suffix}
      />
    </div>
  );
}
