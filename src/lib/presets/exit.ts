import type { Preset } from './types';

const uid = () => Math.random().toString(36).slice(2, 9);
const blank = { translate: [0, 0] as [number, number], rotate: [0, 0] as [number, number], skew: [0, 0] as [number, number], scale: [1, 1] as [number, number] };

export const EXIT_PRESETS: Preset[] = [
  {
    id: 'fade-out',
    name: 'Fade out',
    category: 'exit',
    build: () => ({
      target: 'shape', selector: '.animated', shape: 'square', text: 'Animate', svgPath: 'check',
      iterations: 1, direction: 'normal', fill: 'forwards',
      keyframes: [
        { id: uid(), at: 0, opacity: 1, transform: { ...blank } },
        { id: uid(), at: 100, opacity: 0, transform: { ...blank } },
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
        { id: uid(), at: 0, opacity: 1, transform: { ...blank } },
        { id: uid(), at: 100, opacity: 0, transform: { ...blank, translate: [0, 30] } },
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
        { id: uid(), at: 0, opacity: 1, transform: { ...blank } },
        { id: uid(), at: 100, opacity: 0, transform: { ...blank, scale: [0.4, 0.4] } },
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
        { id: uid(), at: 0, opacity: 1, blur: 0, transform: { ...blank } },
        { id: uid(), at: 100, opacity: 0, blur: 14, transform: { ...blank } },
      ],
      duration: 600, delay: 0,
      easing: { kind: 'cubic', v: [0.4, 0, 1, 1] },
    }),
  },
];
