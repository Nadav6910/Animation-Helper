import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { highlight, type CodeLang } from '@/lib/highlight';
import { explainProperty, type CssExplanation } from '@/lib/cssReference';

type Props = {
  code: string;
  lang: CodeLang;
  theme: 'dark' | 'light';
  /** When true, hovering a CSS property name surfaces a tooltip with
   *  a short prose explanation. Off by default to avoid hover-noise
   *  for power users. */
  explain?: boolean;
};

type Hover = {
  prop: string;
  explanation: CssExplanation;
  rect: DOMRect;
};

// CSS-flavoured langs are the only ones whose property tokens map onto
// `cssReference.ts` in a useful way. For Tailwind / Framer / Vue / etc.
// the tokens are JS / TS values and the lookup would mostly miss; turn
// the affordance off in those formats so we don't paint underlines on
// random identifiers.
const EXPLAIN_LANGS: ReadonlySet<CodeLang> = new Set([
  'css',
  'scss',
  'html',
] as const);

export function CodeBlock({ code, lang, theme, explain = false }: Props) {
  const [html, setHtml] = useState<string>('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = useState<Hover | null>(null);

  useEffect(() => {
    let cancelled = false;
    highlight(code, lang, theme).then((h) => {
      if (!cancelled) setHtml(h);
    });
    return () => {
      cancelled = true;
    };
  }, [code, lang, theme]);

  // Mouseover delegation: when explain is on, every span inside the
  // code block gets checked. If its trimmed text matches a known
  // property, show the tooltip; otherwise clear. Single listener on
  // the container so the cost is independent of token count.
  useEffect(() => {
    const root = containerRef.current;
    if (!root || !explain || !EXPLAIN_LANGS.has(lang)) {
      setHover(null);
      return;
    }
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      // Only inspect leaf spans — anything with element children is
      // typically a line wrapper, not a token.
      if (t.tagName !== 'SPAN' || t.children.length > 0) {
        return;
      }
      const text = t.textContent?.trim() ?? '';
      // CSS property names are short identifiers. Skip anything that
      // looks like a value (numbers, parentheses, quotes) so the
      // lookup doesn't run on every cursor move.
      if (!text || text.length > 40 || /[\s(){}";']/.test(text)) {
        if (hover) setHover(null);
        return;
      }
      const explanation = explainProperty(text);
      if (!explanation) {
        if (hover) setHover(null);
        return;
      }
      setHover({
        prop: text,
        explanation,
        rect: t.getBoundingClientRect(),
      });
    };
    const onOut = (e: MouseEvent) => {
      // Hide when the cursor leaves the container entirely; per-token
      // out events fire too aggressively when sweeping across spans.
      const next = e.relatedTarget as Node | null;
      if (next && root.contains(next)) return;
      setHover(null);
    };
    root.addEventListener('mouseover', onOver);
    root.addEventListener('mouseout', onOut);
    return () => {
      root.removeEventListener('mouseover', onOver);
      root.removeEventListener('mouseout', onOut);
    };
  }, [explain, lang, hover]);

  if (!html) {
    return (
      <pre className="text-xs font-mono text-fg-muted whitespace-pre-wrap p-4">
        {code}
      </pre>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className="ah-shiki text-xs font-mono leading-relaxed [&_pre]:!bg-transparent [&_pre]:p-4 [&_pre]:overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {hover && (
              <motion.div
                key={hover.prop + hover.rect.top}
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: 0.14, ease: [0.2, 0.8, 0.2, 1] }}
                role="tooltip"
                className="pointer-events-none fixed z-[140] w-72 max-w-[calc(100vw-1rem)] rounded-xl border border-accent/40 bg-bg-panel/95 p-3 shadow-[0_24px_64px_-16px_rgb(0_0_0_/_0.55)] backdrop-blur-xl"
                style={{
                  // Position above the token; if there's not enough
                  // headroom, drop below.
                  top:
                    hover.rect.top > 140
                      ? hover.rect.top - 8
                      : hover.rect.bottom + 8,
                  left: Math.max(
                    8,
                    Math.min(
                      window.innerWidth - 296,
                      hover.rect.left + hover.rect.width / 2 - 144
                    )
                  ),
                  transform:
                    hover.rect.top > 140 ? 'translateY(-100%)' : undefined,
                }}
              >
                <div className="text-[10px] uppercase tracking-wider text-accent font-semibold">
                  CSS · {hover.prop}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-fg">
                  {hover.explanation.what}
                </p>
                {hover.explanation.detail && (
                  <p className="mt-1.5 text-[11px] leading-relaxed text-fg-muted">
                    {hover.explanation.detail}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
