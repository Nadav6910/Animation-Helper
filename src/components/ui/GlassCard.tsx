import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  inset?: boolean;
};

export function GlassCard({ children, className, inset, ...rest }: Props) {
  return (
    <div
      className={cn(
        'card relative',
        inset ? 'p-4' : 'p-5',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
