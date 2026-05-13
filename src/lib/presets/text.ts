import type { Preset } from './types';
import { blank, uid } from './shared';


export const TEXT_PRESETS: Preset[] = [
  {
    id: 'text-fade-up',
    name: 'Letters · fade up',
    category: 'text',
    description: 'Letters rise into place with a soft fade',
    build: () => ({
      target: 'text', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 1, direction: 'normal', fill: 'forwards',
      keyframes: [
        { id: uid(), at: 0, opacity: 0, transform: { ...blank(), translate: [0, 20] } },
        { id: uid(), at: 100, opacity: 1, transform: { ...blank() } },
      ],
      duration: 1200, delay: 0,
      easing: { kind: 'cubic', v: [0.16, 1, 0.3, 1] },
      stagger: { step: 60 },
    }),
  },
  {
    id: 'text-wave',
    name: 'Letters · wave',
    category: 'text',
    description: 'Letters undulate in a continuous wave',
    build: () => ({
      target: 'text', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 'infinite', direction: 'normal', fill: 'none',
      keyframes: [
        { id: uid(), at: 0, transform: { ...blank() } },
        { id: uid(), at: 50, transform: { ...blank(), translate: [0, -12] } },
        { id: uid(), at: 100, transform: { ...blank() } },
      ],
      duration: 1800, delay: 0,
      easing: { kind: 'preset', value: 'ease-in-out' },
      stagger: { step: 80 },
    }),
  },
  {
    id: 'text-blur-in',
    name: 'Letters · blur in',
    category: 'text',
    description: 'Letters resolve out of a soft blur',
    build: () => ({
      target: 'text', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 1, direction: 'normal', fill: 'forwards',
      keyframes: [
        { id: uid(), at: 0, opacity: 0, blur: 10, transform: { ...blank() } },
        { id: uid(), at: 100, opacity: 1, blur: 0, transform: { ...blank() } },
      ],
      duration: 1200, delay: 0,
      easing: { kind: 'cubic', v: [0.4, 0, 0.2, 1] },
      stagger: { step: 50 },
    }),
  },
  {
    id: 'text-typewriter',
    name: 'Letters · typewriter',
    category: 'text',
    description: 'Letters snap on one at a time at a brisk pace',
    build: () => ({
      target: 'text', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 1, direction: 'normal', fill: 'both',
      // Three-keyframe linear pattern with a LONG cycle. The 3 %
      // snap (≈ 30 ms of a 1000 ms cycle) reads as a near-instant
      // pop to the eye; the remaining 97 % is hold-visible time.
      //
      // Why such a long duration: under iterations: infinite the
      // browser cycles each letter independently every `duration`
      // ms. With a SHORT 90 ms cycle, every letter flickered
      // 11 Hz — looked like noise, not a typewriter. A 1000 ms
      // cycle gives the staggered reset enough visible breathing
      // room that the eye reads it as "letters being re-typed in
      // sequence":
      //
      //   t=0–510 ms : initial reveal cascade (6 * 80 ms stagger
      //                + 30 ms snap = 510 ms for 7-letter word)
      //   t=510–1000: all letters hold visible (≈ 490 ms hold)
      //   t=1000–1480: letters' cycle-2 boundaries fire one by one
      //                — each flickers off then snaps back on
      //                (re-type cascade)
      //   t=1480–2000: hold visible
      //   …loops
      //
      // For iterations: 1 the cycle just plays once and forwards-
      // fill holds the visible end state — same typewriter cadence
      // as before, just with a longer total run-time (the hold
      // phase before forwards-fill kicks in).
      keyframes: [
        { id: uid(), at: 0, opacity: 0, transform: { ...blank() } },
        { id: uid(), at: 3, opacity: 1, transform: { ...blank() } },
        { id: uid(), at: 100, opacity: 1, transform: { ...blank() } },
      ],
      duration: 1000, delay: 0,
      easing: { kind: 'preset', value: 'linear' },
      stagger: { step: 80 },
    }),
  },
  {
    id: 'text-bounce-in',
    name: 'Letters · bounce in',
    category: 'text',
    description: 'Letters drop in with elastic overshoot',
    build: () => ({
      target: 'text', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 1, direction: 'normal', fill: 'forwards',
      keyframes: [
        { id: uid(), at: 0, opacity: 0, transform: { ...blank(), translate: [0, -30] } },
        { id: uid(), at: 100, opacity: 1, transform: { ...blank() } },
      ],
      duration: 800, delay: 0,
      easing: { kind: 'cubic', v: [0.34, 1.56, 0.64, 1] },
      stagger: { step: 60 },
    }),
  },
  {
    id: 'text-pop-in',
    name: 'Letters · pop in',
    category: 'text',
    description: 'Letters scale in with a touch of overshoot',
    build: () => ({
      target: 'text', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 1, direction: 'normal', fill: 'forwards',
      keyframes: [
        { id: uid(), at: 0, opacity: 0, transform: { ...blank(), scale: [0, 0] } },
        { id: uid(), at: 60, opacity: 1, transform: { ...blank(), scale: [1.15, 1.15] } },
        { id: uid(), at: 100, opacity: 1, transform: { ...blank() } },
      ],
      duration: 700, delay: 0,
      easing: { kind: 'cubic', v: [0.22, 1, 0.36, 1] },
      stagger: { step: 60 },
    }),
  },
  {
    id: 'text-rotate-in',
    name: 'Letters · rotate in',
    category: 'text',
    description: 'Letters flip in on the Y axis with perspective',
    build: () => ({
      target: 'text', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 1, direction: 'normal', fill: 'forwards',
      // rotate is [rotateX, rotateY] — Y-axis flip mimics a card
      // flipping open in place. perspective is set on every keyframe
      // so the rotation renders with depth; without it, rotateY
      // collapses to a 1-px vertical sliver and the user sees a fade
      // rather than a flip.
      keyframes: [
        { id: uid(), at: 0, opacity: 0, transform: { ...blank(), perspective: 600, rotate: [0, -90] } },
        { id: uid(), at: 100, opacity: 1, transform: { ...blank(), perspective: 600 } },
      ],
      duration: 900, delay: 0,
      easing: { kind: 'cubic', v: [0.34, 1.56, 0.64, 1] },
      stagger: { step: 70 },
    }),
  },
  {
    id: 'text-color-cycle',
    name: 'Letters · color cycle',
    category: 'text',
    description: 'Letters loop through hues in a flowing rainbow',
    build: () => ({
      target: 'text', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 'infinite', direction: 'normal', fill: 'none',
      // hue-rotate cycles the rendered colour in HSL space. An
      // unsaturated source (white-ish foreground on a dark theme)
      // would yield zero visible change, so the preset pins a vivid
      // baseline `color` on both keyframes; the filter then has
      // something saturated to rotate. Linear easing keeps the cycle
      // perceptually steady; stagger offsets each letter through the
      // cycle so the wave flows across the word.
      keyframes: [
        { id: uid(), at: 0, color: '#ff5577', hueRotate: 0, transform: { ...blank() } },
        { id: uid(), at: 100, color: '#ff5577', hueRotate: 360, transform: { ...blank() } },
      ],
      duration: 4000, delay: 0,
      easing: { kind: 'preset', value: 'linear' },
      stagger: { step: 100 },
    }),
  },
  {
    id: 'text-shake-in',
    name: 'Letters · shake in',
    category: 'text',
    description: 'Letters arrive with a quick lateral shake',
    build: () => ({
      target: 'text', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 1, direction: 'normal', fill: 'forwards',
      keyframes: [
        { id: uid(), at: 0, opacity: 0, transform: { ...blank(), translate: [0, 0] } },
        { id: uid(), at: 10, opacity: 1, transform: { ...blank(), translate: [-6, 0] } },
        { id: uid(), at: 25, transform: { ...blank(), translate: [6, 0] } },
        { id: uid(), at: 45, transform: { ...blank(), translate: [-4, 0] } },
        { id: uid(), at: 65, transform: { ...blank(), translate: [3, 0] } },
        { id: uid(), at: 85, transform: { ...blank(), translate: [-1, 0] } },
        { id: uid(), at: 100, opacity: 1, transform: { ...blank() } },
      ],
      duration: 700, delay: 0,
      easing: { kind: 'preset', value: 'ease-out' },
      stagger: { step: 50 },
    }),
  },
];
