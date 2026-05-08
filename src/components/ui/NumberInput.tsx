import { useRef, useState } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';

type Props = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  suffix?: string;
  /**
   * If set, a subtle reset button appears whenever the value diverges
   * from this default. Clicking it snaps the value back.
   */
  defaultValue?: number;
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
  defaultValue,
  className,
  size = 'md',
}: Props) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const set = (n: number) => onChange(clamp(Number.isFinite(n) ? n : 0));

  // Buffered keyboard editing: while focused the input shows `localText`
  // (cleared on focus so users can type a fresh number without first
  // deleting the existing one). On blur, commit if it parses as a number;
  // otherwise no-op so the value snaps back to whatever was committed
  // before focus. Enter / Escape both blur (Escape discards `localText`).
  const focusValueRef = useRef(value);
  const [localText, setLocalText] = useState('');
  const [focused, setFocused] = useState(false);

  const display = focused
    ? localText
    : Number.isFinite(value)
      ? String(value)
      : '0';

  const showReset =
    defaultValue !== undefined && !focused && value !== defaultValue;

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
          value={display}
          step={step}
          min={Number.isFinite(min) ? min : undefined}
          max={Number.isFinite(max) ? max : undefined}
          onFocus={() => {
            focusValueRef.current = value;
            setFocused(true);
            setLocalText('');
          }}
          onChange={(e) => setLocalText(e.target.value)}
          onBlur={() => {
            setFocused(false);
            const trimmed = localText.trim();
            if (trimmed !== '') {
              const n = Number(trimmed);
              if (Number.isFinite(n)) set(n);
            }
            setLocalText('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            } else if (e.key === 'Escape') {
              setLocalText('');
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="w-full min-w-0 bg-transparent text-center text-sm tabular-nums outline-none"
        />
        {suffix && (
          <span className="px-2 grid place-items-center text-xs text-fg-subtle">
            {suffix}
          </span>
        )}
        {showReset && (
          <button
            type="button"
            aria-label="Reset to default"
            title="Reset to default"
            onClick={() => set(defaultValue)}
            className="px-1.5 text-fg-subtle/70 hover:text-fg-muted hover:bg-bg-panel/60 transition-colors focus-ring"
          >
            <RotateCcw size={11} />
          </button>
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
