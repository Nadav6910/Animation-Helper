import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

type Props = {
  title: string;
  description?: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
};

export function Section({
  title,
  description,
  icon,
  defaultOpen = true,
  children,
  className,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn('card p-0 overflow-hidden', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-3 py-3 sm:px-4 hover:bg-bg-soft/40 focus-ring transition-colors min-h-11"
        aria-expanded={open}
      >
        {icon && (
          <span className="grid place-items-center h-8 w-8 rounded-lg bg-accent/10 text-accent">
            {icon}
          </span>
        )}
        <div className="flex-1 text-left">
          <div className="text-sm font-semibold text-fg">{title}</div>
          {description && (
            <div className="text-xs text-fg-subtle mt-0.5">{description}</div>
          )}
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="text-fg-muted"
        >
          <ChevronDown size={16} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-4 pt-0 sm:px-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
