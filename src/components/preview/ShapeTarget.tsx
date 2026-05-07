import { SHAPE_BY_KIND } from '@/lib/shapes';
import type { ShapeKind } from '@/types/animation';

type Props = {
  shape: ShapeKind;
  className: string;
};

export function ShapeTarget({ shape, className }: Props) {
  const def = SHAPE_BY_KIND[shape];
  return (
    <div
      className={`${className} h-32 w-32 sm:h-40 sm:w-40 bg-gradient-to-br from-accent via-accent/80 to-accent/40 shadow-glow`}
      style={{
        clipPath: def.clipPath ?? undefined,
        borderRadius: def.borderRadius,
      }}
      role="img"
      aria-label={def.label}
    />
  );
}
