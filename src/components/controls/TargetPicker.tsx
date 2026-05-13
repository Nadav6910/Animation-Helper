import { useMemo, useState } from 'react';
import { Type, Shapes, Spline, Plus, X, Pencil, Search } from 'lucide-react';
import { useAnimationStore } from '@/store/animationStore';
import { useCustomPathsStore } from '@/store/customPathsStore';
import { useCustomShapesStore } from '@/store/customShapesStore';
import { Tabs } from '@/components/ui/Tabs';
import {
  customShapeToDef,
  resolveShapeDef,
  SHAPES,
  type ShapeDef,
} from '@/lib/shapes';
import {
  SVG_PATHS,
  SVG_PATH_CATEGORIES,
  type SvgPathCategory,
  type SvgPathDef,
} from '@/lib/svgPaths';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { CustomSvgForm } from './CustomSvgForm';
import { CustomShapeModal } from './CustomShapeModal';
import { FontPicker } from './FontPicker';
import type { CustomShape } from '@/types/animation';

function ShapeGlyph({
  preview,
  className,
}: {
  preview: ShapeDef['preview'];
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      {preview.kind === 'rect' && (
        <rect x="0" y="0" width="100" height="100" rx={preview.rx} />
      )}
      {preview.kind === 'circle' && <circle cx="50" cy="50" r="50" />}
      {preview.kind === 'path' && <path d={preview.d} />}
    </svg>
  );
}

function PathGlyph({
  def,
  className,
}: {
  // Only the geometry matters here — accepts both SvgPathDef and the
  // user's stored CustomPath (which has no category field).
  def: Pick<SvgPathDef, 'viewBox' | 'd'>;
  className?: string;
}) {
  return (
    <svg
      viewBox={def.viewBox}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <path d={def.d} />
    </svg>
  );
}

type CollapsiblePickerProps<T> = {
  ariaLabel: string;
  selected: T | null;
  renderSelectedGlyph: (item: T) => React.ReactNode;
  selectedLabel: string;
  items: T[];
  itemKey: (item: T) => string;
  isActive: (item: T) => boolean;
  onSelect: (item: T) => void;
  renderItemGlyph: (item: T, active: boolean) => React.ReactNode;
  itemLabel: (item: T) => string;
};

function CollapsiblePicker<T>({
  ariaLabel,
  selected,
  renderSelectedGlyph,
  selectedLabel,
  items,
  itemKey,
  isActive,
  onSelect,
  renderItemGlyph,
  itemLabel,
}: CollapsiblePickerProps<T>) {
  const [expanded, setExpanded] = useState(selected === null);

  return (
    <div aria-label={ariaLabel}>
      <AnimatePresence mode="wait" initial={false}>
        {expanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            <div
              className="-mx-3 overflow-x-auto scrollbar-thin sm:mx-0"
              role="radiogroup"
              aria-label={ariaLabel}
            >
              <div className="flex w-max gap-2 px-3 pb-1 sm:px-0 snap-x snap-mandatory">
                {items.map((item) => {
                  const active = isActive(item);
                  return (
                    <motion.button
                      key={itemKey(item)}
                      role="radio"
                      aria-checked={active}
                      aria-label={itemLabel(item)}
                      onClick={() => {
                        onSelect(item);
                        setExpanded(false);
                      }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      className={cn(
                        'flex w-20 shrink-0 snap-start flex-col items-center gap-1.5 rounded-xl border bg-bg-soft p-2.5 focus-ring transition-colors',
                        active
                          ? 'border-accent/60 bg-accent/5 shadow-glow'
                          : 'border-border/70 hover:border-border-strong',
                      )}
                    >
                      <span className="grid aspect-square w-full place-items-center">
                        {renderItemGlyph(item, active)}
                      </span>
                      <span
                        className={cn(
                          'text-[11px] font-medium leading-none',
                          active ? 'text-fg' : 'text-fg-muted',
                        )}
                      >
                        {itemLabel(item)}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            type="button"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setExpanded(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-border/70 bg-bg-soft p-2.5 text-left focus-ring transition-colors hover:border-border-strong"
          >
            {selected !== null && (
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-bg-panel/70">
                {renderSelectedGlyph(selected)}
              </span>
            )}
            <span className="flex-1 min-w-0">
              <span className="block text-[11px] uppercase tracking-wider text-fg-subtle font-semibold">
                Selected
              </span>
              <span className="block truncate text-sm font-medium text-fg">
                {selectedLabel}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-bg-panel/70 px-2.5 py-1.5 text-xs font-medium text-fg-muted">
              <Pencil size={12} />
              Change
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TargetPicker() {
  const config = useAnimationStore((s) => s.config);
  const setTarget = useAnimationStore((s) => s.setTarget);
  const setShape = useAnimationStore((s) => s.setShape);
  const setText = useAnimationStore((s) => s.setText);
  const setSvgPath = useAnimationStore((s) => s.setSvgPath);
  const customPaths = useCustomPathsStore((s) => s.paths);
  const removeCustom = useCustomPathsStore((s) => s.remove);
  const [showCustomForm, setShowCustomForm] = useState(false);

  // SVG path picker state — category filter + free-text search. Search
  // overrides category when non-empty so "arrow" finds the arrow icons
  // even on the Shapes tab. 'all' shows everything (good landing tab
  // when the user knows what they want and just wants to scan).
  const [pathCategory, setPathCategory] = useState<SvgPathCategory | 'all'>(
    'all'
  );
  const [pathQuery, setPathQuery] = useState('');

  const filteredPaths = useMemo(() => {
    const q = pathQuery.trim().toLowerCase();
    return SVG_PATHS.filter((p) => {
      if (q) return p.label.toLowerCase().includes(q) || p.id.includes(q);
      return pathCategory === 'all' || p.category === pathCategory;
    });
  }, [pathCategory, pathQuery]);

  // Custom shapes are kept in their own store + rendered in a separate
  // grid section below the built-ins picker. `resolveShapeDef` resolves
  // either kind for the "currently selected" display in the picker's
  // collapsed view.
  const customShapes = useCustomShapesStore((s) => s.customShapes);
  const currentShape = config.shape
    ? resolveShapeDef(config.shape, customShapes) ?? null
    : null;
  const [shapeModalOpen, setShapeModalOpen] = useState(false);
  const [editingShape, setEditingShape] = useState<CustomShape | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        fullWidth
        value={config.target}
        onChange={(v) => setTarget(v)}
        tabs={[
          { value: 'text', label: 'Text', icon: <Type size={14} /> },
          { value: 'shape', label: 'Shape', icon: <Shapes size={14} /> },
          { value: 'svg', label: 'Path', icon: <Spline size={14} /> },
        ]}
      />

      {config.target === 'text' && (
        <div className="flex flex-col gap-3">
          <textarea
            value={config.text ?? ''}
            onChange={(e) => setText(e.target.value.slice(0, 120))}
            placeholder="Type something to animate"
            rows={2}
            className="w-full resize-none rounded-xl border border-border/70 bg-bg-soft px-3 py-2.5 text-sm focus-ring focus:border-accent/60"
            aria-label="Text to animate"
          />
          <FontPicker />
        </div>
      )}

      {config.target === 'shape' && (
        <CollapsiblePicker<ShapeDef>
          ariaLabel="Shape selection"
          selected={currentShape}
          selectedLabel={currentShape?.label ?? 'None'}
          renderSelectedGlyph={(s) => (
            <ShapeGlyph preview={s.preview} className="h-7 w-7 fill-accent" />
          )}
          items={SHAPES}
          itemKey={(s) => s.kind}
          isActive={(s) => config.shape === s.kind}
          onSelect={(s) => setShape(s.kind)}
          renderItemGlyph={(s, active) => (
            <ShapeGlyph
              preview={s.preview}
              className={cn(
                'h-full w-full transition-colors',
                active ? 'fill-accent' : 'fill-fg-muted/70',
              )}
            />
          )}
          itemLabel={(s) => s.label}
        />
      )}

      {config.target === 'shape' && (
        // Custom shapes panel — surfaces user-authored polygons in a
        // grid below the built-in picker. Always rendered (even when
        // empty) so the "+ Create your own" tile is always available.
        // Each existing shape is a relative-positioned wrapper around
        // a select-button + an absolutely-positioned edit button —
        // sibling buttons, not nested, mirroring the custom-paths
        // pattern below.
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[11px] uppercase tracking-wider text-fg-subtle font-semibold">
              Your shapes
            </span>
            {customShapes.length > 0 && (
              <span className="text-[10px] tabular-nums text-fg-subtle/70">
                {customShapes.length}
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {customShapes.map((shape) => {
              const def = customShapeToDef(shape);
              const active = config.shape === shape.id;
              return (
                <div key={shape.id} className="relative group">
                  <motion.button
                    type="button"
                    onClick={() => setShape(shape.id)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    aria-pressed={active}
                    aria-label={shape.name}
                    className={cn(
                      'aspect-square w-full rounded-xl border bg-bg-soft p-2.5 grid place-items-center focus-ring transition-colors',
                      active
                        ? 'border-accent/60 bg-accent/5 shadow-glow'
                        : 'border-border/70 hover:border-border-strong'
                    )}
                  >
                    <ShapeGlyph
                      preview={def.preview}
                      className={cn(
                        'h-full w-full transition-colors',
                        active ? 'fill-accent' : 'fill-fg-muted/70'
                      )}
                    />
                  </motion.button>
                  {/* Edit button: absolutely positioned sibling of the
                      select button (NOT nested inside it — invalid
                      HTML). Fades in on hover/focus of the group so
                      idle tiles don't look noisy. */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingShape(shape);
                      setShapeModalOpen(true);
                    }}
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-bg-panel/80 text-fg-muted opacity-0 transition-opacity hover:text-accent focus-ring group-hover:opacity-100 group-focus-within:opacity-100"
                    aria-label={`Edit ${shape.name}`}
                  >
                    <Pencil size={10} />
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setEditingShape(null);
                setShapeModalOpen(true);
              }}
              className="aspect-square rounded-xl border-2 border-dashed border-border/60 bg-bg-soft/50 p-2.5 grid place-items-center focus-ring text-fg-muted hover:text-fg hover:border-border-strong transition-colors"
              aria-label="Create custom shape"
            >
              <Plus size={18} />
            </button>
          </div>
          {/* Mount only while open so the modal's hooks and zustand
              subscriptions don't tick on every controls-panel render. */}
          {shapeModalOpen && (
            <CustomShapeModal
              open
              editing={editingShape}
              onClose={() => {
                setShapeModalOpen(false);
                // Hygiene — drop the stale editing reference so a
                // future "+ Create" click doesn't briefly flash the
                // previous edit before the open effect re-seeds.
                setEditingShape(null);
              }}
              onSaved={(id) => setShape(id)}
              onDeleted={(id) => {
                // Selected shape was just deleted — fall back to the
                // default square so the stage doesn't render an
                // empty box and the picker doesn't get stuck on a
                // ghost selection.
                if (config.shape === id) setShape('square');
              }}
            />
          )}
        </div>
      )}

      {config.target === 'svg' && (
        <div className="flex flex-col gap-2">
          {/* Search + category tabs. Search has priority — typing in
              it ignores the active tab so users can find icons across
              groups without click-juggling. */}
          <div className="relative">
            <Search
              size={13}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-subtle"
              aria-hidden
            />
            <input
              type="search"
              value={pathQuery}
              onChange={(e) => setPathQuery(e.target.value)}
              placeholder="Search icons…"
              aria-label="Search SVG icons"
              className="w-full rounded-lg border border-border/70 bg-bg-soft py-1.5 pl-8 pr-2.5 text-xs focus-ring placeholder:text-fg-subtle/70 focus:border-accent/60"
            />
          </div>
          <div
            className="-mx-3 overflow-x-auto scrollbar-thin sm:mx-0"
            role="tablist"
            aria-label="Icon categories"
          >
            <div className="flex w-max gap-1 px-3 pb-1 sm:px-0">
              {(
                [
                  { id: 'all', label: 'All' },
                  ...SVG_PATH_CATEGORIES,
                ] as { id: SvgPathCategory | 'all'; label: string }[]
              ).map((c) => {
                const active = pathCategory === c.id && !pathQuery;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setPathCategory(c.id);
                      setPathQuery('');
                    }}
                    className={cn(
                      'h-7 rounded-md px-2.5 text-xs whitespace-nowrap focus-ring transition-colors',
                      active
                        ? 'bg-accent/15 text-fg border border-accent/40'
                        : 'text-fg-muted hover:text-fg border border-transparent'
                    )}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
          {filteredPaths.length === 0 && (
            <p className="px-1 py-3 text-center text-xs text-fg-subtle">
              No icons match “{pathQuery}”.
            </p>
          )}
          <div
            role="tabpanel"
            aria-label={
              pathQuery
                ? `Search results for "${pathQuery}"`
                : `${pathCategory === 'all' ? 'All' : pathCategory} icons`
            }
            className="grid grid-cols-3 gap-2 sm:grid-cols-4"
          >
            {filteredPaths.map((p) => {
              const active = config.svgPath === p.id;
              return (
                <motion.button
                  key={p.id}
                  onClick={() => setSvgPath(p.id)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className={cn(
                    'aspect-square rounded-xl border bg-bg-soft p-3 grid place-items-center focus-ring transition-colors',
                    active
                      ? 'border-accent/60 bg-accent/5 shadow-glow text-accent'
                      : 'border-border/70 text-fg-muted hover:text-fg hover:border-border-strong'
                  )}
                  aria-pressed={active}
                  aria-label={p.label}
                >
                  <PathGlyph
                    def={p}
                    className={cn(
                      'h-full w-full',
                      active ? 'text-accent' : 'text-fg-muted'
                    )}
                  />
                </motion.button>
              );
            })}
            {customPaths.map((p) => {
              const active = config.svgPath === p.id;
              return (
                <div key={p.id} className="relative group">
                  <motion.button
                    onClick={() => setSvgPath(p.id)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    className={cn(
                      'aspect-square w-full rounded-xl border bg-bg-soft p-3 grid place-items-center focus-ring transition-colors',
                      active
                        ? 'border-accent/60 bg-accent/5 shadow-glow text-accent'
                        : 'border-border/70 text-fg-muted hover:text-fg hover:border-border-strong'
                    )}
                    aria-pressed={active}
                    aria-label={p.label}
                  >
                    <PathGlyph
                      def={p}
                      className={cn(
                        'h-full w-full',
                        active ? 'text-accent' : 'text-fg-muted'
                      )}
                    />
                  </motion.button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCustom(p.id);
                      if (config.svgPath === p.id) setSvgPath('check');
                    }}
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-bg-panel/80 text-fg-muted opacity-0 transition-opacity hover:text-rose-400 focus-ring group-hover:opacity-100"
                    aria-label={`Delete ${p.label}`}
                  >
                    <X size={11} />
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => setShowCustomForm((v) => !v)}
              className={cn(
                'aspect-square rounded-xl border-2 border-dashed bg-bg-soft/50 p-3 grid place-items-center focus-ring transition-colors',
                showCustomForm
                  ? 'border-accent/60 text-accent'
                  : 'border-border/60 text-fg-muted hover:text-fg hover:border-border-strong'
              )}
              aria-label="Add custom SVG path"
              aria-expanded={showCustomForm}
            >
              <Plus size={18} />
            </button>
          </div>
          <CustomSvgForm
            open={showCustomForm}
            onClose={() => setShowCustomForm(false)}
          />
        </div>
      )}
    </div>
  );
}
