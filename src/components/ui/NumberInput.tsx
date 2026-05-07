import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

type Props = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  suffix?: string;
  className?: string;
  size?: 'sm' | 'md';
};

export function NumberInput({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  label,
  suffix,
  className,
  size = 'md',
}: Props) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const set = (n: number) => onChange(clamp(Number.isFinite(n) ? n : 0));

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <span className="text-[11px] uppercase tracking-wider text-fg-subtle font-semibold">
          {label}
        </span>
      )}
      <div
        className={cn(
          'flex items-stretch rounded-lg border border-border/70 bg-bg-soft overflow-hidden focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/30 transition-colors',
          size === 'sm' ? 'h-8' : 'h-10'
        )}
      >
        <button
          type="button"
          aria-label="Decrease"
          className="px-2 text-fg-muted hover:text-fg hover:bg-bg-panel transition-colors"
          onClick={() => set(value - step)}
        >
          <Minus size={14} />
        </button>
        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          step={step}
          min={Number.isFinite(min) ? min : undefined}
          max={Number.isFinite(max) ? max : undefined}
          onChange={(e) => set(Number(e.target.value))}
          className="w-full min-w-0 bg-transparent text-center text-sm tabular-nums outline-none"
        />
        {suffix && (
          <span className="px-2 grid place-items-center text-xs text-fg-subtle">
            {suffix}
          </span>
        )}
        <button
          type="button"
          aria-label="Increase"
          className="px-2 text-fg-muted hover:text-fg hover:bg-bg-panel transition-colors"
          onClick={() => set(value + step)}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
