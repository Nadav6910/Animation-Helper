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

  // Lock body scroll while the palette is open. iOS lets touches that
  // don't scroll a child (or that start outside the scrollable list)
  // chain into the document scroll, which is exactly what people see
  // as "the page scrolls instead of the command list" on phones.
  // position: fixed on the body is the only iOS-reliable way to fully
  // disable that — overflow:hidden alone is ignored by Safari for
  // momentum touches. We restore the previous scroll position on
  // close so opening the palette doesn't reset the page.
  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
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

  // Only auto-scroll the active row into view for KEYBOARD-driven
  // navigation (arrow keys, Home, End). Pointer / hover-driven active
  // changes must NOT trigger scrollIntoView, otherwise on touch the
  // user's drag-to-scroll fires mouse-move-equivalents along the way,
  // each one re-points `active` at the item under the finger, and the
  // scrollIntoView snaps the list back to that item — killing scroll.
  const keyboardNav = useRef(false);
  useEffect(() => {
    if (!open) return;
    if (!keyboardNav.current) return;
    keyboardNav.current = false;
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-idx="${active}"]`
    );
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
          // On mobile the palette becomes the screen — flex-col +
          // items-stretch so the inner card claims `flex-1` and the
          // `<div>` underneath the search input gets a real height to
          // scroll inside. On `sm:` and up we go back to the
          // centred-card-with-top-padding layout.
          className="fixed inset-0 z-[100] flex flex-col items-stretch bg-bg/70 backdrop-blur-md sm:items-center sm:justify-start sm:p-4 sm:pt-[14vh]"
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
            // Mobile: flex-1 — the card fills the screen, header and
            // footer pin via flex-shrink-0, list takes the remaining
            // space and scrolls inside it. Desktop: flex-none with a
            // capped max-height + centred max-width so we get the
            // familiar floating card.
            className="flex flex-1 w-full flex-col overflow-hidden border-y border-border/70 bg-bg-panel/95 shadow-2xl backdrop-blur-xl focus:outline-none sm:flex-none sm:max-w-xl sm:max-h-[80vh] sm:rounded-2xl sm:border"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id={titleId} className="sr-only">
              Command palette
            </h2>
            <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3 py-2">
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
                    keyboardNav.current = true;
                    setActive((i) => Math.min(filtered.length - 1, i + 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    keyboardNav.current = true;
                    setActive((i) => Math.max(0, i - 1));
                  } else if (e.key === 'Home') {
                    e.preventDefault();
                    keyboardNav.current = true;
                    setActive(0);
                  } else if (e.key === 'End') {
                    e.preventDefault();
                    keyboardNav.current = true;
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
              // flex-1 + min-h-0 makes this region size to the leftover
              // height (mobile: viewport minus header / footer; desktop:
              // up to max-h-80vh on the card minus header / footer),
              // and overflow-y-auto scrolls inside that. min-h-0 is
              // critical — without it the flex child insists on its
              // intrinsic content height and the scroll never engages.
              // overscroll-contain stops iOS from chaining the touch
              // momentum out to the page underneath when the user
              // reaches the top or bottom of the list.
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-thin py-1.5"
              style={{ WebkitOverflowScrolling: 'touch' }}
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
            <div className="flex shrink-0 items-center justify-between border-t border-border/60 px-3 py-1.5 text-[10px] text-fg-subtle">
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
