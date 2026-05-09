import {
  createHighlighterCore,
  type HighlighterCore,
  type LanguageInput,
} from 'shiki/core';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma';

let _hl: Promise<HighlighterCore> | null = null;
const _loaded = new Set<CodeLang>();
const _loading = new Map<CodeLang, Promise<void>>();

/**
 * Lazy per-language grammar loader. Shiki's grammar bundles are
 * ~17 kB gzipped each (200 kB raw); loading all seven up front made
 * the precache pull 600 kB of grammars even for users who only ever
 * view one format.
 *
 * Now: the highlighter starts with NO langs. `highlight()` calls
 * `ensureLang()` before each render, which dynamic-imports the
 * specific grammar on first view of that format and caches the
 * promise so concurrent renders share the same fetch.
 */
async function ensureLang(
  hl: HighlighterCore,
  lang: CodeLang
): Promise<void> {
  if (_loaded.has(lang)) return;
  // Same-tick re-renders shouldn't double-fetch; share the in-flight
  // import promise.
  const existing = _loading.get(lang);
  if (existing) return existing;
  const p = (async () => {
    const grammar = await LANG_LOADERS[lang]();
    await hl.loadLanguage(grammar as LanguageInput);
    _loaded.add(lang);
    _loading.delete(lang);
  })();
  _loading.set(lang, p);
  return p;
}

const LANG_LOADERS: Record<CodeLang, () => Promise<unknown>> = {
  css: () => import('@shikijs/langs/css'),
  javascript: () => import('@shikijs/langs/javascript'),
  tsx: () => import('@shikijs/langs/tsx'),
  scss: () => import('@shikijs/langs/scss'),
  html: () => import('@shikijs/langs/html'),
  vue: () => import('@shikijs/langs/vue'),
  svelte: () => import('@shikijs/langs/svelte'),
};

export function getHighlighter(): Promise<HighlighterCore> {
  if (!_hl) {
    _hl = createHighlighterCore({
      themes: [
        import('@shikijs/themes/github-dark-default'),
        import('@shikijs/themes/github-light-default'),
      ],
      // Empty `langs` so first-render only pays for the engine + WASM
      // + themes; individual grammars stream in on demand via
      // `ensureLang()` below. Saves ~570 kB of parse cost up front
      // for users who only ever look at the CSS tab.
      langs: [],
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
  await ensureLang(hl, lang);
  return hl.codeToHtml(code, {
    lang,
    theme: theme === 'light' ? 'github-light-default' : 'github-dark-default',
  });
}
