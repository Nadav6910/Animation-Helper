import type { ShapeKind } from '@/types/animation';

export type ShapeDef = {
  kind: ShapeKind;
  label: string;
  clipPath: string | null;
  borderRadius?: string;
};

export const SHAPES: ShapeDef[] = [
  { kind: 'square', label: 'Square', clipPath: null, borderRadius: '12px' },
  { kind: 'circle', label: 'Circle', clipPath: null, borderRadius: '50%' },
  {
    kind: 'triangle',
    label: 'Triangle',
    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
  },
  {
    kind: 'star',
    label: 'Star',
    clipPath:
      'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
  },
  {
    kind: 'arrow',
    label: 'Arrow',
    clipPath:
      'polygon(0% 35%, 60% 35%, 60% 15%, 100% 50%, 60% 85%, 60% 65%, 0% 65%)',
  },
  {
    kind: 'message',
    label: 'Message',
    clipPath:
      'polygon(0 0, 100% 0, 100% 75%, 75% 75%, 65% 100%, 60% 75%, 0 75%)',
  },
];

export const SHAPE_BY_KIND: Record<ShapeKind, ShapeDef> = Object.fromEntries(
  SHAPES.map((s) => [s.kind, s])
) as Record<ShapeKind, ShapeDef>;
