import { useMemo } from 'react';
import { useFontStore } from '@/store/fontStore';
import { buildTokenPresetMap, tokenize } from '@/lib/tokenize';
import type { TokenAnimation, TokenizeMode } from '@/types/animation';

type Props = {
  text: string;
  className: string;
  stagger?: { step: number };
  /** Absent ⇒ 'letter' (legacy behaviour). */
  tokenizeMode?: TokenizeMode;
  /** Per-token preset overrides. When present (even without
   *  stagger) the text is rendered as addressable spans. */
  tokenAnimations?: TokenAnimation[];
};

const TEXT_CLASS =
  'font-display text-5xl sm:text-6xl text-fg leading-tight tracking-tight text-center';

const isWhitespace = (s: string) => /^\s+$/.test(s);

export function TextTarget({
  text,
  className,
  stagger,
  tokenizeMode,
  tokenAnimations,
}: Props) {
  const font = useFontStore((s) => s.font);
  // Flatten the override list to a Map once per tokenAnimations
  // reference so each span's lookup is O(1) instead of scanning
  // every entry. Declared before any early return so the hook
  // order is stable regardless of the stagger/per-token branch.
  const presetMap = useMemo(
    () => buildTokenPresetMap(tokenAnimations),
    [tokenAnimations]
  );

  const display = text || 'Animate';
  const style: React.CSSProperties = { fontFamily: font.family };

  // Per-token spans are needed when EITHER the global stagger is on
  // OR there are per-token overrides — the per-token feature needs
  // the addressable spans even with stagger off.
  const hasPerToken = !!tokenAnimations && tokenAnimations.length > 0;
  if (!stagger && !hasPerToken) {
    return (
      <p className={`${className} ${TEXT_CLASS}`} style={style}>
        {display}
      </p>
    );
  }

  const mode: TokenizeMode = tokenizeMode === 'word' ? 'word' : 'letter';
  const tokens = tokenize(display, mode);

  return (
    <p
      className={`${className} ${TEXT_CLASS}`}
      style={style}
      aria-label={display}
    >
      {tokens.map((tok, i) => {
        // data-anim carries the per-token preset id so the CSS /
        // generator layer (step 4) can target `> span[data-anim=…]`
        // with that token's own @keyframes. Absent ⇒ the token uses
        // the config's global animation. data-i + --i keep the
        // existing stagger machinery (.cls > span { animation-delay:
        // calc(var(--i) * step) }) working unchanged.
        const presetId = presetMap.get(i) ?? null;
        const ws = isWhitespace(tok);
        return (
          <span
            key={i}
            data-i={i}
            data-anim={presetId ?? undefined}
            style={
              {
                ['--i' as never]: i,
                // Whitespace tokens collapse to zero width inside an
                // inline-block span (the generated stagger CSS sets
                // display:inline-block); `pre` preserves the run so
                // word-mode spacing and inter-letter spaces survive.
                ...(ws ? { whiteSpace: 'pre' } : null),
              } as React.CSSProperties
            }
            aria-hidden
          >
            {tok}
          </span>
        );
      })}
    </p>
  );
}
