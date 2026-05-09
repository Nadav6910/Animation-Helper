import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Wand2, Palette, Gauge, Undo2, Redo2, RefreshCw, Heart, Compass, Film } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { useAnimationStore } from '@/store/animationStore';
import { useSavedPresetsStore } from '@/store/savedPresetsStore';
import { useTheme } from '@/hooks/useTheme';
import { useAccent, ACCENTS } from '@/hooks/useAccent';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { PRESETS } from '@/lib/presets';
import { EASING_PRESETS } from '@/lib/easings';
import { TEXT_EFFECTS } from '@/lib/textEffects';

type Command = {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon?: React.ReactNode;
  run: () => void;
};

export function CommandPalette() {
  const open = useUiStore((s) => s.paletteOpen);
  const setOpen = useUiStore((s) => s.setPaletteOpen);
  const setSlowMo = useUiStore((s) => s.setSlowMo);
  const slowMo = useUiStore((s) => s.slowMo);

  const undo = useAnimationStore((s) => s.undo);
  const redo = useAnimationStore((s) => s.redo);
  const canUndo = useAnimationStore((s) => s.canUndo);
  const canRedo = useAnimationStore((s) => s.canRedo);
  const resetAll = useAnimationStore((s) => s.resetAll);
  const applyConfig = useAnimationStore((s) => s.applyConfig);
  const applyPreset = useAnimationStore((s) => s.applyPreset);
  const setEasing = useAnimationStore((s) => s.setEasing);
  const config = useAnimationStore((s) => s.config);

  const save = useSavedPresetsStore((s) => s.save);
  const { toggle: toggleTheme } = useTheme();
  const { setAccent } = useAccent();

  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const listboxId = useId();
  useFocusTrap(dialogRef, open, inputRef);

  const commands = useMemo<Command[]>(() => {
    const cmds: Command[] = [
      {
        id: 'undo',
        label: 'Undo',
        hint: canUndo ? 'Cmd+Z' : 'nothing to undo',
        group: 'Editor',
        icon: <Undo2 size={14} />,
        run: undo,
      },
      {
        id: 'redo',
        label: 'Redo',
        hint: canRedo ? 'Cmd+Shift+Z' : 'nothing to redo',
        group: 'Editor',
        icon: <Redo2 size={14} />,
        run: redo,
      },
      {
        id: 'reset',
        label: 'Reset everything',
        hint: 'R',
        group: 'Editor',
        icon: <RefreshCw size={14} />,
        run: resetAll,
      },
      {
        id: 'save',
        label: 'Save current as preset',
        group: 'Editor',
        icon: <Heart size={14} />,
        run: () => {
          save('Untitled', config);
        },
      },
      {
        id: 'export',
        label: 'Export as video / GIF',
        group: 'Editor',
        icon: <Film size={14} />,
        run: () => useUiStore.getState().setExportOpen(true),
      },
      {
        id: 'show-tour',
        label: 'Show onboarding tour',
        group: 'Editor',
        icon: <Compass size={14} />,
        run: () => window.dispatchEvent(new CustomEvent('ah:show-tour')),
      },
      {
        id: 'theme',
        label: 'Toggle theme',
        group: 'Settings',
        icon: <Palette size={14} />,
        run: toggleTheme,
      },
    ];
    for (const a of ACCENTS) {
      cmds.push({
        id: `accent-${a.name}`,
        label: `Set accent · ${a.name}`,
        group: 'Settings',
        icon: <span className="h-3 w-3 rounded-full" style={{ background: a.hex }} />,
        run: () => setAccent(a.name),
      });
    }
    for (const o of [1, 0.5, 0.25]) {
      cmds.push({
        id: `slow-${o}`,
        label: `Slow motion · ${o === 1 ? 'off (1×)' : o === 0.5 ? '½×' : '¼×'}`,
        hint: slowMo === o ? 'active' : undefined,
        group: 'Settings',
        icon: <Gauge size={14} />,
        run: () => setSlowMo(o),
      });
    }
    for (const p of PRESETS) {
      cmds.push({
        id: `preset-${p.id}`,
        label: `Preset · ${p.name}`,
        hint: p.category,
        group: 'Presets',
        icon: <Sparkles size={14} />,
        run: () => applyPreset(p.build()),
      });
    }
    for (const e of EASING_PRESETS) {
      cmds.push({
        id: `easing-${e.name}`,
        label: `Easing · ${e.name}`,
        group: 'Easing',
        icon: <Wand2 size={14} />,
        run: () => setEasing(e.value),
      });
    }
    if (config.target === 'text') {
      for (const e of TEXT_EFFECTS) {
        cmds.push({
          id: `text-effect-${e.id}`,
          label: `Text effect · ${e.name}`,
          hint: e.description,
          group: 'Text',
          icon: <Wand2 size={14} />,
          run: () => applyConfig(e.apply(config)),
        });
      }
    }
    return cmds;
  }, [
    undo,
    redo,
    canUndo,
    canRedo,
    resetAll,
    save,
    config,
    toggleTheme,
    setAccent,
    setSlowMo,
    slowMo,
    applyConfig,
    applyPreset,
    setEasing,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => {
      const hay = `${c.label} ${c.group} ${c.hint ?? ''}`.toLowerCase();
      return q.split(/\s+/).every((tok) => hay.includes(tok));
    });
  }, [query, commands]);

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  // Clear the query on close so reopening the palette doesn't show last
  // session's filter / stale active row.
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!useUiStore.getState().paletteOpen);
      } else if (e.key === 'Escape' && useUiStore.getState().paletteOpen) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setOpen]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const choose = (cmd: Command | undefined) => {
    if (!cmd) return;
    cmd.run();
    setOpen(false);
    setQuery('');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          // pt uses dvh on mobile so the dialog isn't pushed below
          // the iOS keyboard when the search input is focused;
          // sm+ keeps the original 14vh feel on desktops where
          // there's no keyboard to worry about.
          className="fixed inset-0 z-[100] grid place-items-start justify-items-center bg-bg/70 backdrop-blur-md p-4 pt-[6dvh] sm:pt-[14vh]"
          onClick={() => setOpen(false)}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={{ y: -10, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            // The card itself is height-capped by the visible (small)
            // dynamic viewport minus the top inset and a comfortable
            // bottom margin, with `flex flex-col` + `min-h-0` so the
            // listbox below can take the remaining height and scroll
            // its own contents instead of bleeding off-screen.
            className="flex w-full max-w-xl flex-col rounded-2xl border border-border/70 bg-bg-panel/95 shadow-2xl backdrop-blur-xl overflow-hidden focus:outline-none max-h-[calc(100dvh-12dvh-1rem)] sm:max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id={titleId} className="sr-only">
              Command palette
            </h2>
            <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
              <Search size={16} className="text-fg-subtle" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                role="combobox"
                aria-expanded={filtered.length > 0}
                aria-controls={listboxId}
                aria-activedescendant={
                  filtered[active] ? `${listboxId}-${active}` : undefined
                }
                aria-autocomplete="list"
                onKeyDown={(e) => {
                  // Don't fire commands while the IME is composing — Enter
                  // is meant to commit the candidate, not run our action.
                  if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setActive((i) => Math.min(filtered.length - 1, i + 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setActive((i) => Math.max(0, i - 1));
                  } else if (e.key === 'Home') {
                    e.preventDefault();
                    setActive(0);
                  } else if (e.key === 'End') {
                    e.preventDefault();
                    setActive(Math.max(0, filtered.length - 1));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    choose(filtered[active]);
                  }
                }}
                placeholder="Type a command, preset name, easing…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-fg-subtle"
              />
              <span className="hidden sm:inline rounded-md border border-border/70 bg-bg-soft px-1.5 py-0.5 text-[10px] text-fg-subtle">
                Esc
              </span>
            </div>
            <div
              ref={listRef}
              role="listbox"
              id={listboxId}
              aria-label="Command results"
              // flex-1 + min-h-0 lets the list take all the room
              // between the search header and footer, and scroll
              // independently. overscroll-contain stops the scroll
              // chaining out to the page underneath on iOS.
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-thin py-1.5"
            >
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-fg-subtle">
                  No matches
                </div>
              ) : (
                <CommandList
                  items={filtered}
                  active={active}
                  listboxId={listboxId}
                  onHover={setActive}
                  onChoose={choose}
                />
              )}
            </div>
            <div className="flex items-center justify-between border-t border-border/60 px-3 py-1.5 text-[10px] text-fg-subtle">
              <span>↑↓ navigate · Enter to run</span>
              <span>{filtered.length} commands</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CommandList({
  items,
  active,
  listboxId,
  onHover,
  onChoose,
}: {
  items: Command[];
  active: number;
  listboxId: string;
  onHover: (idx: number) => void;
  onChoose: (c: Command) => void;
}) {
  let lastGroup = '';
  return (
    <div>
      {items.map((c, i) => {
        const showHeader = c.group !== lastGroup;
        lastGroup = c.group;
        return (
          <div key={c.id}>
            {showHeader && (
              <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-fg-subtle">
                {c.group}
              </div>
            )}
            <button
              type="button"
              role="option"
              id={`${listboxId}-${i}`}
              aria-selected={i === active}
              data-idx={i}
              onMouseMove={() => onHover(i)}
              onClick={() => onChoose(c)}
              className={
                'flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors ' +
                (i === active
                  ? 'bg-accent/15 text-fg'
                  : 'text-fg hover:bg-bg-soft/60')
              }
            >
              {c.icon && <span className="grid h-5 w-5 place-items-center text-fg-muted" aria-hidden>{c.icon}</span>}
              <span className="flex-1 truncate">{c.label}</span>
              {c.hint && (
                <span className="text-[10px] text-fg-subtle">{c.hint}</span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
