import { useMemo } from 'react';
import { ArrowDownToLine, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useAnimationStore } from '@/store/animationStore';
import {
  clipPathToPoints,
  defaultPolygon,
  pointsToClipPath,
  type ClipPathPoint,
} from '@/lib/clipPath';
import { PolygonEditor } from './PolygonEditor';

/**
 * UI surface for animating CSS `clip-path` as a keyframe property
 * (the second half of the clip-path feature — Feature B of the wave).
 *
 * Pattern matches the existing per-keyframe sections (Color & Filters,
 * Transform 3D): reads the currently-selected keyframe from the
 * animation store and edits ITS clip-path field. Users navigate
 * between keyframes via the timeline; this section follows.
 *
 * Interpolation gotcha — surfaced inline:
 *   CSS only morphs cleanly between polygons with the same vertex
 *   count + same shape function. When adjacent keyframes have
 *   mismatched counts the browser hard-cuts at the keyframe
 *   boundary. The warning + "Match all keyframes to {N} vertices"
 *   button automates the fix without requiring users to manually
 *   match counts vertex-by-vertex.
 */
export function ClipPathAnimationSection() {
  const config = useAnimationStore((s) => s.config);
  const selectedId = useAnimationStore((s) => s.selectedKeyframeId);
  const keyframe = config.keyframes.find((k) => k.id === selectedId);
  const update = useAnimationStore((s) => s.updateKeyframe);

  // Parse the stored CSS clip-path string back into the editor's
  // point array. Returns `null` when the stored value is something
  // the editor can't represent (a future shape function like
  // inset() / circle(), a corrupted value the validator missed) —
  // surface a hint to the user so they know the first edit will
  // overwrite the unparseable value.
  const parsedPoints = useMemo<ClipPathPoint[] | null>(() => {
    if (!keyframe?.clipPath) return null;
    return clipPathToPoints(keyframe.clipPath);
  }, [keyframe?.clipPath]);
  const points = parsedPoints ?? defaultPolygon();
  const parseFailed = !!keyframe?.clipPath && parsedPoints === null;

  // Vertex count per keyframe with a clip-path. Used for both the
  // global "max vertex count" the equaliser targets and the
  // adjacency check below.
  const vertexCountsByKeyframe = useMemo(() => {
    const counts = new Map<string, number>();
    for (const k of config.keyframes) {
      if (!k.clipPath) continue;
      const pts = clipPathToPoints(k.clipPath);
      if (pts) counts.set(k.id, pts.length);
    }
    return counts;
  }, [config.keyframes]);

  const maxVertexCount = useMemo(
    () => Math.max(0, ...Array.from(vertexCountsByKeyframe.values())),
    [vertexCountsByKeyframe]
  );
  const minVertexCount = useMemo(
    () => {
      const vals = Array.from(vertexCountsByKeyframe.values());
      return vals.length ? Math.min(...vals) : 0;
    },
    [vertexCountsByKeyframe]
  );
  // Adjacent-keyframe vertex-count check. Browsers only interpolate
  // between ADJACENT keyframes (in `at` order), so a sequence like
  // 4 → 6 → 4 actually morphs fine: 4↔6 cuts at the boundary but
  // the user explicitly chose those counts. The earlier "any set
  // size > 1" check fired on this case too, prompting users to fix
  // something that already worked. Walk adjacent pairs that both
  // carry clip-path and only flag a real mismatch.
  const hasMismatch = useMemo(() => {
    const sorted = [...config.keyframes].sort((a, b) => a.at - b.at);
    let prevCount: number | null = null;
    for (const k of sorted) {
      const count = vertexCountsByKeyframe.get(k.id);
      if (count === undefined) continue;
      if (prevCount !== null && prevCount !== count) return true;
      prevCount = count;
    }
    return false;
  }, [config.keyframes, vertexCountsByKeyframe]);

  if (!keyframe) return null;

  const hasClipPath = !!keyframe.clipPath;

  const setClipPath = (next: ClipPathPoint[]) => {
    update(keyframe.id, { clipPath: pointsToClipPath(next) });
  };

  const addClipPath = () => {
    // Match the vertex count of an existing keyframe's polygon when
    // any exist, so the new keyframe doesn't immediately trip the
    // mismatch warning. Source polygon: pick the keyframe whose
    // vertex count equals the maxVertexCount so growing isn't
    // needed; copy its points verbatim. Falls back to a 4-pt square
    // when no other keyframe carries a clip-path.
    if (maxVertexCount >= 3) {
      for (const k of config.keyframes) {
        if (k.id === keyframe.id) continue;
        if (!k.clipPath) continue;
        const pts = clipPathToPoints(k.clipPath);
        if (pts && pts.length === maxVertexCount) {
          setClipPath([...pts]);
          return;
        }
      }
    }
    setClipPath(defaultPolygon());
  };

  const removeClipPath = () => {
    update(keyframe.id, { clipPath: undefined });
  };

  /**
   * Equalise every keyframe with a clipPath to `maxVertexCount`
   * vertices by inserting redundant midpoints along the longest
   * edges. CSS clip-path interpolation requires matching vertex
   * counts; this is the safest way to get a smooth morph without
   * forcing the user to manually adjust each keyframe.
   */
  const equaliseAllKeyframes = () => {
    if (maxVertexCount < 3) return;
    for (const k of config.keyframes) {
      if (!k.clipPath) continue;
      const pts = clipPathToPoints(k.clipPath);
      if (!pts) continue;
      if (pts.length === maxVertexCount) continue;
      const grown = growPolygon(pts, maxVertexCount);
      update(k.id, { clipPath: pointsToClipPath(grown) });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {!hasClipPath ? (
        <button
          type="button"
          onClick={addClipPath}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/70 bg-bg-soft px-3 text-xs font-medium text-fg-muted hover:text-fg hover:border-border-strong focus-ring transition-colors"
        >
          <Plus size={14} />
          Add clip-path to this keyframe
        </button>
      ) : (
        <>
          {/* Surface the divergence between stored value and editor
              state when we couldn't parse the stored clip-path
              (future shape function, corrupted import). The first
              edit overwrites the unparseable value — flag it so
              the data loss is intentional, not surprising. */}
          {parseFailed && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] leading-snug text-amber-200/80">
              <AlertTriangle
                size={13}
                className="mt-0.5 shrink-0 text-amber-400"
                aria-hidden
              />
              <span>
                Couldn't parse the stored clip-path (maybe a
                different shape function). Editing here will replace
                it with a polygon.
              </span>
            </div>
          )}
          <div className="grid place-items-center">
            <PolygonEditor points={points} onChange={setClipPath} size={220} />
          </div>
          <button
            type="button"
            onClick={removeClipPath}
            className="inline-flex h-8 items-center justify-center gap-1.5 self-center rounded-lg px-3 text-[11px] text-red-400 hover:bg-red-500/10 hover:text-red-300 focus-ring transition-colors"
          >
            <Trash2 size={12} />
            Remove clip-path from this keyframe
          </button>
        </>
      )}

      {hasMismatch && (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-400" aria-hidden />
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-amber-300">
                Mismatched vertex counts will cut, not morph
              </span>
              <p className="text-[11px] leading-snug text-amber-200/80">
                CSS only interpolates clip-path smoothly between
                polygons with the same number of vertices. Adjacent
                keyframes in your animation have different vertex
                counts ({minVertexCount} – {maxVertexCount}) so the
                browser will hard-cut at those boundaries instead of
                morphing. Bring every keyframe up to {maxVertexCount}
                vertices to get a smooth shape morph.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={equaliseAllKeyframes}
            className="inline-flex h-7 items-center justify-center gap-1.5 self-start rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 text-[11px] font-medium text-amber-300 hover:bg-amber-500/15 focus-ring transition-colors"
          >
            <ArrowDownToLine size={12} className="rotate-180" />
            Match all keyframes to {maxVertexCount} vertices
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Insert redundant vertices along the longest edges until the polygon
 * has `target` vertices. The new vertices sit on existing edges, so
 * the polygon's visible shape is unchanged — but its vertex count
 * now matches a neighbour, enabling smooth CSS clip-path interpolation.
 */
function growPolygon(
  pts: ReadonlyArray<ClipPathPoint>,
  target: number
): ClipPathPoint[] {
  let out: ClipPathPoint[] = [...pts];
  while (out.length < target) {
    // Find the longest edge; insert a midpoint vertex on it.
    let longestIdx = 0;
    let longestSq = -1;
    for (let i = 0; i < out.length; i++) {
      const a = out[i];
      const b = out[(i + 1) % out.length];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const d = dx * dx + dy * dy;
      if (d > longestSq) {
        longestSq = d;
        longestIdx = i;
      }
    }
    const a = out[longestIdx];
    const b = out[(longestIdx + 1) % out.length];
    const mid: ClipPathPoint = [
      Math.round(((a[0] + b[0]) / 2) * 1000) / 1000,
      Math.round(((a[1] + b[1]) / 2) * 1000) / 1000,
    ];
    out = [
      ...out.slice(0, longestIdx + 1),
      mid,
      ...out.slice(longestIdx + 1),
    ];
  }
  return out;
}
