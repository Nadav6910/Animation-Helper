/**
 * Property → short prose explanation, used by the "Explain this code"
 * tooltip in CodeBlock. Coverage matches the union of properties our
 * CSS-flavoured generators emit (declarationsForKeyframe +
 * buildRuleDeclLines + keyframe-style decls), so every line in a CSS
 * preview can surface a hover hint when explain mode is on.
 *
 * Keep entries short — a single sentence in the tooltip, with a
 * one-line MDN-style cue. The tooltip is meant to teach in passing,
 * not replace the docs.
 */

export type CssExplanation = {
  /** The "what" in one sentence — what the property does. */
  what: string;
  /** Optional "why use this here" — what role it plays in animations
   *  specifically, if non-obvious. */
  detail?: string;
};

const REFERENCE: Record<string, CssExplanation> = {
  animation: {
    what: 'Shorthand for the animation timing — name, duration, easing, delay, iteration count, direction, fill mode.',
    detail:
      'Each space-separated value maps to a longhand property in the order shown.',
  },
  'animation-name': {
    what: 'Which `@keyframes` rule drives this animation.',
  },
  'animation-duration': {
    what: 'How long one iteration of the animation takes.',
  },
  'animation-timing-function': {
    what: 'The easing curve — controls speed across each iteration (ease, linear, cubic-bezier, steps).',
  },
  'animation-delay': {
    what: 'Wait this long before the first iteration starts. Negative values fast-forward into the animation.',
  },
  'animation-iteration-count': {
    what: 'How many times the animation runs. `infinite` loops forever.',
  },
  'animation-direction': {
    what: 'Per-iteration direction. `alternate` reverses every other run for a ping-pong loop.',
  },
  'animation-fill-mode': {
    what: 'What styles the element takes before / after the animation runs.',
    detail:
      '`forwards` keeps the end-state painted; `backwards` paints the start-state during the delay.',
  },
  'animation-play-state': {
    what: 'Pause / resume an in-flight animation without restarting it.',
  },

  // ---- Keyframe property declarations ------------------------------
  transform: {
    what: 'Translate, rotate, scale, skew the element. Works on the GPU compositor — cheap to animate.',
    detail:
      'Multiple functions in one declaration apply right-to-left: `translate3d(...) rotate(...)` rotates first, then translates.',
  },
  opacity: {
    what: 'Element transparency from 0 (invisible) to 1 (opaque). Compositor-friendly like transform.',
  },
  filter: {
    what: 'Visual post-processing — blur, hue-rotate, drop-shadow, brightness, etc.',
    detail:
      'Animations involving filter run off the main thread but can be heavier than transform/opacity.',
  },
  color: {
    what: 'Foreground (text) colour. Smooth interpolation between hex / rgb / hsl values.',
  },
  background: {
    what: 'Background shorthand — colour, image, gradient, position, size, repeat in one declaration.',
  },
  'background-color': {
    what: 'Background fill colour.',
  },
  'background-image': {
    what: 'Background image or gradient. Linear-gradient values interpolate per-stop.',
  },
  'background-clip': {
    what: 'Where the background paints — `text` clips it to the glyph shapes (gradient text trick).',
  },
  '-webkit-background-clip': {
    what: 'Vendor-prefixed `background-clip` for Safari + older Chromium. Pair both for max coverage.',
  },
  '-webkit-text-fill-color': {
    what: 'Vendor-prefixed text fill — `transparent` reveals a clipped background gradient on the glyphs (paired with `background-clip: text`).',
  },

  // ---- SVG draw + offset path --------------------------------------
  stroke: {
    what: 'Outline colour for SVG shapes / paths.',
  },
  'stroke-width': {
    what: 'Outline thickness for SVG shapes.',
  },
  'stroke-dasharray': {
    what: 'Dash pattern for the stroke. With pathLength="100", `100` = the whole length.',
  },
  'stroke-dashoffset': {
    what: 'Where the dash pattern starts along the path — animating from 100 → 0 makes the line "draw on".',
  },
  'stroke-linecap': {
    what: 'Shape of the stroke endpoints — `round` softens the line draw entrance.',
  },
  'stroke-linejoin': {
    what: 'How corners join — `round` smooths sharp angles.',
  },
  fill: {
    what: 'Fill colour for SVG shapes.',
  },
  'offset-path': {
    what: 'A path the element follows during animation, like CSS-level motion paths.',
    detail:
      'Use with `offset-distance` keyframe values (0% → 100%) to slide the element along the path.',
  },
  'offset-distance': {
    what: 'Position along the offset-path, 0% (start) to 100% (end).',
  },
  'offset-rotate': {
    what: 'Rotation along the offset-path. `auto` orients the element to the path tangent.',
  },

  // ---- Other commonly emitted properties ---------------------------
  'transform-origin': {
    what: 'The pivot point for transforms — defaults to centre. Affects rotation + scale.',
  },
  'transform-style': {
    what: '`preserve-3d` keeps child transforms in the same 3D space (needed for nested 3D rotations).',
  },
  perspective: {
    what: 'How far the camera is from the 3D scene — smaller = stronger perspective.',
  },
  'perspective-origin': {
    what: 'The vanishing point for the perspective projection.',
  },
  display: {
    what: 'Box layout mode. `inline-block` is needed on stagger letter spans so transforms can apply per-letter.',
  },
  position: {
    what: 'How the element is positioned in flow — `relative` / `absolute` enable offset-based layout.',
  },
};

/**
 * Look up a CSS property's explanation, falling back to `null` for
 * properties we haven't documented yet (the tooltip can simply not
 * render in that case). Case-insensitive; vendor prefixes (`-webkit-`,
 * etc.) are matched verbatim because they have their own quirks.
 */
export function explainProperty(prop: string): CssExplanation | null {
  if (!prop) return null;
  const key = prop.trim().toLowerCase();
  return REFERENCE[key] ?? null;
}

/** True when we have an explanation for `prop`. Used by tooltip code
 *  to decide whether the cursor change / hover affordance applies. */
export function hasExplanation(prop: string): boolean {
  return explainProperty(prop) !== null;
}
