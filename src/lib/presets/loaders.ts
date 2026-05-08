import type { Preset } from './types';
import { blank, uid } from './shared';


export const LOADER_PRESETS: Preset[] = [
  {
    id: 'spinner',
    name: 'Spinner',
    category: 'loaders',
    build: () => ({
      target: 'shape', selector: '.animated', shape: 'circle', text: 'Animate', svgPath: 'check',
      iterations: 'infinite', direction: 'normal', fill: 'none',
      keyframes: [
        { id: uid(), at: 0, transform: { ...blank(), rotate: [0, 0] } },
        { id: uid(), at: 100, transform: { ...blank(), rotate: [0, 360] } },
      ],
      duration: 1000, delay: 0,
      easing: { kind: 'preset', value: 'linear' },
    }),
  },
  {
    id: 'dot-pulse',
    name: 'Dot pulse',
    category: 'loaders',
    build: () => ({
      target: 'shape', selector: '.animated', shape: 'circle', text: 'Animate', svgPath: 'check',
      iterations: 'infinite', direction: 'normal', fill: 'none',
      keyframes: [
        { id: uid(), at: 0, opacity: 0.4, transform: { ...blank(), scale: [0.8, 0.8] } },
        { id: uid(), at: 50, opacity: 1, transform: { ...blank(), scale: [1.2, 1.2] } },
        { id: uid(), at: 100, opacity: 0.4, transform: { ...blank(), scale: [0.8, 0.8] } },
      ],
      duration: 1200, delay: 0,
      easing: { kind: 'preset', value: 'ease-in-out' },
    }),
  },
  {
    id: 'circle-draw',
    name: 'Circle draw',
    category: 'loaders',
    build: () => ({
      target: 'svg', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'circle',
      iterations: 'infinite', direction: 'normal', fill: 'forwards',
      keyframes: [
        { id: uid(), at: 0, strokeDashoffset: 100 },
        { id: uid(), at: 100, strokeDashoffset: 0 },
      ],
      duration: 1500, delay: 0,
      easing: { kind: 'cubic', v: [0.4, 0, 0.2, 1] },
    }),
  },
  {
    id: 'bar-bounce',
    name: 'Bar bounce',
    category: 'loaders',
    build: () => ({
      target: 'shape', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 'infinite', direction: 'alternate', fill: 'none',
      keyframes: [
        { id: uid(), at: 0, transform: { ...blank(), scale: [1, 0.4] } },
        { id: uid(), at: 100, transform: { ...blank(), scale: [1, 1.6] } },
      ],
      duration: 600, delay: 0,
      easing: { kind: 'preset', value: 'ease-in-out' },
    }),
  },
];
