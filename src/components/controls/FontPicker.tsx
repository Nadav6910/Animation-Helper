import { useFontStore, FONT_PRESETS } from '@/store/fontStore';
import { cn } from '@/lib/cn';

export function FontPicker() {
  const font = useFontStore((s) => s.font);
  const setFont = useFontStore((s) => s.setFont);

  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-fg-subtle font-semibold mb-1.5">
        Font · text only
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {FONT_PRESETS.map((f) => {
          const active = f.family === font.family;
          return (
            <button
              key={f.family}
              type="button"
              onClick={() => setFont(f)}
              className={cn(
                'rounded-lg border px-2.5 py-1.5 text-left transition-colors focus-ring',
                active
                  ? 'border-accent/50 bg-accent/10 text-fg'
                  : 'border-border/70 bg-bg-soft text-fg-muted hover:text-fg hover:border-border-strong'
              )}
              style={{ fontFamily: f.family }}
            >
              <span className="block text-sm">Aa</span>
              <span className="block text-[10px] text-fg-subtle">
                {f.displayName ?? 'System'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
