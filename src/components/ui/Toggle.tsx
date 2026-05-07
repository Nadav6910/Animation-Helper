import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

type Props = {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
  size?: 'sm' | 'md';
  className?: string;
};

export function Toggle({
  checked,
  onChange,
  label,
  description,
  size = 'md',
  className,
}: Props) {
  const w = size === 'sm' ? 'w-9' : 'w-11';
  const h = size === 'sm' ? 'h-5' : 'h-6';
  const dot = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  // Dot fits inside the track with a 2px gutter on each side.
  const offCalc = '2px';
  const onCalc = size === 'sm' ? 'calc(100% - 16px)' : 'calc(100% - 18px)';

  return (
    <label
      className={cn(
        'flex items-center justify-between gap-3 cursor-pointer select-none',
        className
      )}
    >
      <div>
        {label && (
          <div className="text-sm text-fg font-medium">{label}</div>
        )}
        {description && (
          <div className="text-xs text-fg-subtle">{description}</div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative shrink-0 rounded-full border transition-colors focus-ring',
          w,
          h,
          checked
            ? 'bg-accent border-accent shadow-glow'
            : 'bg-bg-soft border-border/70'
        )}
      >
        <motion.span
          className={cn(
            'absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow-md',
            dot
          )}
          animate={{ left: checked ? onCalc : offCalc }}
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        />
      </button>
    </label>
  );
}
