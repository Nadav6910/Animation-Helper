import { useState } from 'react';
import { Type, Shapes, Spline, Pencil } from 'lucide-react';
import { useAnimationStore } from '@/store/animationStore';
import { Tabs } from '@/components/ui/Tabs';
import { SHAPES, SHAPE_BY_KIND, type ShapeDef } from '@/lib/shapes';
import { SVG_PATHS, SVG_PATH_BY_ID, type SvgPathDef } from '@/lib/svgPaths';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';

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
  def: SvgPathDef;
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

  const currentShape = config.shape ? SHAPE_BY_KIND[config.shape] : null;
  const currentPath = config.svgPath ? SVG_PATH_BY_ID[config.svgPath] : null;

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
        <textarea
          value={config.text ?? ''}
          onChange={(e) => setText(e.target.value.slice(0, 120))}
          placeholder="Type something to animate"
          rows={2}
          className="w-full resize-none rounded-xl border border-border/70 bg-bg-soft px-3 py-2.5 text-sm focus-ring focus:border-accent/60"
          aria-label="Text to animate"
        />
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

      {config.target === 'svg' && (
        <CollapsiblePicker<SvgPathDef>
          ariaLabel="Path selection"
          selected={currentPath}
          selectedLabel={currentPath?.label ?? 'None'}
          renderSelectedGlyph={(p) => (
            <PathGlyph def={p} className="h-7 w-7 text-accent" />
          )}
          items={SVG_PATHS}
          itemKey={(p) => p.id}
          isActive={(p) => config.svgPath === p.id}
          onSelect={(p) => setSvgPath(p.id)}
          renderItemGlyph={(p, active) => (
            <PathGlyph
              def={p}
              className={cn(
                'h-full w-full transition-colors',
                active ? 'text-accent' : 'text-fg-muted',
              )}
            />
          )}
          itemLabel={(p) => p.label}
        />
      )}
    </div>
  );
}
