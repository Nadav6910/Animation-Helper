import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAnimationStore } from '@/store/animationStore';
import { useUiStore } from '@/store/uiStore';
import { TopBar } from './TopBar';
import { DesktopGrid } from './DesktopGrid';
import { MobileSheet } from './MobileSheet';

type Props = { ready: boolean };

export function Shell({ ready }: Props) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const resetAll = useAnimationStore((s) => s.resetAll);

  // Keyboard shortcut: R = reset (no other modifiers). Skip when a
  // modal-style overlay is open so the user's intent goes to that
  // overlay (the palette/shortcuts overlays handle their own keys).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName ?? '';
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        (e.target as HTMLElement | null)?.isContentEditable
      ) {
        return;
      }
      const ui = useUiStore.getState();
      if (ui.paletteOpen || ui.shortcutsOpen) return;
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        resetAll();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [resetAll]);

  return (
    <motion.div
      initial="hidden"
      animate={ready ? 'visible' : 'hidden'}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.08,
            delayChildren: 0.05,
          },
        },
      }}
      className="relative h-dvh overflow-hidden flex flex-col"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(60% 50% at 20% 0%, rgb(var(--accent) / 0.12), transparent 70%), radial-gradient(50% 40% at 100% 0%, rgb(var(--accent) / 0.08), transparent 70%)',
        }}
      />
      <motion.div
        variants={{
          hidden: { y: -32, opacity: 0 },
          visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 220, damping: 26 },
          },
        }}
      >
        <TopBar />
      </motion.div>
      <motion.main
        variants={{
          hidden: { y: 16, opacity: 0 },
          visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 220, damping: 28 },
          },
        }}
        className="relative flex-1 min-h-0"
      >
        {isDesktop ? <DesktopGrid /> : <MobileSheet />}
      </motion.main>
    </motion.div>
  );
}
