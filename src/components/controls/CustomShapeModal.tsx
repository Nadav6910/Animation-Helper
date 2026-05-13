import { useEffect, useId, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shapes, Trash2, X } from 'lucide-react';
import { PolygonEditor } from './PolygonEditor';
import { defaultPolygon, type ClipPathPoint } from '@/lib/clipPath';
import { useCustomShapesStore } from '@/store/customShapesStore';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import type { CustomShape, CustomShapeId } from '@/types/animation';
import { cn } from '@/lib/cn';

type Props = {
  open: boolean;
  /** If set, edit this custom shape; otherwise create a new one. */
  editing?: CustomShape | null;
  onClose: () => void;
  /** Called with the just-saved shape's id so callers can select it
   *  immediately (e.g. set `config.shape` to the new id). */
  onSaved?: (id: CustomShapeId) => void;
  /** Called with the deleted shape's id so the parent can clear any
   *  state that references it — most importantly, `config.shape`
   *  if it pointed at the now-deleted shape, which would otherwise
   *  leave the stage rendering a fallback square with no indication
   *  to the user. */
  onDeleted?: (id: CustomShapeId) => void;
};

/**
 * Modal wrapper around `PolygonEditor`. Two modes — create (no
 * `editing` prop) starts from a default 4-pt square; edit pre-loads
 * the existing shape's points + name and exposes a delete action.
 * Save commits to `customShapesStore`; the picker re-renders the
 * picker list because it subscribes to the same store.
 */
export function CustomShapeModal({
  open,
  editing,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const titleId = useId();
  const nameInputId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const add = useCustomShapesStore((s) => s.add);
  const rename = useCustomShapesStore((s) => s.rename);
  const remove = useCustomShapesStore((s) => s.remove);

  const [name, setName] = useState('');
  const [points, setPoints] = useState<ClipPathPoint[]>(() => defaultPolygon());

  // Reset state when the modal opens, mirroring the keyed source of
  // truth: a freshly opened "Create" modal always starts at the
  // default square; "Edit" pre-fills from the shape being edited.
  // Tracks the modal's open/edit identity so an open→close→open
  // cycle re-seeds, but in-flight interactive changes don't get
  // wiped on every parent re-render.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setPoints(editing.points.map(([x, y]) => [x, y] as ClipPathPoint));
    } else {
      setName('');
      setPoints(defaultPolygon());
    }
  }, [open, editing]);

  // ESC closes the modal — bound at the window level so the listener
  // works regardless of which element inside the dialog has focus.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useFocusTrap(dialogRef, open, nameInputRef);

  const handleSave = () => {
    if (editing) {
      // Rename in place; the polygon points themselves can't be
      // edited in this version of the modal (the modal works on a
      // local `points` copy that's only persisted when adding a new
      // shape — editing the polygon shape of an existing custom
      // shape is a v2 feature once the keyframe animation surface
      // is wired up and clobbering all existing animations using
      // the shape is a real concern).
      rename(editing.id, name);
      onClose();
      onSaved?.(editing.id);
      return;
    }
    const entry = add(name, points);
    onClose();
    onSaved?.(entry.id);
  };

  const handleDelete = () => {
    if (!editing) return;
    const id = editing.id;
    remove(id);
    onClose();
    // Notify the parent AFTER close so it can reset any state that
    // referenced this shape (most importantly, AnimationConfig.shape
    // if the deleted shape was the currently selected one).
    onDeleted?.(id);
  };

  const canSave = points.length >= 3 && name.trim().length > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[105] grid place-items-center bg-bg/70 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={{ y: 14, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            // Cap height at the viewport so on small phones (with the
            // on-screen keyboard up, or in landscape) the dialog stays
            // fully reachable. overflow-hidden on the outer card keeps
            // the rounded corners; the inner scrollable body handles
            // overflow.
            className="flex w-full max-w-sm flex-col rounded-2xl border border-border/70 bg-bg-panel/95 shadow-2xl backdrop-blur-xl overflow-hidden focus:outline-none max-h-[calc(100dvh-2rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <Shapes size={16} className="text-accent" aria-hidden />
                <h2 id={titleId} className="text-sm font-semibold text-fg">
                  {editing ? 'Edit custom shape' : 'Create custom shape'}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-6 w-6 place-items-center rounded-full text-fg-muted hover:text-fg focus-ring"
                aria-label="Close modal"
              >
                <X size={14} />
              </button>
            </div>

            {/* overflow-y-auto on the body so a long content stack
                (editor + tall hint copy + on-screen keyboard) scrolls
                inside the modal. overscroll-behavior: contain stops
                the scroll chaining into the page beneath the modal,
                which would otherwise feel like the modal "leaks" the
                gesture through. */}
            <div
              className="flex flex-col items-stretch gap-3.5 px-4 py-4 overflow-y-auto"
              style={{ overscrollBehavior: 'contain' }}
            >
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
                  className={cn(
                    'h-9 rounded-lg border bg-bg-soft px-3 text-sm focus-ring',
                    name.trim().length === 0
                      ? 'border-border/70 focus:border-accent/60'
                      : 'border-border/70 focus:border-accent/60'
                  )}
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

              {/* Editor disabled in edit mode for v1 (see handleSave
                  comment). The `readOnly` prop suppresses pointer and
                  keyboard input AND drops vertex buttons out of the
                  tab order — without that, a focused vertex would
                  still accept arrow-key nudges, the polygon would
                  visibly change, and the save handler would silently
                  discard the edits. */}
              <div
                className={cn(
                  'grid place-items-center',
                  editing && 'opacity-60'
                )}
              >
                <PolygonEditor
                  points={points}
                  onChange={setPoints}
                  size={240}
                  readOnly={!!editing}
                />
              </div>
              {editing && (
                <p className="text-[11px] text-fg-subtle text-center">
                  Editing the polygon of a saved shape is coming soon —
                  for now, rename or delete this shape and create a new
                  one if you want different geometry.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-1.5 border-t border-border/60 px-4 py-3">
              {editing ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 focus-ring"
                  aria-label={`Delete custom shape ${editing.name}`}
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              ) : (
                <span aria-hidden />
              )}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onClose}
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
