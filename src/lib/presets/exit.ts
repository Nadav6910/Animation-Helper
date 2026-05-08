import type { Preset } from './types';
import { blank, uid } from './shared';


export const EXIT_PRESETS: Preset[] = [
  {
    id: 'fade-out',
    name: 'Fade out',
    category: 'exit',
    build: () => ({
      target: 'shape', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 1, direction: 'normal', fill: 'forwards',
      keyframes: [
        { id: uid(), at: 0, opacity: 1, transform: { ...blank() } },
        { id: uid(), at: 100, opacity: 0, transform: { ...blank() } },
      ],
      duration: 500, delay: 0,
      easing: { kind: 'cubic', v: [0.4, 0, 1, 1] },
    }),
  },
  {
    id: 'slide-down-fade',
    name: 'Slide down · fade',
    category: 'exit',
    build: () => ({
      target: 'shape', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 1, direction: 'normal', fill: 'forwards',
      keyframes: [
        { id: uid(), at: 0, opacity: 1, transform: { ...blank() } },
        { id: uid(), at: 100, opacity: 0, transform: { ...blank(), translate: [0, 30] } },
      ],
      duration: 600, delay: 0,
      easing: { kind: 'cubic', v: [0.4, 0, 1, 1] },
    }),
  },
  {
    id: 'zoom-out',
    name: 'Zoom out',
    category: 'exit',
    build: () => ({
      target: 'shape', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 1, direction: 'normal', fill: 'forwards',
      keyframes: [
        { id: uid(), at: 0, opacity: 1, transform: { ...blank() } },
        { id: uid(), at: 100, opacity: 0, transform: { ...blank(), scale: [0.4, 0.4] } },
      ],
      duration: 500, delay: 0,
      easing: { kind: 'cubic', v: [0.4, 0, 1, 1] },
    }),
  },
  {
    id: 'blur-out',
    name: 'Blur out',
    category: 'exit',
    build: () => ({
      target: 'shape', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 1, direction: 'normal', fill: 'forwards',
      keyframes: [
        { id: uid(), at: 0, opacity: 1, blur: 0, transform: { ...blank() } },
        { id: uid(), at: 100, opacity: 0, blur: 14, transform: { ...blank() } },
      ],
      duration: 600, delay: 0,
      easing: { kind: 'cubic', v: [0.4, 0, 1, 1] },
    }),
  },
];
