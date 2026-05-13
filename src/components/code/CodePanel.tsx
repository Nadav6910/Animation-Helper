import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Download, ExternalLink, Film, Info, Variable } from 'lucide-react';
import { useAnimationStore } from '@/store/animationStore';
import { useFontStore } from '@/store/fontStore';
import { useUiStore } from '@/store/uiStore';
import { useCustomShapesStore } from '@/store/customShapesStore';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { generateCss } from '@/lib/generateCss';
import { generateScss } from '@/lib/generateScss';
import { generateTailwind } from '@/lib/generateTailwind';
import { generateFramerMotion } from '@/lib/generateFramerMotion';
import { generateWaapi } from '@/lib/generateWaapi';
import { generateStyledComponents } from '@/lib/generateStyledComponents';
import { generateVue } from '@/lib/generateVue';
import { generateSvelte } from '@/lib/generateSvelte';
import { generateReactComponent } from '@/lib/generateReactComponent';
import { generateHtml } from '@/lib/generateHtml';
import { generateLottie } from '@/lib/generateLottie';
import { generateAnimatedSvg } from '@/lib/generateAnimatedSvg';
import { downloadText } from '@/lib/download';
import { CopyButton } from './CopyButton';
import { Toast } from '@/components/ui/Toast';
import { useTheme } from '@/hooks/useTheme';
import type { CodeLang } from '@/lib/highlight';

const CodeBlock = lazy(() =>
  import('./CodeBlock').then((m) => ({ default: m.CodeBlock }))
);

type Format =
  | 'css'
  | 'scss'
  | 'tailwind'
  | 'framer'
  | 'waapi'
  | 'styled'
  | 'vue'
  | 'svelte'
  | 'react'
  | 'html'
  | 'lottie'
  | 'animsvg';

type GeneratorFn = (config: Parameters<typeof generateCss>[0]) => string;

type FormatRow = {
  value: Format;
  label: string;
  lang: CodeLang;
  ext: string;
  fn: GeneratorFn;
};

// Each format owns its row: label + Shiki grammar + download extension +
// the generator function. New formats add one entry — TypeScript checks
// the union exhaustively against `Format`, so an out-of-sync row trips
// the build instead of silently producing a "no matches" path.

// Formats whose generator accepts the cssVars option. Module-level so
// `.includes()` doesn't allocate a fresh array on every render. Adding
// a new generator that supports cssVars MUST add it here AND extend
// the type-cast in the `code` useMemo below.
const CSS_VARS_CAPABLE: ReadonlyArray<Format> = [
  'css',
  'scss',
  'styled',
  'animsvg',
];

const FORMATS: FormatRow[] = [
  { value: 'css', label: 'CSS', lang: 'css', ext: 'css', fn: generateCss },
  { value: 'scss', label: 'SCSS', lang: 'scss', ext: 'scss', fn: generateScss },
  { value: 'tailwind', label: 'Tailwind', lang: 'javascript', ext: 'js', fn: generateTailwind },
  { value: 'framer', label: 'Framer', lang: 'tsx', ext: 'tsx', fn: generateFramerMotion },
  { value: 'waapi', label: 'WAAPI', lang: 'javascript', ext: 'js', fn: generateWaapi },
  { value: 'styled', label: 'styled', lang: 'tsx', ext: 'tsx', fn: generateStyledComponents },
  { value: 'vue', label: 'Vue', lang: 'vue', ext: 'vue', fn: generateVue },
  { value: 'svelte', label: 'Svelte', lang: 'svelte', ext: 'svelte', fn: generateSvelte },
  { value: 'react', label: 'React', lang: 'tsx', ext: 'tsx', fn: generateReactComponent },
  { value: 'html', label: 'HTML', lang: 'html', ext: 'html', fn: generateHtml },
  { value: 'lottie', label: 'Lottie', lang: 'javascript', ext: 'json', fn: generateLottie },
  { value: 'animsvg', label: 'Animated SVG', lang: 'html', ext: 'svg', fn: generateAnimatedSvg },
];

// `download` aliases the shared `downloadText` helper so the
// deferred-revoke behaviour stays in lockstep with ExportModal's
// binary-blob path. See `lib/download.ts` for the why.
const download = downloadText;

function openCodePen(html: string, css: string) {
  const data = {
    title: 'Animation Helper export',
    html,
    css,
    js: '',
    editors: '110',
  };
  // Open a placeholder window FIRST with explicit `noopener`, then
  // submit the form into its name. `form.rel` isn't honoured on
  // `<form>` elements per HTML5 (it's an `<a>`-only attribute), so
  // the previous code was relying on modern browsers' implicit
  // noopener behaviour — pre-2022 engines would still grant
  // `window.opener` access to the CodePen tab, which could navigate
  // us to a phishing URL via `opener.location`. window.open with
  // 'noopener' is the spec-defined way to break the opener chain.
  const popup = window.open('about:blank', '_blank', 'noopener,noreferrer');
  // Some popup blockers / security policies refuse the open; in that
  // case we fall back to a same-tab navigation by submitting the form
  // without a target — the user keeps their work because we already
  // have the share-URL `#c=` round-tripping their config.
  const targetName = popup ? `_ah_codepen_${Date.now()}` : '';
  if (popup) {
    // Re-open with a unique name we can target the form at. The
    // first about:blank popup served only to break the opener
    // relationship; we close it and use a fresh named window for
    // the actual POST.
    popup.close();
    window.open('about:blank', targetName, 'noopener,noreferrer');
  }
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://codepen.io/pen/define';
  if (targetName) form.target = targetName;
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'data';
  input.value = JSON.stringify(data);
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

export function CodePanel() {
  const config = useAnimationStore((s) => s.config);
  const font = useFontStore((s) => s.font);
  // Custom shapes feed into HTML / animated-SVG exports so a generated
  // file with `shape: custom:abc123` still resolves to the right
  // clip-path. Other generators don't render shape geometry inline
  // (the user supplies their own host markup) so they don't need it.
  const customShapes = useCustomShapesStore((s) => s.customShapes);
  const setExportOpen = useUiStore((s) => s.setExportOpen);
  const [format, setFormat] = useState<Format>('css');
  const [toast, setToast] = useState<string | null>(null);
  // Persisted across reloads so power users don't have to re-flip the
  // toggle every session. Only meaningful for CSS-flavoured outputs.
  const [cssVarsOutput, setCssVarsOutput] = useLocalStorage(
    'ah:css-vars-output',
    false
  );
  // Hover-explain mode also persists — it's noisy enough that we want
  // a clear opt-in, but worth remembering when the user has turned it
  // on. Only effective for CSS-flavoured langs (the CodeBlock filters
  // by lang internally too).
  const [explainCode, setExplainCode] = useLocalStorage(
    'ah:explain-code',
    false
  );
  const { theme } = useTheme();
  const copyRef = useRef<HTMLButtonElement | null>(null);

  const meta = FORMATS.find((f) => f.value === format)!;
  const cssVarsActive = CSS_VARS_CAPABLE.includes(format) && cssVarsOutput;
  // The HTML export carries the user's chosen font (link tag + body
  // font-family + inline text style) so the downloaded file matches the
  // preview. Other formats are font-agnostic — consumer wires the font
  // in the host project.
  const code = useMemo(() => {
    if (meta.value === 'html') {
      return generateHtml(config, {
        fontFamily: font.family,
        fontHref: font.href,
        customShapes,
      });
    }
    if (meta.value === 'animsvg') {
      return generateAnimatedSvg(config, { customShapes });
    }
    if (cssVarsActive) {
      // Cast: the FormatRow type is the lowest-common-denominator
      // (single-arg fn) for the FORMATS table; the CSS-flavoured
      // generators all accept a second options arg with cssVars. Only
      // routed here when format is in CSS_VARS_CAPABLE.
      type CssVarsCapableFn = (
        config: Parameters<typeof generateCss>[0],
        opts: { cssVars: true }
      ) => string;
      return (meta.fn as unknown as CssVarsCapableFn)(config, { cssVars: true });
    }
    return meta.fn(config);
  }, [meta, config, font, cssVarsActive, customShapes]);

  useEffect(() => {
    const handler = () => copyRef.current?.click();
    window.addEventListener('ah:copy', handler);
    return () => window.removeEventListener('ah:copy', handler);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1400);
  };

  return (
    <div className="card flex h-full min-h-[240px] flex-col p-0 overflow-hidden sm:min-h-[360px]">
      <div
        className="flex flex-col gap-2 border-b border-border/60 p-3"
        data-tour-anchor="export"
      >
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin">
          {FORMATS.map((f) => {
            const active = f.value === format;
            return (
              <button
                key={f.value}
                onClick={() => setFormat(f.value)}
                className={
                  'h-7 rounded-md px-2.5 text-xs whitespace-nowrap focus-ring transition-colors ' +
                  (active
                    ? 'bg-accent/15 text-fg border border-accent/40'
                    : 'text-fg-muted hover:text-fg border border-transparent')
                }
                aria-pressed={active}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
          <button
            type="button"
            onClick={() => {
              const ext = meta.ext;
              // Pick the right MIME so the OS associates the
              // download with the right app — `text/plain` was
              // wrong for the Lottie JSON / Animated-SVG paths
              // (browsers would save them as `.txt`-feeling
              // documents on some platforms).
              const mime =
                ext === 'html'
                  ? 'text/html'
                  : ext === 'svg'
                    ? 'image/svg+xml'
                    : ext === 'json'
                      ? 'application/json'
                      : 'text/plain';
              download(`animation.${ext}`, code, mime);
              showToast(`Downloaded animation.${ext}`);
            }}
            title="Download"
            aria-label="Download"
            className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-border/70 bg-bg-soft px-2.5 text-xs text-fg-muted hover:text-fg focus-ring"
          >
            <Download size={12} />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const html = generateHtml(config, {
                customShapes,
                fontFamily: font.family,
                fontHref: font.href,
              });
              const justHtml = html.match(/<body>([\s\S]*?)<\/body>/i)?.[1].trim() ?? '';
              openCodePen(justHtml, generateCss(config));
              showToast('Opening CodePen…');
            }}
            title="Open in CodePen"
            aria-label="Open in CodePen"
            className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-border/70 bg-bg-soft px-2.5 text-xs text-fg-muted hover:text-fg focus-ring"
          >
            <ExternalLink size={12} />
            <span className="hidden sm:inline">CodePen</span>
          </button>
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            title="Export as MP4 / WebM / GIF"
            aria-label="Record video / GIF"
            className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-border/70 bg-bg-soft px-2.5 text-xs text-fg-muted hover:text-fg focus-ring"
          >
            <Film size={12} />
            <span className="hidden sm:inline">Record</span>
          </button>
          {CSS_VARS_CAPABLE.includes(format) && (
            <button
              type="button"
              onClick={() => setCssVarsOutput((v) => !v)}
              aria-pressed={cssVarsOutput}
              aria-label={cssVarsOutput ? 'Inline literal timing values' : 'Emit timing as CSS variables'}
              title={
                cssVarsOutput
                  ? 'Inline literal timing values'
                  : 'Emit timing as CSS variables (overrideable from your stylesheet)'
              }
              className={
                'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-xs focus-ring transition-colors ' +
                (cssVarsOutput
                  ? 'border-accent/40 bg-accent/15 text-fg'
                  : 'border-border/70 bg-bg-soft text-fg-muted hover:text-fg')
              }
            >
              <Variable size={12} />
              <span className="hidden sm:inline">CSS vars</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setExplainCode((v) => !v)}
            aria-pressed={explainCode}
            aria-label={explainCode ? 'Hide property tooltips' : 'Hover any CSS property for a one-line explanation'}
            title={
              explainCode
                ? 'Hide property tooltips'
                : 'Hover any CSS property for a one-line explanation'
            }
            className={
              'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-xs focus-ring transition-colors ' +
              (explainCode
                ? 'border-accent/40 bg-accent/15 text-fg'
                : 'border-border/70 bg-bg-soft text-fg-muted hover:text-fg')
            }
          >
            <Info size={12} />
            <span className="hidden sm:inline">Explain</span>
          </button>
        </div>
        {/* Copy gets its own row + always-visible label. It's the
            primary action of the whole panel — burying it at the
            tail of the icon strip made it feel secondary on mobile,
            and the icon alone wasn't immediately readable as
            "copy to clipboard". Now it's a full-width primary
            button that's impossible to miss. */}
        <CopyButton
          ref={copyRef}
          text={code}
          onCopied={() => showToast('Code copied to clipboard')}
        />
      </div>
      <div className="flex-1 overflow-auto scrollbar-thin">
        <Suspense
          fallback={
            <pre className="text-xs font-mono text-fg-muted whitespace-pre-wrap p-4">
              {code}
            </pre>
          }
        >
          <CodeBlock
            code={code}
            lang={meta.lang}
            theme={theme}
            explain={explainCode}
          />
        </Suspense>
      </div>
      <Toast visible={!!toast} message={toast ?? ''} />
    </div>
  );
}
