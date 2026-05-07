# Animation Helper

Design CSS animations visually and copy production-ready code in **plain CSS**, **Tailwind**, or **Framer Motion JSX** — for any text, shape, or SVG path.

## Features

- **Targets**: animate text, six built-in shapes, or SVG path-draw icons
- **Multi-keyframe timeline**: 0 → N → 100 with draggable handles, click-to-add
- **Transforms**: translate / rotate / scale / skew on X & Y, per keyframe
- **Color & filters**: opacity, blur, hue-rotate, color, background-color
- **Easing**: presets plus a custom cubic-bezier editor with live curve preview
- **Timing**: duration, delay, iteration count, direction, fill-mode
- **Per-letter stagger** for text targets
- **Shareable URLs**: state is encoded in the location hash
- **Theme & accent**: dark/light mode plus five accent colors
- **Mobile**: bottom-sheet UI with peek/half/full snap points
- **Keyboard**: `Space` replays, `C` copies, `R` resets

## Tech stack

Vite · React 19 · TypeScript · Tailwind CSS · Framer Motion · Zustand · Shiki · Vitest

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run test     # run Vitest suite
npm run build    # production build to dist/
npm run preview  # preview production build
```

## Architecture

- `src/types/animation.ts` — single source of truth for the data model
- `src/lib/generate{Css,Tailwind,FramerMotion}.ts` — pure code generators (full Vitest coverage)
- `src/store/animationStore.ts` — Zustand store
- `src/components/{layout,controls,preview,code,ui}/` — React components
- `src/hooks/` — `useAnimationStyle` (live preview), `useTheme`, `useAccent`, `useUrlState`, `useMediaQuery`

The generators are pure functions that take an `AnimationConfig` and return a string — no DOM access, no React. The live preview uses the same `generateCss` output, injected into a scoped `<style>` tag, so what you see in the preview is exactly what you copy.
