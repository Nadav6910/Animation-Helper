import { useAnimationStore } from '@/store/animationStore';
import { NumberInput } from '@/components/ui/NumberInput';
import type { Rotate3d } from '@/types/animation';

const DEFAULT_ROTATE_3D: Rotate3d = { x: 1, y: 1, z: 0, deg: 0 };

export function Transform3DSection() {
  const selectedId = useAnimationStore((s) => s.selectedKeyframeId);
  const keyframe = useAnimationStore((s) =>
    s.config.keyframes.find((k) => k.id === selectedId)
  );
  const updateTransform = useAnimationStore((s) => s.updateKeyframeTransform);

  if (!keyframe) return null;
  const t = keyframe.transform ?? {};
  const rot3d = t.rotate3d ?? DEFAULT_ROTATE_3D;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <NumberInput
          size="sm"
          label="Translate Z"
          value={t.translateZ ?? 0}
          onChange={(v) => updateTransform(keyframe.id, { translateZ: v })}
          step={5}
          suffix="px"
        />
        <NumberInput
          size="sm"
          label="Perspective"
          value={t.perspective ?? 0}
          onChange={(v) =>
            updateTransform(keyframe.id, { perspective: v <= 0 ? undefined : v })
          }
          min={0}
          step={50}
          suffix="px"
        />
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-wider text-fg-subtle font-semibold mb-1.5">
          Rotate 3D · axis vector + angle
        </div>
        <div className="grid grid-cols-4 gap-2">
          <NumberInput
            size="sm"
            label="X"
            value={rot3d.x}
            onChange={(v) =>
              updateTransform(keyframe.id, {
                rotate3d: { ...rot3d, x: v },
              })
            }
            step={0.5}
            min={-1}
            max={1}
          />
          <NumberInput
            size="sm"
            label="Y"
            value={rot3d.y}
            onChange={(v) =>
              updateTransform(keyframe.id, {
                rotate3d: { ...rot3d, y: v },
              })
            }
            step={0.5}
            min={-1}
            max={1}
          />
          <NumberInput
            size="sm"
            label="Z"
            value={rot3d.z}
            onChange={(v) =>
              updateTransform(keyframe.id, {
                rotate3d: { ...rot3d, z: v },
              })
            }
            step={0.5}
            min={-1}
            max={1}
          />
          <NumberInput
            size="sm"
            label="Deg"
            value={rot3d.deg}
            onChange={(v) =>
              updateTransform(keyframe.id, {
                rotate3d: { ...rot3d, deg: v },
              })
            }
            step={5}
            suffix="°"
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-fg-subtle">
          <span>Set Deg = 0 to disable rotate3d</span>
          {rot3d.deg !== 0 && (
            <button
              type="button"
              onClick={() =>
                updateTransform(keyframe.id, {
                  rotate3d: undefined,
                })
              }
              className="text-fg-muted hover:text-fg focus-ring rounded px-1.5"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
