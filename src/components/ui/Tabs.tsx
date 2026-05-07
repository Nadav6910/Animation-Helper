import { motion, LayoutGroup } from 'framer-motion';
import { cn } from '@/lib/cn';

type Tab<T extends string> = { value: T; label: string; icon?: React.ReactNode };

type Props<T extends string> = {
  tabs: Tab<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  fullWidth?: boolean;
};

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  size = 'md',
  className,
  fullWidth,
}: Props<T>) {
  return (
    <LayoutGroup id={`tabs-${tabs.map((t) => t.value).join('-')}`}>
      <div
        role="tablist"
        className={cn(
          'inline-flex items-center gap-1 p-1 rounded-xl border border-border/70 bg-bg-soft',
          fullWidth && 'w-full',
          className
        )}
      >
        {tabs.map((t) => {
          const active = value === t.value;
          return (
            <button
              key={t.value}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(t.value)}
              className={cn(
                'relative flex items-center justify-center gap-1.5 rounded-lg px-3 transition-colors focus-ring',
                size === 'sm' ? 'h-7 text-xs' : 'h-8 text-sm',
                fullWidth && 'flex-1',
                active ? 'text-fg' : 'text-fg-muted hover:text-fg'
              )}
            >
              {active && (
                <motion.span
                  layoutId="tabs-indicator"
                  className="absolute inset-0 rounded-lg bg-bg-panel border border-border-strong/60 shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
                {t.icon}
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
