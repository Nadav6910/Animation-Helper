import { SHAPE_BY_KIND } from '@/lib/shapes';
import type { ShapeKind } from '@/types/animation';
import type { CSSProperties } from 'react';

type Props = {
  shape: ShapeKind;
  className: string;
};

const DEFAULT_SIZE = 'h-32 w-32 sm:h-40 sm:w-40';

export function ShapeTarget({ shape, className }: Props) {
  const def = SHAPE_BY_KIND[shape];

  // Mask-image needs both spec + -webkit prefixes for Safari, and
  // mask-size: 100% 100% so a 100×100 viewBox scales to fill the box.
  const style: CSSProperties = {
    clipPath: def.clipPath ?? undefined,
    borderRadius: def.borderRadius,
  };
  if (def.maskImage) {
    style.maskImage = def.maskImage;
    (style as Record<string, unknown>).WebkitMaskImage = def.maskImage;
    style.maskSize = '100% 100%';
    (style as Record<string, unknown>).WebkitMaskSize = '100% 100%';
    style.maskRepeat = 'no-repeat';
    (style as Record<string, unknown>).WebkitMaskRepeat = 'no-repeat';
  }

  return (
    <div
      className={`${className} ${def.containerClass ?? DEFAULT_SIZE} bg-gradient-to-br from-accent via-accent/80 to-accent/40 shadow-glow`}
      style={style}
      role="img"
      aria-label={def.label}
    />
  );
}
