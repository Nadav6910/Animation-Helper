import type {
  AnimationConfig,
  TokenAnimation,
  TokenizeMode,
} from '@/types/animation';

/**
 * Split `text` into renderable tokens.
 *
 *  - 'letter': one token per Unicode code point. Uses the spread
 *    operator (NOT `.split('')`) so surrogate pairs — emoji,
 *    combined characters — stay intact as a single token. Spaces are
 *    their own tokens, matching the legacy `[...text]` behaviour so
 *    rendered span indices line up with token indices.
 *
 *  - 'word': alternating word / whitespace runs. "Hello World"
 *    → ['Hello', ' ', 'World']. Whitespace is kept as its own token
 *    (not stripped) so the rendered layout is preserved and word
 *    indices map cleanly onto rendered spans. Leading / trailing /
 *    collapsed whitespace runs each become a single token.
 *
 * Always returns a fresh array. Never returns empty-string tokens.
 */
export function tokenize(text: string, mode: TokenizeMode): string[] {
  if (!text) return [];
  if (mode === 'letter') return [...text];
  // Capturing split keeps the separators; filter drops the empty
  // strings the regex yields at the string boundaries.
  return text.split(/(\s+)/).filter((t) => t.length > 0);
}

/**
 * Effective tokenize mode for a config. Centralised so the
 * "absent ⇒ letter" fallback is defined in exactly one place and
 * every consumer (renderer, generators, UI) agrees.
 */
export function tokenizeModeOf(config: AnimationConfig): TokenizeMode {
  return config.tokenizeMode === 'word' ? 'word' : 'letter';
}

/**
 * Resolve which preset (if any) drives a given token's animation.
 * Returns the presetId for the first TokenAnimation entry that
 * lists this index, or `null` when the token should use the
 * config's own global keyframes/timing.
 *
 * First-match wins: if overlapping entries both list the same
 * index, the earlier entry takes precedence. The UI is responsible
 * for not producing overlaps, but the resolver stays total either
 * way.
 *
 * NOTE: this returns the raw id WITHOUT checking the preset
 * actually exists — the validator doesn't check existence either
 * (it stays decoupled from the preset registry). The step-3/4
 * consumer that turns this id into keyframes MUST treat an unknown
 * id as "fall back to the config's global animation" so a renamed
 * / stale preset id degrades gracefully instead of silently
 * producing a dead, un-animated token. Tracked so it isn't lost.
 */
export function tokenAnimationFor(
  tokenIndex: number,
  config: AnimationConfig
): string | null {
  return resolveTokenPreset(tokenIndex, config.tokenAnimations);
}

/**
 * Same resolution as `tokenAnimationFor` but takes the list
 * directly, for consumers (the renderer) that hold only the
 * `tokenAnimations` array and shouldn't have to thread a whole
 * AnimationConfig just for the lookup. Single source of truth —
 * `tokenAnimationFor` delegates here.
 */
export function resolveTokenPreset(
  tokenIndex: number,
  list: ReadonlyArray<TokenAnimation> | undefined
): string | null {
  if (!list || list.length === 0) return null;
  for (const entry of list) {
    if (entry.tokens.includes(tokenIndex)) return entry.presetId;
  }
  return null;
}

/**
 * True when this config has at least one per-token override. Cheap
 * guard so consumers can skip the per-token codepaths entirely for
 * the common (stagger-only or no-stagger) case.
 */
export function hasTokenAnimations(config: AnimationConfig): boolean {
  return !!config.tokenAnimations && config.tokenAnimations.length > 0;
}
