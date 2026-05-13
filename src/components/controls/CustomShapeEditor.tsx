import { useEffect, useId, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Trash2 } from 'lucide-react';
import { PolygonEditor } from './PolygonEditor';
import { defaultPolygon, pointsToClipPath, type ClipPathPoint } from '@/lib/clipPath';
import { useCustomShapesStore } from '@/store/customShapesStore';
import { useUiStore } from '@/store/uiStore';
import { copyToClipboard } from '@/lib/clipboard';
import type { CustomShape, CustomShapeId } from '@/types/animation';
import { cn } from '@/lib/cn';

type Props = {
  /** If set, edit this custom shape; otherwise create a new one. */
  editing?: CustomShape | null;
  onCancel: () => void;
  /** Fires after a successful save (create or rename). Caller uses
   *  this to auto-select the newly-saved shape on the stage. */
  onSaved?: (id: CustomShapeId) => void;
  /** Fires after a delete so the caller can reset any state that
   *  referenced the now-removed shape (most importantly,
   *  AnimationConfig.shape if it pointed at this id). */
  onDeleted?: (id: CustomShapeId) => void;
};

/**
 * Inline custom-shape editor. Lives inside the shapes card — NOT in
 * a modal — so:
 *
 *  - On mobile the user keeps the sheet's native scroll. A modal
 *    layered over the sheet had to manage its own overflow and on
 *    short viewports the Save / Cancel row fell off the bottom; an
 *    inline section just expands the sheet's scroll height.
 *  - No focus trap / backdrop / z-index gymnastics. Tab order flows
 *    naturally from the picker into the editor and back.
 *  - The polygon editor's `touch-action: none` only blocks gestures
 *    *inside* the 240-px canvas; the rest of the card scrolls
 *    normally.
 *
 * Two modes:
 *  - Create (no `editing` prop): starts from defaultPolygon. Save
 *    adds to the store and reports the new id.
 *  - Edit (editing prop set): pre-fills name; the polygon itself
 *    renders read-only because clobbering the geometry of a shape
 *    that already has active animations using it is a v2 concern.
 *    Rename + delete are exposed.
 */
export function CustomShapeEditor({
  editing,
  onCancel,
  onSaved,
  onDeleted,
}: Props) {
  const titleId = useId();
  const nameInputId = useId();
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const add = useCustomShapesStore((s) => s.add);
  const update = useCustomShapesStore((s) => s.update);
  const remove = useCustomShapesStore((s) => s.remove);
  const showToast = useUiStore((s) => s.showToast);
  const [justCopied, setJustCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  // Clear the pending check-icon timer on unmount so we don't call
  // setJustCopied on a stale component if the user closes the editor
  // within the 1.5s feedback window.
  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const [name, setName] = useState(() => editing?.name ?? '');
  const [points, setPoints] = useState<ClipPathPoint[]>(() =>
    editing ? editing.points.map(([x, y]) => [x, y] as ClipPathPoint) : defaultPolygon()
  );

  // Re-seed when the editor flips between create / edit modes. The
  // identity that matters is the `editing` shape id (or `null`); a
  // mid-flight rename of the same shape shouldn't wipe the local
  // state.
  const editingId = editing?.id ?? null;
  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setPoints(editing.points.map(([x, y]) => [x, y] as ClipPathPoint));
    } else {
      setName('');
      setPoints(defaultPolygon());
    }
    // Deliberately NOT auto-focusing the name input: on mobile that
    // raises the on-screen keyboard the moment the editor expands,
    // which covers the polygon canvas the user just opened it to
    // see. Desktop users one tap away from the field anyway.
    //
    // Still scroll the section into view so the canvas isn't
    // hidden below the mobile sheet's fold when the user expands
    // the editor.
    containerRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  // Escape cancels the editor — registered at window level so the
  // listener works regardless of which child has focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Don't intercept if the user is editing a field that has
        // its own Escape handler (the polygon editor's vertex
        // buttons don't, but future child inputs might).
        const tag = (e.target as HTMLElement | null)?.tagName ?? '';
        if (tag === 'INPUT' || tag === 'TEXTAREA') {
          // Let the input clear itself first; we'll get focus back.
          return;
        }
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const handleSave = () => {
    if (editing) {
      // Editing a saved shape updates both the name AND the polygon
      // geometry now. Original v1 deferral worried about clobbering
      // animations using this shape, but on close inspection that's
      // a non-issue: `config.shape` references the shape by ID and
      // the renderer reads its points live via `resolveShapeDef`, so
      // edits propagate to the static preview as intended; and
      // keyframe `clipPath` values are independent string snapshots
      // (copied at the moment the user applied them) that aren't
      // touched by source-shape edits.
      update(editing.id, { name, points });
      onSaved?.(editing.id);
      return;
    }
    const entry = add(name, points);
    onSaved?.(entry.id);
  };

  const handleDelete = () => {
    if (!editing) return;
    const id = editing.id;
    remove(id);
    onDeleted?.(id);
  };

  const canSave = points.length >= 3 && name.trim().length > 0;

  // Copy the live polygon as a CSS declaration (not just the
  // function value) so users can paste it directly into any CSS
  // rule. The declaration form is also self-documenting compared to
  // a bare `polygon(...)` string.
  const handleCopyClipPath = async () => {
    if (points.length < 3) return;
    const declaration = `clip-path: ${pointsToClipPath(points)};`;
    const ok = await copyToClipboard(declaration);
    if (!ok) {
      showToast('Clipboard unavailable', 'error');
      return;
    }
    showToast('Shape copied to clipboard');
    setJustCopied(true);
    // Tracked in a ref so a rapid double-tap doesn't leave a stale
    // timeout flipping the icon back mid-feedback.
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => {
      setJustCopied(false);
      copyTimerRef.current = null;
    }, 1500);
  };

  return (
    <motion.div
      ref={containerRef}
      role="group"
      aria-labelledby={titleId}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
    >
      <div className="mt-3 flex flex-col gap-3 rounded-xl border border-border/70 bg-bg-soft/50 px-3 py-3">
        <div className="flex items-center justify-between">
          <h3 id={titleId} className="text-[12px] font-semibold text-fg">
            {editing ? 'Edit shape' : 'Create custom shape'}
          </h3>
          <div className="flex items-center gap-1">
            {/* Copy the live polygon as a `clip-path: polygon(...);`
                declaration so users can paste the shape into any
                CSS rule. Disabled until the polygon has at least
                3 vertices so the copied value is well-formed. */}
            <button
              type="button"
              onClick={handleCopyClipPath}
              disabled={points.length < 3}
              aria-label="Copy clip-path declaration to clipboard"
              title="Copy clip-path declaration"
              className="grid h-6 w-6 place-items-center rounded text-fg-muted hover:bg-bg-panel hover:text-fg focus-ring transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-fg-muted"
            >
              {justCopied ? (
                <Check size={12} className="text-emerald-400" />
              ) : (
                <Copy size={12} />
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-[11px] text-fg-muted hover:text-fg focus-ring rounded px-1 py-0.5"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={nameInputId}
            className="text-[11px] uppercase tracking-wider text-fg-subtle font-semibold"
          >
            Name
          </label>
          <input
            ref={nameInputRef}
            id={nameInputId}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            placeholder="My shape"
            autoComplete="off"
            aria-invalid={name.trim().length === 0 || undefined}
            className="h-9 rounded-lg border border-border/70 bg-bg-soft px-3 text-sm focus-ring focus:border-accent/60"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (canSave) handleSave();
              }
            }}
          />
          {name.trim().length === 0 && (
            <span className="text-[10px] text-fg-subtle">
              Give your shape a name to save it.
            </span>
          )}
        </div>

        <div className="grid place-items-center">
          <PolygonEditor points={points} onChange={setPoints} size={240} />
        </div>

        <div
          className={cn(
            'flex items-center gap-1.5 border-t border-border/40 pt-2.5',
            editing ? 'justify-between' : 'justify-end'
          )}
        >
          {editing && (
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 focus-ring"
              aria-label={`Delete custom shape ${editing.name}`}
            >
              <Trash2 size={13} />
              Delete
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onCancel}
              className="h-8 rounded-lg px-3 text-xs text-fg-muted hover:text-fg focus-ring"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="h-8 rounded-lg bg-accent px-3 text-xs font-semibold text-accent-contrast shadow-glow focus-ring hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {editing ? 'Save' : 'Create shape'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
