import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import {
  motion,
  AnimatePresence,
  MotionConfig,
  useReducedMotion,
} from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles, X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/lib/cn';
import { SHOW_TOUR_EVENT } from '@/lib/events';
import { MeshGradient } from './MeshGradient';
import { Confetti } from './Confetti';
import { HeroIllustration } from './illustrations/Hero';
import { PickerIllustration } from './illustrations/Picker';
import { KeyframesIllustration } from './illustrations/Keyframes';
import { TimelineIllustration } from './illustrations/Timeline';
import { ExportIllustration } from './illustrations/Export';

const SEEN_KEY = 'ah:onboarded-tour-v1';

type Step = {
  id: string;
  // Anchor selector. Null centres the spotlight on the screen (used by
  // the Hero step, which has no element to highlight).
  anchor: string | null;
  heading: string;
  body: string;
  illustration: () => ReactElement;
};

const STEPS: Step[] = [
  {
    id: 'hero',
    anchor: null,
    heading: 'Animate anything in seconds.',
    body: "Hand-tuned presets, full timeline scrub, export to ten formats. Let's take a quick tour — under a minute.",
    illustration: HeroIllustration,
  },
  {
    id: 'picker',
    anchor: '[data-tour-anchor="presets"]',
    heading: 'Pick a preset.',
    body: 'Start from one of 24 hand-built starters. Categories cover entrance, exit, attention, loaders, and text effects.',
    illustration: PickerIllustration,
  },
  {
    id: 'keyframes',
    anchor: '[data-tour-anchor="keyframes"]',
    heading: 'Tweak the keyframes.',
    body: 'Drag the diamond handles to retime each waypoint. Add new ones by clicking anywhere on the track.',
    illustration: KeyframesIllustration,
  },
  {
    id: 'timeline',
    anchor: '[data-tour-anchor="timeline"]',
    heading: 'Scrub & play.',
    body: 'Drag the playhead anywhere — the preview snaps to that frame. Use ← / → for fine nudges, Shift for big jumps.',
    illustration: TimelineIllustration,
  },
  {
    id: 'export',
    anchor: '[data-tour-anchor="export"]',
    heading: 'Copy or export the result.',
    body: 'Pick from CSS, Tailwind, Framer Motion, Vue, Svelte, Lottie and more — or hit Record for an MP4 / WebM / GIF.',
    illustration: ExportIllustration,
  },
];

type Rect = { top: number; left: number; width: number; height: number };
const FULLSCREEN_RECT: Rect = { top: 0, left: 0, width: 0, height: 0 };

/**
 * Cinematic 5-step onboarding. Spotlights cut through a dimmed
 * fullscreen layer to reveal the section the step is about; coach mark
 * carries an animated illustration, typewriter heading, and step dots.
 * Confetti on enter and finish. Honors prefers-reduced-motion.
 */
export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [anchorRect, setAnchorRect] = useState<Rect | null>(null);

  const reduced = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const primaryBtnRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const bodyId = useId();
  const setTourOpen = useUiStore((s) => s.setTourOpen);
  const setTourStepId = useUiStore((s) => s.setTourStepId);
  useFocusTrap(dialogRef, open, primaryBtnRef);

  // Publish open state so App.tsx's global hotkey handlers stay out of
  // the way (timeline arrow-scrub, R for reset, etc.).
  useEffect(() => {
    setTourOpen(open);
    return () => setTourOpen(false);
  }, [open, setTourOpen]);

  const current = STEPS[step];

  // Publish the active step id so layout surfaces that hide content
  // (MobileSheet's tab switcher, timeline collapse) can reveal whatever
  // the current step's anchor lives inside before measureAnchor fires.
  // Null when the tour is closed so layouts return to user choice.
  useEffect(() => {
    setTourStepId(open ? current.id : null);
    return () => setTourStepId(null);
  }, [open, current.id, setTourStepId]);

  // Track export-modal openness so the dismiss effect (after `finish`
  // is declared, below) can react to the user clicking Record while
  // the tour is up.
  const exportOpen = useUiStore((s) => s.exportOpen);

  // -------- Open / close lifecycle --------------------------------------
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seen = window.localStorage.getItem(SEEN_KEY);
    if (!seen) {
      // Show on first visit, slightly delayed so the splash + first
      // paint don't fight for attention.
      const t = window.setTimeout(() => setOpen(true), 800);
      return () => window.clearTimeout(t);
    }
  }, []);

  // Replayable from anywhere via a custom event (the command palette
  // wires this up in Phase 4; nothing else dispatches it today).
  useEffect(() => {
    const onShow = () => {
      setStep(0);
      setDone(false);
      setOpen(true);
    };
    window.addEventListener(SHOW_TOUR_EVENT, onShow);
    return () => window.removeEventListener(SHOW_TOUR_EVENT, onShow);
  }, []);

  // Cross-tab dismissal — if another tab finishes / skips, hide here too.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SEEN_KEY && e.newValue) setOpen(false);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const finish = useCallback(() => {
    try {
      window.localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* ignore */
    }
  }, []);

  /**
   * Hard-dismiss: the user explicitly tapped the "Skip tour" pill.
   * Persists `SEEN_KEY` so we don't show the tour again on next
   * visit. The "Let's go ✨" button on the final step also calls
   * `finish()` directly for the same reason.
   */
  const skip = useCallback(() => {
    finish();
    setOpen(false);
  }, [finish]);

  /**
   * Soft-dismiss: Esc closes the tour for THIS session but does NOT
   * write `SEEN_KEY`, so the next page load will surface the tour
   * again as if the user hadn't seen it. Esc is too easy to hit
   * accidentally — especially when other modals are stacked
   * underneath and the keypress dismisses everything together —
   * to count as "I've seen this, never show it again". The visible
   * "Skip tour" pill in the corner is the explicit don't-show-again
   * affordance.
   */
  const softDismiss = useCallback(() => {
    setOpen(false);
  }, []);

  // If the user opens the export modal while the tour is up — most
  // likely by clicking the Record button that the export step is
  // spotlighting — auto-dismiss the tour. The tour's dim panels sit
  // at z-120, the export modal at z-105, so without dismissing the
  // modal would be visible-ish but unclickable and both focus traps
  // would fight. Treat it as "tour served its purpose" and step out.
  useEffect(() => {
    if (open && exportOpen) {
      finish();
      setOpen(false);
    }
  }, [open, exportOpen, finish]);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    // last step → celebrate then close.
    setDone(true);
    finish();
    // 2.6 s instead of 1.6 — long enough for AT consumers to hear the
    // celebration text from the live region announce ("Step 5 of 5:
    // …Let's go ✨") before the dialog unmounts and the live region
    // disappears. The visual confetti runs ~1.5 s so the extra second
    // is mostly afterglow.
    window.setTimeout(() => setOpen(false), 2600);
  }, [step, finish]);

  const back = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  // -------- Anchor measurement -----------------------------------------
  // Recompute the spotlight rect whenever the step changes or the page
  // re-flows. ResizeObserver covers content reflow; scroll + resize
  // listeners cover the rest.
  const measureAnchor = useCallback(() => {
    if (!current.anchor) {
      setAnchorRect(null);
      return;
    }
    const el = document.querySelector(current.anchor);
    if (!el) {
      setAnchorRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    // Pad the spotlight slightly so the highlighted section breathes.
    // When the padded rect would extend past the top / left edge
    // (anchor sits near the viewport boundary), clamp the *position*
    // to 0 AND shrink the dimensions by the same delta — otherwise
    // `width` / `height` carry the full padded size while the
    // origin has been pinched back, making the spotlight taller /
    // wider than the actual element and overlapping real UI on the
    // far side.
    const pad = 12;
    const rawTop = r.top - pad;
    const rawLeft = r.left - pad;
    const top = Math.max(0, rawTop);
    const left = Math.max(0, rawLeft);
    const topClampDelta = top - rawTop; // 0 normally, positive if clamped
    const leftClampDelta = left - rawLeft;
    setAnchorRect({
      top,
      left,
      width: Math.max(0, r.width + pad * 2 - leftClampDelta),
      height: Math.max(0, r.height + pad * 2 - topClampDelta),
    });
  }, [current.anchor]);

  useLayoutEffect(() => {
    if (!open) return;
    measureAnchor();
    const onScrollOrResize = () => measureAnchor();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);

    // The same step transition that triggers this effect also fires
    // `tourStepId` → MobileSheet's effect, which may swap the active
    // tab a tick later (revealing the anchor's actual DOM node). On
    // first run our `querySelector` may pick up the previous tab's
    // node (or null), so we re-measure across the next few frames
    // until we find the real, sized element. We also keep a
    // MutationObserver on document.body — broad but cheap — so any
    // late DOM swap (sheet animation, lazy-loaded panel) re-measures
    // automatically. Both observers terminate when the step changes.
    let raf = 0;
    let attempts = 0;
    const reobserve = () => {
      const elNow = current.anchor
        ? document.querySelector(current.anchor)
        : null;
      const r = elNow?.getBoundingClientRect();
      const sized = !!r && r.width > 0 && r.height > 0;
      if (elNow && (sized || attempts > 30)) {
        ro?.disconnect();
        ro = new ResizeObserver(() => measureAnchor());
        ro.observe(elNow);
        measureAnchor();
        return;
      }
      attempts += 1;
      raf = requestAnimationFrame(reobserve);
    };
    let ro: ResizeObserver | null = null;
    raf = requestAnimationFrame(reobserve);

    const mo = new MutationObserver(() => {
      // Re-bind to whatever node currently matches the anchor — if
      // a tab swap mounted a new element, this catches it.
      const elNow = current.anchor
        ? document.querySelector(current.anchor)
        : null;
      if (elNow) {
        ro?.disconnect();
        ro = new ResizeObserver(() => measureAnchor());
        ro.observe(elNow);
        measureAnchor();
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
      cancelAnimationFrame(raf);
      mo.disconnect();
      ro?.disconnect();
    };
  }, [open, measureAnchor, current.anchor]);

  // Scroll the anchor element into view if it's off-screen so the
  // spotlight doesn't appear over empty space.
  useEffect(() => {
    if (!open || !current.anchor) return;
    const el = document.querySelector(current.anchor);
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < 80 || r.bottom > window.innerHeight - 80) {
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    }
  }, [open, step, current.anchor, reduced]);

  // -------- Keyboard ---------------------------------------------------
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        // Soft dismiss — see softDismiss vs skip rationale above.
        // Hitting Esc is "close this", not "I'm done with onboarding
        // forever".
        softDismiss();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        // Don't hijack Enter inside the focus-trapped buttons (they fire
        // on click already); guard by checking the active tag.
        if (e.key === 'Enter') {
          const tag = (document.activeElement as HTMLElement | null)?.tagName;
          if (tag === 'BUTTON') return;
        }
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        back();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, next, back, softDismiss]);

  // -------- Spotlight panels -------------------------------------------
  // Four dim panels that surround the spotlight rect (or fill the
  // screen if no anchor). Each animates between its prior and current
  // size with a spring so the spotlight slides smoothly between steps.
  const rect = anchorRect ?? FULLSCREEN_RECT;
  const fullscreenSpotlight = !anchorRect;
  const Illustration = current.illustration;

  // Place the coach mark in the OPPOSITE vertical half from the
  // spotlight so the modal never occludes the highlighted element.
  // For the timeline step (anchor at the bottom of the screen) this
  // pins the card to the top; for picker / keyframes / export
  // (anchors above the fold) it pins to the bottom. Hero step keeps
  // the centered "owns the screen" placement.
  const coachPlacement: 'top' | 'bottom' | 'center' = useMemo(() => {
    if (!anchorRect || typeof window === 'undefined') return 'center';
    const viewportH = window.innerHeight;
    const anchorMid = anchorRect.top + anchorRect.height / 2;
    return anchorMid > viewportH / 2 ? 'top' : 'bottom';
  }, [anchorRect]);

  return (
    // MotionConfig propagates `reducedMotion: 'user'` to every
    // descendant `motion.*` component — covers the five
    // illustration files and the mesh / confetti without each one
    // having to call `useReducedMotion` individually. With "user"
    // framer-motion respects the OS-level prefers-reduced-motion
    // and short-circuits all transition-based loops to first frame.
    <MotionConfig reducedMotion="user">
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.08 : 0.25 }}
          // pointer-events-none on the wrapper so clicks fall through
          // to the actual UI in the spotlight area. The four dim panels
          // below set pointer-events-auto to block clicks outside the
          // spotlight; the coach mark sets pointer-events-auto on
          // itself. Net effect: highlighted UI stays interactive,
          // dimmed surroundings + the card are not clickable through.
          className="fixed inset-0 z-[120] overflow-hidden pointer-events-none"
        >
          {/* Ambient mood layer. No full-screen backdrop sits above it
              anymore — the four dim panels below carve out the
              spotlight, and the spotlight area is left clear so the
              actual UI shows through and stays interactive. For the
              hero step (no anchor), the panels collapse and the mesh
              gradient alone provides the dim. */}
          <MeshGradient />
          {fullscreenSpotlight && (
            <div className="pointer-events-auto absolute inset-0 bg-bg/80 backdrop-blur-md" />
          )}

          {/* Four dim panels carving out a hole around the anchor.
              Each blocks pointer events (pointer-events-auto) so the
              user can only interact with the spotlit element. */}
          {!fullscreenSpotlight && (
            <>
              {/* Top panel — full-width strip above the spotlight. */}
              <motion.div
                className="pointer-events-auto absolute left-0 right-0 top-0 bg-bg/85 backdrop-blur-md"
                animate={{ height: rect.top }}
                transition={{ type: 'spring', stiffness: 220, damping: 28 }}
              />
              {/* Bottom panel */}
              <motion.div
                className="pointer-events-auto absolute left-0 right-0 bottom-0 bg-bg/85 backdrop-blur-md"
                animate={{ top: rect.top + rect.height }}
                transition={{ type: 'spring', stiffness: 220, damping: 28 }}
              />
              {/* Left panel */}
              <motion.div
                className="pointer-events-auto absolute left-0 bg-bg/85 backdrop-blur-md"
                animate={{
                  top: rect.top,
                  width: rect.left,
                  height: rect.height,
                }}
                transition={{ type: 'spring', stiffness: 220, damping: 28 }}
              />
              {/* Right panel */}
              <motion.div
                className="pointer-events-auto absolute right-0 bg-bg/85 backdrop-blur-md"
                animate={{
                  top: rect.top,
                  left: rect.left + rect.width,
                  height: rect.height,
                }}
                transition={{ type: 'spring', stiffness: 220, damping: 28 }}
              />
              {/* Glowing ring around the spotlight rect itself */}
              <motion.div
                className="absolute pointer-events-none rounded-2xl border-2 border-accent/70 shadow-[0_0_60px_rgb(var(--accent)/0.55)]"
                animate={{
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                }}
                transition={{ type: 'spring', stiffness: 220, damping: 28 }}
              />
            </>
          )}

          {/* Coach mark — placed in the opposite vertical half from the
              spotlight (or centred for the hero step) so the modal
              never sits over the element it's describing. Horizontal
              centre is preserved across all placements. */}
          <div
            className={cn(
              'pointer-events-none absolute inset-0 flex justify-center p-4',
              coachPlacement === 'center' && 'items-center',
              coachPlacement === 'top' && 'items-start pt-4',
              coachPlacement === 'bottom' && 'items-end pb-4'
            )}
          >
            <motion.div
              key={current.id}
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={bodyId}
              tabIndex={-1}
              initial={{ y: 20, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -10, opacity: 0, scale: 0.97 }}
              transition={{
                type: 'spring',
                stiffness: 280,
                damping: 26,
              }}
              className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl border border-accent/40 bg-bg-panel/95 shadow-[0_24px_64px_-16px_rgb(0_0_0_/_0.55)] backdrop-blur-xl focus:outline-none"
            >
              {/* Skip pill in the corner — always reachable */}
              <button
                type="button"
                onClick={skip}
                className="absolute right-2 top-2 z-10 inline-flex h-7 items-center gap-1 rounded-full border border-border/70 bg-bg-soft/80 px-2.5 text-[10px] text-fg-muted hover:text-fg focus-ring"
              >
                <X size={11} /> Skip tour
              </button>

              {/* Illustration */}
              <div className="px-5 pt-12">
                <Illustration />
              </div>

              {/* Body */}
              <div className="px-5 pt-4 pb-3">
                <h2
                  id={titleId}
                  className="font-display text-xl font-semibold tracking-tight text-fg"
                >
                  {/* SR-only static heading so screen readers see the
                      full title in one go; the visible typewriter is
                      hidden from AT to avoid partial / re-announce
                      churn as characters land. */}
                  <span className="sr-only">{current.heading}</span>
                  <span aria-hidden>
                    <Typewriter text={current.heading} key={current.id} />
                  </span>
                </h2>
                <p
                  id={bodyId}
                  className="mt-2 text-sm leading-relaxed text-fg-muted"
                >
                  {current.body}
                </p>
              </div>
              {/* Polite live region: announces the full step title +
                  body whenever the active step changes. The visible
                  heading is typewritten + aria-hidden, the body is
                  static — without this region, screen readers heard
                  only the step counter ("Step 3 of 5") on next/back. */}
              <span
                key={`live-${current.id}`}
                className="sr-only"
                role="status"
                aria-live="polite"
              >
                Step {step + 1} of {STEPS.length}: {current.heading}.{' '}
                {current.body}
              </span>

              {/* Step indicator + nav */}
              <div className="flex items-center justify-between gap-2 border-t border-border/60 px-5 py-3">
                <div className="flex items-center gap-1.5" aria-hidden>
                  {STEPS.map((_, i) => {
                    const active = i === step;
                    const past = i < step;
                    return (
                      <motion.span
                        key={i}
                        animate={{
                          width: active ? 22 : past ? 8 : 6,
                          opacity: active ? 1 : past ? 0.7 : 0.35,
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 320,
                          damping: 28,
                        }}
                        className={cn(
                          'h-1.5 rounded-full',
                          active || past ? 'bg-accent' : 'bg-fg-subtle'
                        )}
                      />
                    );
                  })}
                </div>
                <div
                  className="flex items-center gap-1.5"
                  aria-live="polite"
                >
                  <span className="sr-only">
                    Step {step + 1} of {STEPS.length}
                  </span>
                  <button
                    type="button"
                    onClick={back}
                    disabled={step === 0}
                    className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs text-fg-muted hover:text-fg focus-ring disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft size={12} /> Back
                  </button>
                  <button
                    ref={primaryBtnRef}
                    type="button"
                    onClick={next}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-semibold text-accent-contrast shadow-glow hover:opacity-90 focus-ring"
                  >
                    {step === STEPS.length - 1 ? (
                      <>
                        Let's go <Sparkles size={12} />
                      </>
                    ) : (
                      <>
                        Next <ArrowRight size={12} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Confetti at the very start (hero) and the celebration finish */}
          {(step === 0 || done) && <Confetti count={done ? 60 : 36} />}
        </motion.div>
      )}
    </AnimatePresence>
    </MotionConfig>
  );
}

/**
 * Types a string in character-by-character at a steady cadence. Resets
 * on key change so each step gets its own typed entrance. Honours
 * `prefers-reduced-motion` by rendering the full string immediately.
 */
function Typewriter({ text }: { text: string }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? text.length : 0);
  const cadence = useMemo(() => 28, []);

  useEffect(() => {
    if (reduced) {
      setShown(text.length);
      return;
    }
    setShown(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= text.length) window.clearInterval(id);
    }, cadence);
    return () => window.clearInterval(id);
  }, [text, cadence, reduced]);

  return (
    <span>
      {text.slice(0, shown)}
      {shown < text.length && (
        <motion.span
          aria-hidden
          className="ml-0.5 inline-block h-[1em] w-[2px] -mb-1 bg-accent"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </span>
  );
}
