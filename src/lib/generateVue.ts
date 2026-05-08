import type { AnimationConfig } from '@/types/animation';
import { generateCss } from './generateCss';

export type GenerateVueOptions = {
  className?: string;
};

export function generateVue(
  c: AnimationConfig,
  opts: GenerateVueOptions = {}
): string {
  const className = opts.className ?? 'animated';
  const css = generateCss({ ...c, selector: `.${className}` }, { name: 'play' });

  return `<template>
  <div class="${className}"></div>
</template>

<script setup lang="ts">
// Drop-in Vue 3 component using the same CSS animation
</script>

<style scoped>
${css}
</style>
`;
}
