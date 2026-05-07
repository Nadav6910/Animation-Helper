import { useAnimationStore } from '@/store/animationStore';
import { Toggle } from '@/components/ui/Toggle';

export function PathDrawControls() {
  const enabled = useAnimationStore((s) =>
    s.config.keyframes.some((k) => typeof k.strokeDashoffset === 'number'),
  );
  const setPathDraw = useAnimationStore((s) => s.setPathDraw);

  return (
    <div className="flex flex-col gap-3">
      <Toggle
        label="Path draw"
        description="Stroke from invisible to fully drawn — runs alongside transforms, opacity, color & filter animations on the same keyframes."
        checked={enabled}
        onChange={setPathDraw}
      />
    </div>
  );
}
