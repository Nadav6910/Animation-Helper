import { useEffect, useRef } from 'react';
import LZString from 'lz-string';
import { useAnimationStore } from '@/store/animationStore';
import { validateAnimationConfig } from '@/lib/validateConfig';
import type { AnimationConfig } from '@/types/animation';

const NEW_PREFIX = '#c=';
const LEGACY_PREFIX = '#cfg=';

function encode(config: AnimationConfig): string {
  try {
    const json = JSON.stringify(config);
    return NEW_PREFIX + LZString.compressToEncodedURIComponent(json);
  } catch {
    return '';
  }
}

/**
 * Decode an `AnimationConfig` from a URL hash. Pipes the JSON through
 * `validateAnimationConfig` so a malicious share URL can't seed
 * arbitrary CSS values into generators that interpolate untrusted
 * config fields into `<style>` rules (`easing.value`, `direction`,
 * `fill`, `offsetPath.rotate`). Per-field allow-listing happens there;
 * here we only handle the transport.
 */
function decode(hash: string): AnimationConfig | null {
  let raw: unknown = null;
  if (hash.startsWith(NEW_PREFIX)) {
    try {
      const json = LZString.decompressFromEncodedURIComponent(
        hash.slice(NEW_PREFIX.length)
      );
      if (!json) return null;
      raw = JSON.parse(json);
    } catch {
      return null;
    }
  } else if (hash.startsWith(LEGACY_PREFIX)) {
    try {
      const json = decodeURIComponent(
        escape(atob(hash.slice(LEGACY_PREFIX.length)))
      );
      raw = JSON.parse(json);
    } catch {
      return null;
    }
  } else {
    return null;
  }
  return validateAnimationConfig(raw);
}

/**
 * Loads config from #c= (or legacy #cfg=) on mount and writes back on change.
 */
export function useUrlState() {
  const config = useAnimationStore((s) => s.config);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    const decoded = decode(window.location.hash);
    if (decoded && decoded.keyframes?.length) {
      useAnimationStore.setState((s) => ({
        config: { ...s.config, ...decoded },
        selectedKeyframeId:
          decoded.keyframes[0]?.id ?? s.selectedKeyframeId,
      }));
    }
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    let raf = 0;
    const write = () => {
      const next = encode(config);
      if (next && window.location.hash !== next) {
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}${window.location.search}${next}`
        );
      }
    };
    raf = window.requestAnimationFrame(write);
    return () => window.cancelAnimationFrame(raf);
  }, [config]);
}
