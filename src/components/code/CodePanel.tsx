import { useEffect, useMemo, useRef, useState } from 'react';
import { useAnimationStore } from '@/store/animationStore';
import { generateCss } from '@/lib/generateCss';
import { generateTailwind } from '@/lib/generateTailwind';
import { generateFramerMotion } from '@/lib/generateFramerMotion';
import { Tabs } from '@/components/ui/Tabs';
import { CodeBlock } from './CodeBlock';
import { CopyButton } from './CopyButton';
import { Toast } from '@/components/ui/Toast';
import { useTheme } from '@/hooks/useTheme';

type Format = 'css' | 'tailwind' | 'framer';

const TABS: { value: Format; label: string }[] = [
  { value: 'css', label: 'CSS' },
  { value: 'tailwind', label: 'Tailwind' },
  { value: 'framer', label: 'Framer Motion' },
];

export function CodePanel() {
  const config = useAnimationStore((s) => s.config);
  const [format, setFormat] = useState<Format>('css');
  const [toast, setToast] = useState(false);
  const { theme } = useTheme();
  const copyRef = useRef<HTMLButtonElement | null>(null);

  const code = useMemo(() => {
    if (format === 'css') return generateCss(config);
    if (format === 'tailwind') return generateTailwind(config);
    return generateFramerMotion(config);
  }, [format, config]);

  const lang = format === 'css' ? 'css' : format === 'tailwind' ? 'javascript' : 'tsx';

  useEffect(() => {
    const handler = () => copyRef.current?.click();
    window.addEventListener('ah:copy', handler);
    return () => window.removeEventListener('ah:copy', handler);
  }, []);

  return (
    <div className="card flex h-full min-h-[360px] flex-col p-0 overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 p-3">
        <Tabs value={format} onChange={setFormat} tabs={TABS} size="sm" />
        <CopyButton
          ref={copyRef}
          text={code}
          onCopied={() => {
            setToast(true);
            window.setTimeout(() => setToast(false), 1400);
          }}
        />
      </div>
      <div className="flex-1 overflow-auto scrollbar-thin">
        <CodeBlock code={code} lang={lang} theme={theme} />
      </div>
      <Toast visible={toast} message="Code copied to clipboard" />
    </div>
  );
}
