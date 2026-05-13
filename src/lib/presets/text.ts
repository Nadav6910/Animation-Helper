import type { Preset } from './types';
import { blank, uid } from './shared';


export const TEXT_PRESETS: Preset[] = [
  {
    id: 'text-fade-up',
    name: 'Letters · fade up',
    category: 'text',
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
    description: 'Letters snap on one at a time',
    build: () => ({
      target: 'text', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 1, direction: 'normal', fill: 'forwards',
      // steps(1, end) snaps opacity 0 → 1 at the end of each letter's
      // duration with no in-between blend. Combined with a stagger
      // step matching the duration, letters appear strictly in
      // sequence — the classic typewriter cadence.
      keyframes: [
        { id: uid(), at: 0, opacity: 0, transform: { ...blank() } },
        { id: uid(), at: 100, opacity: 1, transform: { ...blank() } },
      ],
      duration: 120, delay: 0,
      easing: { kind: 'steps', n: 1, jump: 'end' },
      stagger: { step: 120 },
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
    description: 'Letters flip in on the Y axis',
    build: () => ({
      target: 'text', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 1, direction: 'normal', fill: 'forwards',
      // rotate is [rotateX, rotateY] — Y-axis flip mimics a card
      // flipping open in place.
      keyframes: [
        { id: uid(), at: 0, opacity: 0, transform: { ...blank(), rotate: [0, -90] } },
        { id: uid(), at: 100, opacity: 1, transform: { ...blank() } },
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
      // hue-rotate as a filter cycles the rendered colour. Linear
      // easing keeps the cycle perceptually steady; stagger offsets
      // each letter through the cycle so the wave flows across the
      // word.
      keyframes: [
        { id: uid(), at: 0, hueRotate: 0, transform: { ...blank() } },
        { id: uid(), at: 100, hueRotate: 360, transform: { ...blank() } },
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
