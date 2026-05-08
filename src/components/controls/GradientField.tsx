import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

const STRICT_2_STOP_RE =
  /^linear-gradient\(\s*([-\d.]+)deg\s*,\s*(#[0-9a-fA-F]{3,8})\s+([-\d.]+)%\s*,\s*(#[0-9a-fA-F]{3,8})\s+([-\d.]+)%\s*\)$/;
const ANY_GRADIENT_RE = /gradient\s*\(/i;

const PRESETS = [
  { name: 'Sunset', value: 'linear-gradient(45deg, #ff7e5f 0%, #feb47b 100%)' },
  { name: 'Ocean', value: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)' },
  { name: 'Aurora', value: 'linear-gradient(120deg, #00c6ff 0%, #0072ff 100%)' },
  { name: 'Candy', value: 'linear-gradient(45deg, #ff8a00 0%, #e52e71 100%)' },
  { name: 'Mint', value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { name: 'Plum', value: 'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)' },
];

type Stops = {
  angle: number;
  c1: string;
  s1: number;
  c2: string;
  s2: number;
};

const DEFAULT: Stops = { angle: 90, c1: '#7c5cff', s1: 0, c2: '#06b6d4', s2: 100 };

const parseStrict = (raw: string): Stops | null => {
  const m = raw.match(STRICT_2_STOP_RE);
  if (!m) return null;
  return {
    angle: Number(m[1]),
    c1: m[2],
    s1: Number(m[3]),
    c2: m[4],
    s2: Number(m[5]),
  };
};

const clampPct = (n: number) => Math.max(0, Math.min(100, n));

const toCss = (s: Stops): string =>
  `linear-gradient(${s.angle}deg, ${s.c1} ${s.s1}%, ${s.c2} ${s.s2}%)`;

export function GradientField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const isGradient = ANY_GRADIENT_RE.test(value);
  // The visual stop editor only knows how to round-trip the strict
  // 2-stop hex shape it emits. Anything else (3+ stops, named colours,
  // rgb()/hsl() stops, radial-gradient, etc.) parses as null — in that
  // case we keep the gradient but disable the stop editor so it can't
  // silently overwrite the user's gradient on the next slider drag.
  const parsed = parseStrict(value);
  const editable = isGradient && parsed !== null;
  const [open, setOpen] = useState(isGradient);
  const [stops, setStops] = useState<Stops>(parsed ?? DEFAULT);

  useEffect(() => {
    if (parsed) setStops(parsed);
  }, [parsed]);

  const apply = (s: Stops) => {
    const safe: Stops = {
      ...s,
      s1: clampPct(s.s1),
      s2: clampPct(s.s2),
    };
    setStops(safe);
    onChange(toCss(safe));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-fg-subtle font-semibold">
          {label}
        </span>
        <button
          type="button"
          onClick={() => {
            if (isGradient) {
              onChange('');
              setOpen(false);
            } else {
              onChange(toCss(stops));
              setOpen(true);
            }
          }}
          className={cn(
            'h-5 rounded-full border px-2 text-[10px] focus-ring transition-colors',
            isGradient
              ? 'bg-accent/15 border-accent/50 text-fg'
              : 'bg-bg-soft border-border/70 text-fg-muted hover:text-fg'
          )}
        >
          {isGradient ? 'Gradient on' : 'Gradient off'}
        </button>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-bg-soft px-2 h-10 focus-within:border-accent/60">
        {isGradient ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 flex-1 text-left focus-ring"
          >
            <span
              className="h-7 w-7 rounded-md border border-border/60"
              style={{ background: value }}
            />
            <span className="font-mono text-[10px] text-fg-muted truncate flex-1">
              {value}
            </span>
            <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-fg-subtle">
              <ChevronDown size={14} />
            </motion.span>
          </button>
        ) : (
          <>
            <input
              type="color"
              value={value || '#7c5cff'}
              onChange={(e) => onChange(e.target.value)}
              className="h-7 w-7 rounded-md border border-border/60 bg-transparent cursor-pointer"
              aria-label={label}
            />
            <input
              type="text"
              value={value}
              placeholder="—"
              onChange={(e) => onChange(e.target.value)}
              className="w-full min-w-0 bg-transparent text-xs font-mono outline-none"
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="text-fg-subtle hover:text-fg text-xs"
                aria-label={`Clear ${label}`}
              >
                ×
              </button>
            )}
          </>
        )}
      </div>
      <AnimatePresence initial={false}>
        {isGradient && open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-border/60 bg-bg-soft/40 p-2 mt-1.5 flex flex-col gap-2">
              <div className="flex flex-wrap gap-1">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => onChange(p.value)}
                    className="h-7 rounded-md border border-border/60 bg-bg-panel/60 px-1.5 text-[10px] text-fg-muted hover:text-fg focus-ring flex items-center gap-1.5"
                    title={p.name}
                  >
                    <span
                      className="h-4 w-4 rounded-sm border border-border/60"
                      style={{ background: p.value }}
                    />
                    {p.name}
                  </button>
                ))}
              </div>

              {!editable && (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-[10px] text-amber-300">
                  This gradient has more stops or formats than the visual
                  editor can round-trip. Pick a preset above to replace it,
                  or edit the raw value below.
                </div>
              )}

              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-md border border-border/60 bg-bg-panel/60 px-2 py-1.5 font-mono text-[10px] text-fg-muted outline-none focus:border-accent/60"
                placeholder="linear-gradient(...)"
                spellCheck={false}
              />

              <fieldset
                disabled={!editable}
                className={cn(
                  'flex flex-col gap-2 transition-opacity',
                  editable ? 'opacity-100' : 'opacity-40 pointer-events-none'
                )}
              >
                <div className="grid grid-cols-2 gap-2">
                  <StopEditor
                    label="Stop 1"
                    color={stops.c1}
                    pos={stops.s1}
                    onColor={(c) => apply({ ...stops, c1: c })}
                    onPos={(p) => apply({ ...stops, s1: p })}
                  />
                  <StopEditor
                    label="Stop 2"
                    color={stops.c2}
                    pos={stops.s2}
                    onColor={(c) => apply({ ...stops, c2: c })}
                    onPos={(p) => apply({ ...stops, s2: p })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-fg-subtle">Angle</span>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={5}
                    value={stops.angle}
                    onChange={(e) =>
                      apply({ ...stops, angle: Number(e.target.value) })
                    }
                    className="flex-1 accent-accent"
                  />
                  <span className="text-[10px] tabular-nums text-fg-muted w-8 text-right">
                    {stops.angle}°
                  </span>
                </div>
              </fieldset>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StopEditor({
  label,
  color,
  pos,
  onColor,
  onPos,
}: {
  label: string;
  color: string;
  pos: number;
  onColor: (c: string) => void;
  onPos: (p: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-fg-subtle">{label}</span>
      <div className="flex items-center gap-1.5 rounded-md border border-border/60 bg-bg-panel/60 px-1.5 h-8">
        <input
          type="color"
          value={color}
          onChange={(e) => onColor(e.target.value)}
          className="h-5 w-5 rounded border border-border/60 bg-transparent cursor-pointer"
        />
        <input
          type="text"
          value={color}
          onChange={(e) => onColor(e.target.value)}
          className="w-full min-w-0 bg-transparent text-[10px] font-mono outline-none"
        />
        <input
          type="number"
          min={0}
          max={100}
          step={5}
          value={pos}
          onChange={(e) => onPos(Number(e.target.value))}
          className="w-9 bg-transparent text-[10px] text-fg-muted tabular-nums text-right outline-none"
        />
      </div>
    </div>
  );
}
