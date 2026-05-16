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

/**
 * Flatten `tokenAnimations` into a `tokenIndex → presetId` map for
 * O(1) per-token resolution. Honours the same first-match-wins rule
 * as `resolveTokenPreset` (an index already mapped by an earlier
 * entry is never overwritten). The renderer builds this once per
 * `tokenAnimations` reference (memoised) so resolving N token spans
 * is O(N) instead of O(N × entries × indices).
 */
export function buildTokenPresetMap(
  list: ReadonlyArray<TokenAnimation> | undefined
): Map<number, string> {
  const map = new Map<number, string>();
  if (!list) return map;
  for (const entry of list) {
    for (const idx of entry.tokens) {
      if (!map.has(idx)) map.set(idx, entry.presetId);
    }
  }
  return map;
}

/**
 * Assign `presetId` to every index in `tokenIndices`, returning a
 * fresh, normalised list. Normalisation guarantees the invariants the
 * renderer + generators rely on:
 *
 *  - an index appears in at most one entry (the selection is first
 *    stripped from every existing entry before being merged in), so
 *    first-match-wins never has to arbitrate a token the UI assigned
 *  - entries are grouped by presetId (one entry per distinct preset)
 *  - token arrays are de-duplicated and sorted ascending
 *  - entries left with zero tokens are dropped
 *
 * Negative / non-integer indices are ignored — the same domain rule
 * the validator enforces, applied here so the store never holds an
 * out-of-domain index even before a round-trip.
 */
export function assignTokenPreset(
  list: ReadonlyArray<TokenAnimation> | undefined,
  tokenIndices: ReadonlyArray<number>,
  presetId: string
): TokenAnimation[] {
  const sel = new Set(
    tokenIndices.filter((n) => Number.isInteger(n) && n >= 0)
  );
  const out: TokenAnimation[] = [];
  for (const entry of list ?? []) {
    const kept = entry.tokens.filter((t) => !sel.has(t));
    if (kept.length > 0) out.push({ tokens: kept, presetId: entry.presetId });
  }
  if (sel.size === 0) return out;
  const target = out.find((e) => e.presetId === presetId);
  if (target) {
    target.tokens = [...new Set([...target.tokens, ...sel])].sort(
      (a, b) => a - b
    );
  } else {
    out.push({ tokens: [...sel].sort((a, b) => a - b), presetId });
  }
  return out;
}

/**
 * Drop every index in `tokenIndices` from the list (the tokens fall
 * back to the config's global animation). Entries emptied by the
 * removal are dropped. Always returns a fresh array.
 */
export function clearTokenPreset(
  list: ReadonlyArray<TokenAnimation> | undefined,
  tokenIndices: ReadonlyArray<number>
): TokenAnimation[] {
  const sel = new Set(tokenIndices);
  const out: TokenAnimation[] = [];
  for (const entry of list ?? []) {
    const kept = entry.tokens.filter((t) => !sel.has(t));
    if (kept.length > 0) out.push({ tokens: kept, presetId: entry.presetId });
  }
  return out;
}
