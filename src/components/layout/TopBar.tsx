import { Moon, Sun, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAccent, ACCENTS } from '@/hooks/useAccent';
import { IconButton } from '@/components/ui/IconButton';
import { SavePresetButton } from './SavePresetButton';

export function TopBar() {
  const { theme, toggle } = useTheme();
  const { accent, setAccent } = useAccent();

  return (
    <header className="relative z-30 flex items-center justify-between gap-4 border-b border-border/60 bg-bg/80 px-4 sm:px-6 backdrop-blur-xl h-16">
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent/40 text-accent-contrast shadow-glow"
        >
          <Sparkles size={18} />
        </motion.div>
        <div className="flex flex-col leading-tight">
          <span className="font-display text-lg font-bold gradient-text">
            Animation&nbsp;Helper
          </span>
          <span className="hidden sm:block text-[11px] text-fg-subtle">
            Design CSS animations visually · copy production code
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div
          role="radiogroup"
          aria-label="Accent color"
          className="flex items-center gap-1 rounded-full border border-border/70 bg-bg-soft p-1"
        >
          {ACCENTS.map((a) => {
            const active = accent === a.name;
            return (
              <button
                key={a.name}
                role="radio"
                aria-checked={active}
                onClick={() => setAccent(a.name)}
                className="relative grid h-6 w-6 place-items-center rounded-full focus-ring"
                aria-label={`${a.name} accent`}
                title={a.name}
              >
                <span
                  className="h-4 w-4 rounded-full border border-white/10"
                  style={{ background: a.hex }}
                />
                {active && (
                  <motion.span
                    layoutId="accent-ring"
                    className="absolute inset-0 rounded-full ring-2 ring-fg/70"
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <SavePresetButton />
        <IconButton
          variant="ghost"
          size="md"
          label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          onClick={toggle}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </IconButton>
      </div>
    </header>
  );
}
