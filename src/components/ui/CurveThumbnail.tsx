/**
 * Tiny SVG preview of a cubic-bezier curve. Inherits its stroke from
 * the surrounding text via `currentColor`, so a button's active /
 * inactive text colours automatically apply to the curve too.
 *
 * Y is normalised to the actual range of each curve (including any
 * overshoot) with a small 5 % buffer above and below. That keeps the
 * full curve shape inside the SVG box for overshoot curves like
 * bounce / elastic (which would otherwise bleed several pixels into
 * the row above), while still showing each curve's distinctive
 * curvature — what the thumbnail is for. The trade-off is that
 * absolute Y magnitudes are not comparable across thumbnails; users
 * inspect those in the full editor.
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
  // Range always covers [0, 1] at minimum so non-overshoot curves
  // (linear, ease, ease-in / -out / -in-out) render at the same Y scale.
  // Overshoot curves (bounce, elastic) expand the range so their
  // extrema fit inside.
  const yMin = Math.min(0, value[1], value[3]) - 0.05;
  const yMax = Math.max(1, value[1], value[3]) + 0.05;
  const yRange = yMax - yMin;
  const x = (px: number) => PAD + px * innerW;
  const y = (py: number) => PAD + ((yMax - py) / yRange) * innerH;
  const d = `M ${x(0)} ${y(0)} C ${x(value[0])} ${y(value[1])}, ${x(value[2])} ${y(value[3])}, ${x(1)} ${y(1)}`;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
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
