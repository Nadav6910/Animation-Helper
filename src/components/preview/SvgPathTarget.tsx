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
      className="h-44 w-44 sm:h-56 sm:w-56 text-accent drop-shadow-[0_0_24px_rgb(var(--accent)/0.4)]"
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
        style={{ strokeDasharray: 100 }}
      />
    </svg>
  );
}
