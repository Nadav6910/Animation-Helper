import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  label?: string;
  active?: boolean;
  variant?: 'default' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
};

const sizes = {
  sm: 'h-9 w-9 sm:h-8 sm:w-8',
  md: 'h-11 w-11 sm:h-10 sm:w-10',
  lg: 'h-12 w-12',
};

export function IconButton({
  children,
  label,
  active,
  variant = 'default',
  size = 'md',
  className,
  ...rest
}: Props) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-xl border focus-ring transition-colors',
        sizes[size],
        variant === 'accent' &&
          'bg-accent text-accent-contrast border-transparent shadow-glow',
        variant === 'default' &&
          (active
            ? 'bg-accent/15 border-accent/40 text-fg'
            : 'bg-bg-soft border-border/70 text-fg hover:bg-bg-panel hover:border-border-strong'),
        variant === 'ghost' &&
          'border-transparent text-fg-muted hover:text-fg hover:bg-bg-soft',
        className
      )}
      {...(rest as React.ComponentProps<typeof motion.button>)}
    >
      {children}
    </motion.button>
  );
}
