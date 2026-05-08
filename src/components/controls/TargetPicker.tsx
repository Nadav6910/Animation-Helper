import { useState } from 'react';
import { Type, Shapes, Spline, Plus, X, Pencil } from 'lucide-react';
import { useAnimationStore } from '@/store/animationStore';
import { useCustomPathsStore } from '@/store/customPathsStore';
import { Tabs } from '@/components/ui/Tabs';
import { SHAPES, SHAPE_BY_KIND, type ShapeDef } from '@/lib/shapes';
import { SVG_PATHS, type SvgPathDef } from '@/lib/svgPaths';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { CustomSvgForm } from './CustomSvgForm';
import { FontPicker } from './FontPicker';

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
  const customPaths = useCustomPathsStore((s) => s.paths);
  const removeCustom = useCustomPathsStore((s) => s.remove);
  const [showCustomForm, setShowCustomForm] = useState(false);

  const currentShape = config.shape ? SHAPE_BY_KIND[config.shape] : null;

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

      {config.target === 'svg' && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2">
            {SVG_PATHS.map((p) => {
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
