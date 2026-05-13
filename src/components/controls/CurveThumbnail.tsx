/**
 * Tiny SVG preview of a cubic-bezier curve. Inherits its stroke from
 * the surrounding text via `currentColor`, so a button's active /
 * inactive text colours automatically apply to the curve too.
 *
 * The viewBox is fixed and `overflow: visible` lets curves with
 * negative or > 1 Y values (bounce, elastic) bleed a few pixels past
 * the box — at thumbnail scale this is preferable to normalising
 * every curve into the same window, which would flatten the very
 * differences the thumbnail exists to show.
 */
type Props = {
  value: [number, number, number, number];
  width?: number;
  height?: number;
  className?: string;
};

export function CurveThumbnail({
  value,
  width = 16,
  height = 10,
  className,
}: Props) {
  const PAD = 1;
  const innerW = width - PAD * 2;
  const innerH = height - PAD * 2;
  const x = (px: number) => PAD + px * innerW;
  const y = (py: number) => PAD + (1 - py) * innerH;
  const d = `M ${x(0)} ${y(0)} C ${x(value[0])} ${y(value[1])}, ${x(value[2])} ${y(value[3])}, ${x(1)} ${y(1)}`;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ overflow: 'visible' }}
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="round"
      />
    </svg>
  );
}
