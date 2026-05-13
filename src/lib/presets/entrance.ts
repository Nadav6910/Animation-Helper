import type { Preset } from './types';
import { baseScaffold, blank, uid } from './shared';

const baseShape = () => ({
  ...baseScaffold(),
  iterations: 1 as const,
  direction: 'normal' as const,
  fill: 'forwards' as const,
});

export const ENTRANCE_PRESETS: Preset[] = [
  {
    id: 'fade-in',
    name: 'Fade in',
    category: 'entrance',
    description: 'Smooth opacity rise',
    build: () => ({
      ...baseShape(),
      keyframes: [
        { id: uid(), at: 0, opacity: 0, transform: { ...blank() } },
        { id: uid(), at: 100, opacity: 1, transform: { ...blank() } },
      ],
      duration: 1000,
      delay: 0,
      easing: { kind: 'cubic', v: [0.4, 0, 0.2, 1] },
    }),
  },
  {
    id: 'slide-up-fade',
    name: 'Slide up · fade',
    category: 'entrance',
    build: () => ({
      ...baseShape(),
      keyframes: [
        { id: uid(), at: 0, opacity: 0, transform: { ...blank(), translate: [0, 30] } },
        { id: uid(), at: 100, opacity: 1, transform: { ...blank() } },
      ],
      duration: 1100,
      delay: 0,
      easing: { kind: 'cubic', v: [0.16, 1, 0.3, 1] },
    }),
  },
  {
    id: 'slide-left-fade',
    name: 'Slide left · fade',
    category: 'entrance',
    build: () => ({
      ...baseShape(),
      keyframes: [
        { id: uid(), at: 0, opacity: 0, transform: { ...blank(), translate: [40, 0] } },
        { id: uid(), at: 100, opacity: 1, transform: { ...blank() } },
      ],
      duration: 1100,
      delay: 0,
      easing: { kind: 'cubic', v: [0.16, 1, 0.3, 1] },
    }),
  },
  {
    id: 'zoom-in',
    name: 'Zoom in',
    category: 'entrance',
    build: () => ({
      ...baseShape(),
      keyframes: [
        { id: uid(), at: 0, opacity: 0, transform: { ...blank(), scale: [0.6, 0.6] } },
        { id: uid(), at: 100, opacity: 1, transform: { ...blank() } },
      ],
      duration: 1000,
      delay: 0,
      easing: { kind: 'cubic', v: [0.34, 1.56, 0.64, 1] },
    }),
  },
  {
    id: 'blur-in',
    name: 'Blur in',
    category: 'entrance',
    build: () => ({
      ...baseShape(),
      keyframes: [
        { id: uid(), at: 0, opacity: 0, blur: 14, transform: { ...blank() } },
        { id: uid(), at: 100, opacity: 1, blur: 0, transform: { ...blank() } },
      ],
      duration: 1300,
      delay: 0,
      easing: { kind: 'cubic', v: [0.4, 0, 0.2, 1] },
    }),
  },
  {
    id: 'flip-in',
    name: 'Flip in',
    category: 'entrance',
    build: () => ({
      ...baseShape(),
      keyframes: [
        { id: uid(), at: 0, opacity: 0, transform: { ...blank(), rotate: [-90, 0] } },
        { id: uid(), at: 100, opacity: 1, transform: { ...blank() } },
      ],
      duration: 1100,
      delay: 0,
      easing: { kind: 'cubic', v: [0.34, 1.56, 0.64, 1] },
    }),
  },
  {
    id: 'drop-in',
    name: 'Drop in',
    category: 'entrance',
    build: () => ({
      ...baseShape(),
      keyframes: [
        { id: uid(), at: 0, opacity: 0, transform: { ...blank(), translate: [0, -80], scale: [0.8, 0.8] } },
        { id: uid(), at: 70, opacity: 1, transform: { ...blank(), translate: [0, 8], scale: [1.05, 1.05] } },
        { id: uid(), at: 100, opacity: 1, transform: { ...blank() } },
      ],
      duration: 1400,
      delay: 0,
      easing: { kind: 'cubic', v: [0.34, 1.56, 0.64, 1] },
    }),
  },
  {
    id: 'rise-rotate',
    name: 'Rise · rotate',
    category: 'entrance',
    description: 'Rises from below with a gentle quarter turn',
    build: () => ({
      ...baseShape(),
      // rotate3d around the Z axis (the screen's normal) gives a flat
      // in-plane rotation, distinct from flip-in's X-axis flip. Combined
      // with a vertical rise this reads as a "spinning into place" entry.
      keyframes: [
        { id: uid(), at: 0, opacity: 0, transform: { ...blank(), translate: [0, 36], rotate3d: { x: 0, y: 0, z: 1, deg: -45 } } },
        { id: uid(), at: 100, opacity: 1, transform: { ...blank() } },
      ],
      duration: 1100,
      delay: 0,
      easing: { kind: 'cubic', v: [0.16, 1, 0.3, 1] },
    }),
  },
  {
    id: 'fold-down',
    name: 'Fold down',
    category: 'entrance',
    description: 'Folds in from above on a horizontal hinge',
    build: () => ({
      ...baseShape(),
      // Hinge on the X axis from above (rotateX -90 to 0). perspective
      // gives the fold real depth; without it the rotation collapses
      // to a flat squish and the user just sees a vertical scale.
      keyframes: [
        { id: uid(), at: 0, opacity: 0, transform: { ...blank(), perspective: 800, rotate: [-90, 0] } },
        { id: uid(), at: 100, opacity: 1, transform: { ...blank(), perspective: 800 } },
      ],
      duration: 1100,
      delay: 0,
      easing: { kind: 'cubic', v: [0.34, 1.56, 0.64, 1] },
    }),
  },
  {
    id: 'swoop-in',
    name: 'Swoop in',
    category: 'entrance',
    description: 'Sweeps in from the right with a slight tilt',
    build: () => ({
      ...baseShape(),
      // Combined diagonal translate + Z-axis rotate (in-plane spin)
      // gives a "card flying in from a distance" feel that none of the
      // existing slide / flip presets cover.
      keyframes: [
        { id: uid(), at: 0, opacity: 0, transform: { ...blank(), translate: [60, -20], rotate3d: { x: 0, y: 0, z: 1, deg: 25 } } },
        { id: uid(), at: 100, opacity: 1, transform: { ...blank() } },
      ],
      duration: 1100,
      delay: 0,
      easing: { kind: 'cubic', v: [0.22, 1, 0.36, 1] },
    }),
  },
];
