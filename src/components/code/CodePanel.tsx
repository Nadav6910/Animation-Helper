import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { useAnimationStore } from '@/store/animationStore';
import { useFontStore } from '@/store/fontStore';
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
  | 'html';

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
];

function download(filename: string, contents: string, mime: string) {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  // a.click() schedules the download asynchronously in Firefox / Safari;
  // revoking the URL on the same tick can abort it. Defer to the next
  // task so the browser has a chance to start streaming.
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function openCodePen(html: string, css: string) {
  const data = {
    title: 'Animation Helper export',
    html,
    css,
    js: '',
    editors: '110',
  };
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://codepen.io/pen/define';
  form.target = '_blank';
  // Block the new tab from accessing window.opener (otherwise CodePen
  // could navigate this tab via window.opener.location).
  form.rel = 'noopener noreferrer';
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
  const [format, setFormat] = useState<Format>('css');
  const [toast, setToast] = useState<string | null>(null);
  const { theme } = useTheme();
  const copyRef = useRef<HTMLButtonElement | null>(null);

  const meta = FORMATS.find((f) => f.value === format)!;
  // The HTML export carries the user's chosen font (link tag + body
  // font-family + inline text style) so the downloaded file matches the
  // preview. Other formats are font-agnostic — consumer wires the font
  // in the host project.
  const code = useMemo(() => {
    if (meta.value === 'html') {
      return generateHtml(config, {
        fontFamily: font.family,
        fontHref: font.href,
      });
    }
    return meta.fn(config);
  }, [meta, config, font]);

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
      <div className="flex flex-col gap-2 border-b border-border/60 p-3">
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
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const ext = meta.ext;
              download(
                `animation.${ext}`,
                code,
                ext === 'html' ? 'text/html' : 'text/plain'
              );
              showToast(`Downloaded animation.${ext}`);
            }}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border/70 bg-bg-soft px-2.5 text-xs text-fg-muted hover:text-fg focus-ring"
          >
            <Download size={12} /> Download
          </button>
          <button
            type="button"
            onClick={() => {
              const html = generateHtml(config, {
                fontFamily: font.family,
                fontHref: font.href,
              });
              const justHtml = html.match(/<body>([\s\S]*?)<\/body>/i)?.[1].trim() ?? '';
              openCodePen(justHtml, generateCss(config));
              showToast('Opening CodePen…');
            }}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border/70 bg-bg-soft px-2.5 text-xs text-fg-muted hover:text-fg focus-ring"
          >
            <ExternalLink size={12} /> CodePen
          </button>
          <CopyButton
            ref={copyRef}
            text={code}
            onCopied={() => showToast('Code copied to clipboard')}
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto scrollbar-thin">
        <Suspense
          fallback={
            <pre className="text-xs font-mono text-fg-muted whitespace-pre-wrap p-4">
              {code}
            </pre>
          }
        >
          <CodeBlock code={code} lang={meta.lang} theme={theme} />
        </Suspense>
      </div>
      <Toast visible={!!toast} message={toast ?? ''} />
    </div>
  );
}
