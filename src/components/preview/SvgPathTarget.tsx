import { SVG_PATH_BY_ID } from '@/lib/svgPaths';
import { useCustomPathsStore } from '@/store/customPathsStore';

type Props = {
  pathId: string;
  className: string;
};

/**
 * `pathLength={100}` normalises the path's logical length to 100 units
 * regardless of actual geometry, so `stroke-dashoffset: 0 → 100` always
 * corresponds to "fully drawn → invisible" without per-path measurement.
 */
export function SvgPathTarget({ pathId, className }: Props) {
  const customPaths = useCustomPathsStore((s) => s.paths);
  const builtin = SVG_PATH_BY_ID[pathId];
  const custom = customPaths.find((p) => p.id === pathId);
  const def = builtin ?? custom ?? Object.values(SVG_PATH_BY_ID)[0];

  return (
    <svg
      viewBox={def.viewBox}
      // overflow: visible lets the path leave its viewBox under animation
      // — translate / scale / offset-path that pushes the geometry past
      // the box would otherwise be clipped by the SVG element's default
      // overflow:hidden.
      style={{ overflow: 'visible' }}
      className="h-44 w-44 sm:h-56 sm:w-56 text-accent"
      fill="none"
      strokeWidth={2}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={def.label}
    >
      <path
        d={def.d}
        pathLength={100}
        className={className}
        // The shadow lives on the path, not on the parent <svg>. Putting
        // it on the SVG element computes the filter over the whole SVG
        // box so a partially-drawn or translated path leaves a faint
        // box-sized halo behind. Path-level drop-shadow only traces the
        // visible stroke so the box bounds disappear.
        style={{
          strokeDasharray: 100,
          filter: 'drop-shadow(0 0 14px rgb(var(--accent) / 0.5))',
        }}
      />
    </svg>
  );
}
