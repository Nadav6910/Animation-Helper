import { cn } from '@/lib/cn';

type Props = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  label?: string;
  hint?: string;
  className?: string;
};

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
  label,
  hint,
  className,
}: Props) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {(label || hint) && (
        <div className="flex items-center justify-between text-xs">
          {label && (
            <span className="text-fg-muted font-medium">{label}</span>
          )}
          {hint && <span className="text-fg-subtle tabular-nums">{hint}</span>}
        </div>
      )}
      <div className="relative h-9 flex items-center">
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-bg-soft border border-border/60" />
        <div
          className="absolute h-1.5 rounded-full bg-gradient-to-r from-accent to-accent/60"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          aria-label={label}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={format ? format(value) : undefined}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="ah-slider relative w-full h-9 appearance-none bg-transparent focus-ring rounded-full"
        />
      </div>
      {format && (
        <div className="text-xs text-fg-subtle tabular-nums">
          {format(value)}
        </div>
      )}
    </div>
  );
}
