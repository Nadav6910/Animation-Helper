import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { useAnimationStore } from '@/store/animationStore';
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

const FORMATS: { value: Format; label: string; lang: CodeLang; ext: string }[] = [
  { value: 'css', label: 'CSS', lang: 'css', ext: 'css' },
  { value: 'scss', label: 'SCSS', lang: 'scss', ext: 'scss' },
  { value: 'tailwind', label: 'Tailwind', lang: 'javascript', ext: 'js' },
  { value: 'framer', label: 'Framer', lang: 'tsx', ext: 'tsx' },
  { value: 'waapi', label: 'WAAPI', lang: 'javascript', ext: 'js' },
  { value: 'styled', label: 'styled', lang: 'tsx', ext: 'tsx' },
  { value: 'vue', label: 'Vue', lang: 'html', ext: 'vue' },
  { value: 'svelte', label: 'Svelte', lang: 'html', ext: 'svelte' },
  { value: 'react', label: 'React', lang: 'tsx', ext: 'tsx' },
  { value: 'html', label: 'HTML', lang: 'html', ext: 'html' },
];

function generate(format: Format, config: Parameters<typeof generateCss>[0]): string {
  switch (format) {
    case 'css':
      return generateCss(config);
    case 'scss':
      return generateScss(config);
    case 'tailwind':
      return generateTailwind(config);
    case 'framer':
      return generateFramerMotion(config);
    case 'waapi':
      return generateWaapi(config);
    case 'styled':
      return generateStyledComponents(config);
    case 'vue':
      return generateVue(config);
    case 'svelte':
      return generateSvelte(config);
    case 'react':
      return generateReactComponent(config);
    case 'html':
      return generateHtml(config);
  }
}

function download(filename: string, contents: string, mime: string) {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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
  const [format, setFormat] = useState<Format>('css');
  const [toast, setToast] = useState<string | null>(null);
  const { theme } = useTheme();
  const copyRef = useRef<HTMLButtonElement | null>(null);

  const code = useMemo(() => generate(format, config), [format, config]);
  const meta = FORMATS.find((f) => f.value === format)!;

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
    <div className="card flex h-full min-h-[360px] flex-col p-0 overflow-hidden">
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
              const html = generateHtml(config);
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
