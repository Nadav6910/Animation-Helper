import type { AnimationConfig, Transform } from '@/types/animation';
import { uid } from '@/lib/uid';

/** Identity transform — every key fills with its resting value so the
 *  generators don't have to back-fill at the channel level. Always call
 *  through {@link blank} so two keyframes never share an inner array. */
export function blank(): Transform {
  return {
    translate: [0, 0],
    rotate: [0, 0],
    skew: [0, 0],
    scale: [1, 1],
  };
}

/** Common scaffold for preset configs — everything except the
 *  animation itself. Spreading this into a preset's build() output
 *  keeps target-mode fields consistent across the five preset files. */
export function baseScaffold(): Pick<
  AnimationConfig,
  'target' | 'selector' | 'shape' | 'text' | 'svgPath'
> {
  return {
    target: 'shape',
    selector: '.animated',
    shape: 'square',
    text: 'Animate',
    svgPath: 'check',
  };
}

/** Re-export the centralised id factory so preset files don't need a
 *  second import line. */
export { uid };
