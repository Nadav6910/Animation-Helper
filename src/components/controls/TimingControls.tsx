import { useAnimationStore } from '@/store/animationStore';
import { Slider } from '@/components/ui/Slider';
import { NumberInput } from '@/components/ui/NumberInput';
import { Toggle } from '@/components/ui/Toggle';
import { Tabs } from '@/components/ui/Tabs';
import type { Direction, FillMode } from '@/types/animation';

export function TimingControls() {
  const config = useAnimationStore((s) => s.config);
  const setDuration = useAnimationStore((s) => s.setDuration);
  const setDelay = useAnimationStore((s) => s.setDelay);
  const setIterations = useAnimationStore((s) => s.setIterations);
  const setDirection = useAnimationStore((s) => s.setDirection);
  const setFill = useAnimationStore((s) => s.setFill);

  const infinite = config.iterations === 'infinite';

  return (
    <div className="flex flex-col gap-4">
      <Slider
        label="Duration"
        hint={
          config.duration >= 1000
            ? `${(config.duration / 1000).toFixed(1)}s`
            : `${config.duration}ms`
        }
        value={config.duration}
        onChange={setDuration}
        min={100}
        max={20000}
        step={100}
      />

      <div className="grid grid-cols-2 gap-3">
        <NumberInput
          label="Delay"
          value={config.delay}
          onChange={(v) => setDelay(Math.max(0, v))}
          step={100}
          min={0}
          max={60000}
          suffix="ms"
          defaultValue={0}
        />
        <NumberInput
          label="Iterations"
          value={infinite ? 0 : Number(config.iterations)}
          onChange={(v) => setIterations(Math.max(1, v))}
          min={1}
          max={20}
          step={1}
          defaultValue={1}
        />
      </div>

      <Toggle
        label="Loop forever"
        description="Use infinite iteration count"
        checked={infinite}
        onChange={(v) => setIterations(v ? 'infinite' : 1)}
      />

      <div className="flex flex-col gap-2">
        <span className="text-[11px] uppercase tracking-wider text-fg-subtle font-semibold">
          Direction
        </span>
        <Tabs<Direction>
          fullWidth
          value={config.direction}
          onChange={setDirection}
          tabs={[
            { value: 'normal', label: 'Normal' },
            { value: 'reverse', label: 'Reverse' },
            { value: 'alternate', label: 'Alternate' },
            { value: 'alternate-reverse', label: 'Alt-rev' },
          ]}
          size="sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] uppercase tracking-wider text-fg-subtle font-semibold">
          Fill mode
        </span>
        <Tabs<FillMode>
          fullWidth
          value={config.fill}
          onChange={setFill}
          tabs={[
            { value: 'none', label: 'None' },
            { value: 'forwards', label: 'Forwards' },
            { value: 'backwards', label: 'Backwards' },
            { value: 'both', label: 'Both' },
          ]}
          size="sm"
        />
      </div>
    </div>
  );
}
