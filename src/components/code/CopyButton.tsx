import { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import { copyToClipboard } from '@/lib/clipboard';
import { cn } from '@/lib/cn';

type Props = {
  text: string;
  onCopied?: () => void;
};

export const CopyButton = forwardRef<HTMLButtonElement, Props>(
  function CopyButton({ text, onCopied }, ref) {
    const [done, setDone] = useState(false);

    const handle = async () => {
      const ok = await copyToClipboard(text);
      if (ok) {
        setDone(true);
        onCopied?.();
        window.setTimeout(() => setDone(false), 1500);
      }
    };

    return (
      <motion.button
        ref={ref}
        onClick={handle}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.96 }}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border px-3 h-8 text-xs font-medium transition-colors focus-ring',
          done
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
            : 'border-border/70 bg-bg-soft text-fg hover:border-border-strong'
        )}
        aria-label="Copy code to clipboard"
      >
        {done ? <Check size={14} /> : <Copy size={14} />}
        {done ? 'Copied' : 'Copy'}
      </motion.button>
    );
  }
);
