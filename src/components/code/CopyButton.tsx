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
        whileTap={{ scale: 0.97 }}
        // Full-width primary action — sits on its own row inside the
        // CodePanel header, with both icon and label always visible
        // regardless of viewport. Sized larger than the secondary
        // icon-strip buttons so it reads as the main affordance.
        className={cn(
          'inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 h-9 text-sm font-semibold transition-colors focus-ring shadow-sm',
          done
            ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
            : 'border-accent/50 bg-accent/15 text-fg hover:bg-accent/20'
        )}
        aria-label={done ? 'Copied to clipboard' : 'Copy code to clipboard'}
        title="Copy code to clipboard"
      >
        {done ? <Check size={15} /> : <Copy size={15} />}
        <span>{done ? 'Copied!' : 'Copy code'}</span>
      </motion.button>
    );
  }
);
