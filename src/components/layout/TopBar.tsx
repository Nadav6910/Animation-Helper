import { Moon, Sun, Sparkles, Undo2, Redo2, Gauge, Command, Keyboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAccent, ACCENTS } from '@/hooks/useAccent';
import { useAnimationStore } from '@/store/animationStore';
import { useUiStore } from '@/store/uiStore';
import { IconButton } from '@/components/ui/IconButton';
import { SavePresetButton } from './SavePresetButton';

const SLOW_OPTIONS = [
  { value: 1, label: '1×' },
  { value: 0.5, label: '½×' },
  { value: 0.25, label: '¼×' },
];

export function TopBar() {
  const { theme, toggle } = useTheme();
  const { accent, setAccent } = useAccent();
  const canUndo = useAnimationStore((s) => s.canUndo);
  const canRedo = useAnimationStore((s) => s.canRedo);
  const undo = useAnimationStore((s) => s.undo);
  const redo = useAnimationStore((s) => s.redo);
  const slowMo = useUiStore((s) => s.slowMo);
  const setSlowMo = useUiStore((s) => s.setSlowMo);
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const setShortcutsOpen = useUiStore((s) => s.setShortcutsOpen);

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
        <div className="hidden md:flex items-center gap-1">
          <IconButton
            variant="ghost"
            size="md"
            label="Undo (Cmd+Z)"
            onClick={undo}
            disabled={!canUndo}
            className={!canUndo ? 'opacity-30 cursor-not-allowed' : ''}
          >
            <Undo2 size={16} />
          </IconButton>
          <IconButton
            variant="ghost"
            size="md"
            label="Redo (Cmd+Shift+Z)"
            onClick={redo}
            disabled={!canRedo}
            className={!canRedo ? 'opacity-30 cursor-not-allowed' : ''}
          >
            <Redo2 size={16} />
          </IconButton>
        </div>

        <div
          role="radiogroup"
          aria-label="Slow motion"
          className="hidden sm:flex items-center gap-0.5 rounded-full border border-border/70 bg-bg-soft p-0.5"
          title="Slow-motion preview (does not affect generated code)"
        >
          <Gauge size={12} className="text-fg-subtle ml-1.5" />
          {SLOW_OPTIONS.map((o) => {
            const active = slowMo === o.value;
            return (
              <button
                key={o.value}
                role="radio"
                aria-checked={active}
                onClick={() => setSlowMo(o.value)}
                className={
                  'h-6 px-2 rounded-full text-[11px] tabular-nums focus-ring transition-colors ' +
                  (active ? 'bg-bg-panel text-fg' : 'text-fg-muted hover:text-fg')
                }
              >
                {o.label}
              </button>
            );
          })}
        </div>

        <div
          role="radiogroup"
          aria-label="Accent color"
          className="hidden sm:flex items-center gap-1 rounded-full border border-border/70 bg-bg-soft p-1"
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
        <IconButton
          variant="ghost"
          size="md"
          label="Command palette (Cmd+K)"
          onClick={() => setPaletteOpen(true)}
        >
          <Command size={16} />
        </IconButton>
        <IconButton
          variant="ghost"
          size="md"
          label="Keyboard shortcuts (?)"
          onClick={() => setShortcutsOpen(true)}
        >
          <Keyboard size={16} />
        </IconButton>
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
