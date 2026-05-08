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
      duration: 700, delay: 0,
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
      duration: 1400, delay: 0,
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
      duration: 800, delay: 0,
      easing: { kind: 'cubic', v: [0.4, 0, 0.2, 1] },
      stagger: { step: 50 },
    }),
  },
];
