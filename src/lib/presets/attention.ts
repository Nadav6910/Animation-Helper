import type { Preset } from './types';
import { blank, uid } from './shared';


export const ATTENTION_PRESETS: Preset[] = [
  {
    id: 'pulse',
    name: 'Pulse',
    category: 'attention',
    build: () => ({
      target: 'shape', selector: '.animated', shape: 'circle', text: 'Animate', svgPath: 'check',
      iterations: 'infinite', direction: 'normal', fill: 'none',
      keyframes: [
        { id: uid(), at: 0, opacity: 1, transform: { ...blank() } },
        { id: uid(), at: 50, opacity: 0.5, transform: { ...blank(), scale: [1.1, 1.1] } },
        { id: uid(), at: 100, opacity: 1, transform: { ...blank() } },
      ],
      duration: 1800, delay: 0,
      easing: { kind: 'preset', value: 'ease-in-out' },
    }),
  },
  {
    id: 'shake',
    name: 'Shake',
    category: 'attention',
    build: () => ({
      target: 'shape', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 1, direction: 'normal', fill: 'none',
      keyframes: [
        { id: uid(), at: 0, transform: { ...blank() } },
        { id: uid(), at: 10, transform: { ...blank(), translate: [-10, 0] } },
        { id: uid(), at: 25, transform: { ...blank(), translate: [10, 0] } },
        { id: uid(), at: 40, transform: { ...blank(), translate: [-8, 0] } },
        { id: uid(), at: 55, transform: { ...blank(), translate: [8, 0] } },
        { id: uid(), at: 70, transform: { ...blank(), translate: [-4, 0] } },
        { id: uid(), at: 85, transform: { ...blank(), translate: [4, 0] } },
        { id: uid(), at: 100, transform: { ...blank() } },
      ],
      duration: 1100, delay: 0,
      easing: { kind: 'preset', value: 'linear' },
    }),
  },
  {
    id: 'wobble',
    name: 'Wobble',
    category: 'attention',
    build: () => ({
      target: 'shape', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 1, direction: 'normal', fill: 'none',
      keyframes: [
        { id: uid(), at: 0, transform: { ...blank() } },
        { id: uid(), at: 25, transform: { ...blank(), translate: [-25, 0], rotate: [0, 0], skew: [-5, 0] } },
        { id: uid(), at: 50, transform: { ...blank(), translate: [20, 0], skew: [3, 0] } },
        { id: uid(), at: 75, transform: { ...blank(), translate: [-15, 0], skew: [-2, 0] } },
        { id: uid(), at: 100, transform: { ...blank() } },
      ],
      duration: 1400, delay: 0,
      easing: { kind: 'preset', value: 'ease-in-out' },
    }),
  },
  {
    id: 'heartbeat',
    name: 'Heartbeat',
    category: 'attention',
    build: () => ({
      target: 'svg', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'heart',
      iterations: 'infinite', direction: 'normal', fill: 'none',
      keyframes: [
        { id: uid(), at: 0, transform: { ...blank() } },
        { id: uid(), at: 14, transform: { ...blank(), scale: [1.3, 1.3] } },
        { id: uid(), at: 28, transform: { ...blank() } },
        { id: uid(), at: 42, transform: { ...blank(), scale: [1.3, 1.3] } },
        { id: uid(), at: 70, transform: { ...blank() } },
      ],
      duration: 1600, delay: 0,
      easing: { kind: 'preset', value: 'ease-in-out' },
    }),
  },
  {
    id: 'jello',
    name: 'Jello',
    category: 'attention',
    build: () => ({
      target: 'shape', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 1, direction: 'normal', fill: 'none',
      keyframes: [
        { id: uid(), at: 0, transform: { ...blank() } },
        { id: uid(), at: 11, transform: { ...blank() } },
        { id: uid(), at: 22, transform: { ...blank(), skew: [-12, -12] } },
        { id: uid(), at: 33, transform: { ...blank(), skew: [6, 6] } },
        { id: uid(), at: 44, transform: { ...blank(), skew: [-3, -3] } },
        { id: uid(), at: 55, transform: { ...blank(), skew: [1.5, 1.5] } },
        { id: uid(), at: 100, transform: { ...blank() } },
      ],
      duration: 1500, delay: 0,
      easing: { kind: 'preset', value: 'ease-in-out' },
    }),
  },
  {
    id: 'rubber-band',
    name: 'Rubber band',
    category: 'attention',
    build: () => ({
      target: 'shape', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 1, direction: 'normal', fill: 'none',
      keyframes: [
        { id: uid(), at: 0, transform: { ...blank() } },
        { id: uid(), at: 30, transform: { ...blank(), scale: [1.25, 0.75] } },
        { id: uid(), at: 40, transform: { ...blank(), scale: [0.75, 1.25] } },
        { id: uid(), at: 50, transform: { ...blank(), scale: [1.15, 0.85] } },
        { id: uid(), at: 65, transform: { ...blank(), scale: [0.95, 1.05] } },
        { id: uid(), at: 75, transform: { ...blank(), scale: [1.05, 0.95] } },
        { id: uid(), at: 100, transform: { ...blank() } },
      ],
      duration: 1400, delay: 0,
      easing: { kind: 'preset', value: 'ease-in-out' },
    }),
  },
  {
    id: 'wiggle',
    name: 'Wiggle',
    category: 'attention',
    description: 'Quick side-to-side rotation oscillation',
    build: () => ({
      target: 'shape', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 1, direction: 'normal', fill: 'none',
      // rotate3d on Z gives in-plane rotation (around the screen
      // normal) — distinct from the existing shake (translate) and
      // wobble (translate + skew). Decaying amplitude lands at zero
      // so iterations: 1 leaves the element in its rest pose.
      keyframes: [
        { id: uid(), at: 0, transform: { ...blank() } },
        { id: uid(), at: 15, transform: { ...blank(), rotate3d: { x: 0, y: 0, z: 1, deg: -6 } } },
        { id: uid(), at: 35, transform: { ...blank(), rotate3d: { x: 0, y: 0, z: 1, deg: 6 } } },
        { id: uid(), at: 55, transform: { ...blank(), rotate3d: { x: 0, y: 0, z: 1, deg: -4 } } },
        { id: uid(), at: 75, transform: { ...blank(), rotate3d: { x: 0, y: 0, z: 1, deg: 2 } } },
        { id: uid(), at: 100, transform: { ...blank() } },
      ],
      duration: 900, delay: 0,
      easing: { kind: 'preset', value: 'ease-in-out' },
    }),
  },
  {
    id: 'flash',
    name: 'Flash',
    category: 'attention',
    description: 'Rapid opacity blinks to draw the eye',
    build: () => ({
      target: 'shape', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 1, direction: 'normal', fill: 'none',
      keyframes: [
        { id: uid(), at: 0, opacity: 1, transform: { ...blank() } },
        { id: uid(), at: 25, opacity: 0, transform: { ...blank() } },
        { id: uid(), at: 50, opacity: 1, transform: { ...blank() } },
        { id: uid(), at: 75, opacity: 0, transform: { ...blank() } },
        { id: uid(), at: 100, opacity: 1, transform: { ...blank() } },
      ],
      duration: 900, delay: 0,
      easing: { kind: 'preset', value: 'linear' },
    }),
  },
  {
    id: 'glow-pulse',
    name: 'Glow pulse',
    category: 'attention',
    description: 'Soft halo expands and fades in a loop',
    build: () => ({
      target: 'shape', selector: '.animated', shape: 'circle', text: 'Animate', svgPath: 'check',
      iterations: 'infinite', direction: 'normal', fill: 'none',
      // dropShadow is the supported filter primitive (text-shadow isn't
      // wired through the generators); expanding the blur radius while
      // dialling the colour's alpha creates a "halo breathing" effect.
      // rgb(var(--accent)) follows the active theme accent.
      keyframes: [
        { id: uid(), at: 0, dropShadow: '0 0 0 rgb(var(--accent) / 0.7)', transform: { ...blank() } },
        { id: uid(), at: 50, dropShadow: '0 0 24px rgb(var(--accent) / 0.0)', transform: { ...blank() } },
        { id: uid(), at: 100, dropShadow: '0 0 0 rgb(var(--accent) / 0.7)', transform: { ...blank() } },
      ],
      duration: 2000, delay: 0,
      easing: { kind: 'preset', value: 'ease-in-out' },
    }),
  },
];
