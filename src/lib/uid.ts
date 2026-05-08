/**
 * Collision-resistant id factory. Prefers `crypto.randomUUID()` (122 bits
 * of randomness, RFC 4122 v4) when available, falling back to a short
 * `Math.random()` token for older browsers and JSDOM-without-crypto test
 * environments.
 *
 * Keep usage centralised so we can swap the source if a UUID lib becomes
 * a dependency, and so the fallback stays consistent across stores.
 */
export function uid(): string {
  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
}
