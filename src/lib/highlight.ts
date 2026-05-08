import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma';

let _hl: Promise<HighlighterCore> | null = null;

export function getHighlighter(): Promise<HighlighterCore> {
  if (!_hl) {
    _hl = createHighlighterCore({
      themes: [
        import('@shikijs/themes/github-dark-default'),
        import('@shikijs/themes/github-light-default'),
      ],
      langs: [
        import('@shikijs/langs/css'),
        import('@shikijs/langs/javascript'),
        import('@shikijs/langs/tsx'),
        import('@shikijs/langs/scss'),
        import('@shikijs/langs/html'),
        import('@shikijs/langs/vue'),
        import('@shikijs/langs/svelte'),
      ],
      engine: createOnigurumaEngine(() => import('shiki/wasm')),
    });
  }
  return _hl;
}

export type CodeLang =
  | 'css'
  | 'javascript'
  | 'tsx'
  | 'scss'
  | 'html'
  | 'vue'
  | 'svelte';

export async function highlight(
  code: string,
  lang: CodeLang,
  theme: 'dark' | 'light'
): Promise<string> {
  const hl = await getHighlighter();
  return hl.codeToHtml(code, {
    lang,
    theme: theme === 'light' ? 'github-light-default' : 'github-dark-default',
  });
}
