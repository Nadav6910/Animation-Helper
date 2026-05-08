import type { ShapeKind } from '@/types/animation';

export type ShapeDef = {
  kind: ShapeKind;
  label: string;
  clipPath: string | null;
  borderRadius?: string;
  /**
   * Crisp 100×100 thumbnail geometry for the picker. `kind: 'rect'` and
   * `'circle'` use plain SVG primitives so rounded square + circle stay sharp;
   * `'path'` uses an `M…Z` path translated from the same proportions as the
   * stage `clipPath`, guaranteeing visual parity.
   */
  preview:
    | { kind: 'rect'; rx: number }
    | { kind: 'circle' }
    | { kind: 'path'; d: string };
};

export const SHAPES: ShapeDef[] = [
  {
    kind: 'square',
    label: 'Square',
    clipPath: null,
    borderRadius: '12px',
    preview: { kind: 'rect', rx: 12 },
  },
  {
    kind: 'circle',
    label: 'Circle',
    clipPath: null,
    borderRadius: '50%',
    preview: { kind: 'circle' },
  },
  {
    kind: 'triangle',
    label: 'Triangle',
    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
    preview: { kind: 'path', d: 'M50 0 L0 100 L100 100 Z' },
  },
  {
    kind: 'star',
    label: 'Star',
    clipPath:
      'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
    preview: {
      kind: 'path',
      d: 'M50 0 L61 35 L98 35 L68 57 L79 91 L50 70 L21 91 L32 57 L2 35 L39 35 Z',
    },
  },
  {
    kind: 'arrow',
    label: 'Arrow',
    clipPath:
      'polygon(0% 35%, 60% 35%, 60% 15%, 100% 50%, 60% 85%, 60% 65%, 0% 65%)',
    preview: {
      kind: 'path',
      d: 'M0 35 L60 35 L60 15 L100 50 L60 85 L60 65 L0 65 Z',
    },
  },
  {
    kind: 'message',
    label: 'Message',
    clipPath:
      'polygon(0 0, 100% 0, 100% 75%, 75% 75%, 65% 100%, 60% 75%, 0 75%)',
    preview: {
      kind: 'path',
      d: 'M0 0 L100 0 L100 75 L75 75 L65 100 L60 75 L0 75 Z',
    },
  },
];

export const SHAPE_BY_KIND: Record<ShapeKind, ShapeDef> = Object.fromEntries(
  SHAPES.map((s) => [s.kind, s])
) as Record<ShapeKind, ShapeDef>;
