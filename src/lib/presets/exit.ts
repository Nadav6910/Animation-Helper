import type { Preset } from './types';
import { blank, uid } from './shared';


export const EXIT_PRESETS: Preset[] = [
  {
    id: 'fade-out',
    name: 'Fade out',
    category: 'exit',
    description: 'Smooth opacity fade to invisible',
    build: () => ({
      target: 'shape', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 1, direction: 'normal', fill: 'forwards',
      keyframes: [
        { id: uid(), at: 0, opacity: 1, transform: { ...blank() } },
        { id: uid(), at: 100, opacity: 0, transform: { ...blank() } },
      ],
      duration: 900, delay: 0,
      easing: { kind: 'cubic', v: [0.4, 0, 1, 1] },
    }),
  },
  {
    id: 'slide-down-fade',
    name: 'Slide down · fade',
    category: 'exit',
    description: 'Drops away below the baseline with a fade',
    build: () => ({
      target: 'shape', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 1, direction: 'normal', fill: 'forwards',
      keyframes: [
        { id: uid(), at: 0, opacity: 1, transform: { ...blank() } },
        { id: uid(), at: 100, opacity: 0, transform: { ...blank(), translate: [0, 30] } },
      ],
      duration: 1000, delay: 0,
      easing: { kind: 'cubic', v: [0.4, 0, 1, 1] },
    }),
  },
  {
    id: 'zoom-out',
    name: 'Zoom out',
    category: 'exit',
    description: 'Scales down to a point and fades',
    build: () => ({
      target: 'shape', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 1, direction: 'normal', fill: 'forwards',
      keyframes: [
        { id: uid(), at: 0, opacity: 1, transform: { ...blank() } },
        { id: uid(), at: 100, opacity: 0, transform: { ...blank(), scale: [0.4, 0.4] } },
      ],
      duration: 900, delay: 0,
      easing: { kind: 'cubic', v: [0.4, 0, 1, 1] },
    }),
  },
  {
    id: 'blur-out',
    name: 'Blur out',
    category: 'exit',
    description: 'Dissolves into a soft blur with fade',
    build: () => ({
      target: 'shape', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 1, direction: 'normal', fill: 'forwards',
      keyframes: [
        { id: uid(), at: 0, opacity: 1, blur: 0, transform: { ...blank() } },
        { id: uid(), at: 100, opacity: 0, blur: 14, transform: { ...blank() } },
      ],
      duration: 1000, delay: 0,
      easing: { kind: 'cubic', v: [0.4, 0, 1, 1] },
    }),
  },
  {
    id: 'swoop-out',
    name: 'Swoop out',
    category: 'exit',
    description: 'Sweeps out to the right with a slight tilt',
    build: () => ({
      target: 'shape', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 1, direction: 'normal', fill: 'forwards',
      // Mirrors the entrance `swoop-in` so the two compose into a
      // natural enter/leave pair: diagonal translate + in-plane
      // rotate gives the element a "card flying off" exit.
      keyframes: [
        { id: uid(), at: 0, opacity: 1, transform: { ...blank() } },
        { id: uid(), at: 100, opacity: 0, transform: { ...blank(), translate: [60, -20], rotate3d: { x: 0, y: 0, z: 1, deg: 25 } } },
      ],
      duration: 1000, delay: 0,
      easing: { kind: 'cubic', v: [0.5, 0, 0.75, 0] },
    }),
  },
  {
    id: 'shrink-spin',
    name: 'Shrink · spin',
    category: 'exit',
    description: 'Shrinks while spinning out of view',
    build: () => ({
      target: 'shape', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 1, direction: 'normal', fill: 'forwards',
      // Two motions in one — scale to nothing while rotating around
      // the screen normal. Reads as the element being "sucked away"
      // and contrasts with the linear zoom-out already in the set.
      keyframes: [
        { id: uid(), at: 0, opacity: 1, transform: { ...blank() } },
        { id: uid(), at: 100, opacity: 0, transform: { ...blank(), scale: [0, 0], rotate3d: { x: 0, y: 0, z: 1, deg: 180 } } },
      ],
      duration: 1000, delay: 0,
      easing: { kind: 'cubic', v: [0.5, 0, 0.75, 0] },
    }),
  },
];
