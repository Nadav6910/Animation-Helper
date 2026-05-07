import { useEffect, useState } from 'react';
import { highlight, type CodeLang } from '@/lib/highlight';

type Props = {
  code: string;
  lang: CodeLang;
  theme: 'dark' | 'light';
};

export function CodeBlock({ code, lang, theme }: Props) {
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    highlight(code, lang, theme).then((h) => {
      if (!cancelled) setHtml(h);
    });
    return () => {
      cancelled = true;
    };
  }, [code, lang, theme]);

  if (!html) {
    return (
      <pre className="text-xs font-mono text-fg-muted whitespace-pre-wrap p-4">
        {code}
      </pre>
    );
  }
  return (
    <div
      className="ah-shiki text-xs font-mono leading-relaxed [&_pre]:!bg-transparent [&_pre]:p-4 [&_pre]:overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
