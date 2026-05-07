import { useEffect } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAnimationStore } from '@/store/animationStore';
import { TopBar } from './TopBar';
import { DesktopGrid } from './DesktopGrid';
import { MobileSheet } from './MobileSheet';

export function Shell() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const resetAll = useAnimationStore((s) => s.resetAll);

  // Keyboard shortcut: R = reset (no other modifiers)
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
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        resetAll();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [resetAll]);

  return (
    <div className="relative h-full min-h-screen overflow-hidden flex flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(60% 50% at 20% 0%, rgb(var(--accent) / 0.12), transparent 70%), radial-gradient(50% 40% at 100% 0%, rgb(var(--accent) / 0.08), transparent 70%)',
        }}
      />
      <TopBar />
      <main className="relative flex-1 min-h-0">
        {isDesktop ? <DesktopGrid /> : <MobileSheet />}
      </main>
    </div>
  );
}
