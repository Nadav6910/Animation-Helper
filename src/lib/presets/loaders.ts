import type { Preset } from './types';
import { blank, uid } from './shared';


export const LOADER_PRESETS: Preset[] = [
  {
    id: 'spinner',
    name: 'Spinner',
    category: 'loaders',
    description: 'Continuous full-rotation spin at a steady pace',
    build: () => ({
      target: 'shape', selector: '.animated', shape: 'circle', text: 'Animate', svgPath: 'check',
      iterations: 'infinite', direction: 'normal', fill: 'none',
      keyframes: [
        { id: uid(), at: 0, transform: { ...blank(), rotate: [0, 0] } },
        { id: uid(), at: 100, transform: { ...blank(), rotate: [0, 360] } },
      ],
      duration: 1400, delay: 0,
      easing: { kind: 'preset', value: 'linear' },
    }),
  },
  {
    id: 'dot-pulse',
    name: 'Dot pulse',
    category: 'loaders',
    description: 'Scale and opacity breathe in unison',
    build: () => ({
      target: 'shape', selector: '.animated', shape: 'circle', text: 'Animate', svgPath: 'check',
      iterations: 'infinite', direction: 'normal', fill: 'none',
      keyframes: [
        { id: uid(), at: 0, opacity: 0.4, transform: { ...blank(), scale: [0.8, 0.8] } },
        { id: uid(), at: 50, opacity: 1, transform: { ...blank(), scale: [1.2, 1.2] } },
        { id: uid(), at: 100, opacity: 0.4, transform: { ...blank(), scale: [0.8, 0.8] } },
      ],
      duration: 1600, delay: 0,
      easing: { kind: 'preset', value: 'ease-in-out' },
    }),
  },
  {
    id: 'circle-draw',
    name: 'Circle draw',
    category: 'loaders',
    description: 'SVG stroke draws itself around the circle',
    build: () => ({
      target: 'svg', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'circle',
      iterations: 'infinite', direction: 'normal', fill: 'forwards',
      keyframes: [
        { id: uid(), at: 0, strokeDashoffset: 100 },
        { id: uid(), at: 100, strokeDashoffset: 0 },
      ],
      duration: 2000, delay: 0,
      easing: { kind: 'cubic', v: [0.4, 0, 0.2, 1] },
    }),
  },
  {
    id: 'bar-bounce',
    name: 'Bar bounce',
    category: 'loaders',
    description: 'Vertical scale alternates between endpoints',
    build: () => ({
      target: 'shape', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 'infinite', direction: 'alternate', fill: 'none',
      keyframes: [
        { id: uid(), at: 0, transform: { ...blank(), scale: [1, 0.4] } },
        { id: uid(), at: 100, transform: { ...blank(), scale: [1, 1.6] } },
      ],
      duration: 1000, delay: 0,
      easing: { kind: 'preset', value: 'ease-in-out' },
    }),
  },
  {
    id: 'fade-spin',
    name: 'Fade spin',
    category: 'loaders',
    description: 'Spin coupled with a breathing opacity pulse',
    build: () => ({
      target: 'shape', selector: '.animated', shape: 'circle', text: 'Animate', svgPath: 'check',
      iterations: 'infinite', direction: 'normal', fill: 'none',
      // rotate3d on Z gives a full 360° in-plane spin; opacity dips
      // to 0.3 at the midpoint and recovers, layering two channels
      // of motion onto the loader without needing a multi-element
      // setup. Linear keeps the spin perceptually steady.
      keyframes: [
        { id: uid(), at: 0, opacity: 1, transform: { ...blank(), rotate3d: { x: 0, y: 0, z: 1, deg: 0 } } },
        { id: uid(), at: 50, opacity: 0.3, transform: { ...blank(), rotate3d: { x: 0, y: 0, z: 1, deg: 180 } } },
        { id: uid(), at: 100, opacity: 1, transform: { ...blank(), rotate3d: { x: 0, y: 0, z: 1, deg: 360 } } },
      ],
      duration: 1600, delay: 0,
      easing: { kind: 'preset', value: 'linear' },
    }),
  },
  {
    id: 'bar-pulse',
    name: 'Bar pulse',
    category: 'loaders',
    description: 'Vertical scale pulse that breathes in place',
    build: () => ({
      target: 'shape', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 'infinite', direction: 'normal', fill: 'none',
      // Distinct from bar-bounce (alternating endpoints): this one
      // returns to baseline every cycle, giving a heartbeat-like
      // breathing rhythm rather than a metronome bounce. Endpoints
      // use the identity transform (no explicit scale) so the
      // generated CSS stays as clean as bar-bounce's.
      keyframes: [
        { id: uid(), at: 0, transform: { ...blank() } },
        { id: uid(), at: 50, transform: { ...blank(), scale: [1, 1.5] } },
        { id: uid(), at: 100, transform: { ...blank() } },
      ],
      duration: 1400, delay: 0,
      easing: { kind: 'preset', value: 'ease-in-out' },
    }),
  },
];
