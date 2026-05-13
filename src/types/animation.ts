export type Vec2 = [number, number];

/** Built-in shape kinds shipped in `SHAPES` (src/lib/shapes.ts). */
export type BuiltInShapeKind =
  | 'square'
  | 'triangle'
  | 'circle'
  | 'star'
  | 'arrow'
  | 'message'
  | 'hexagon'
  | 'diamond'
  | 'pill'
  | 'heart'
  | 'cross'
  | 'pentagon';

/** IDs assigned to user-authored custom shapes. The `custom:` prefix
 *  is checked at resolve time so a runtime ShapeKind value can be
 *  routed to either SHAPE_BY_KIND or the customShapesStore without
 *  ambiguity. */
export type CustomShapeId = `custom:${string}`;

/** Effective shape identifier carried in AnimationConfig.shape. */
export type ShapeKind = BuiltInShapeKind | CustomShapeId;

/** User-authored polygon shape — persisted by `customShapesStore` and
 *  consumed by the picker, the renderer, and the HTML / SVG
 *  generators. Hoisted into the types module so `lib/` consumers
 *  don't have to import from `store/` (unidirectional dependency
 *  graph: store → types ← lib, components → both). */
export type CustomShape = {
  id: CustomShapeId;
  name: string;
  /** Vertex coordinates in % space (0 – 100), matching CSS clip-path. */
  points: ReadonlyArray<readonly [number, number]>;
  createdAt: number;
};

export type TargetKind = 'text' | 'shape' | 'svg';

export type Rotate3d = {
  x: number;
  y: number;
  z: number;
  deg: number;
};

export type Transform = {
  translate?: Vec2;
  translateZ?: number;
  rotate?: Vec2;
  rotate3d?: Rotate3d;
  skew?: Vec2;
  scale?: Vec2;
  perspective?: number;
};

export type Keyframe = {
  id: string;
  at: number;
  transform?: Transform;
  opacity?: number;
  color?: string;
  bg?: string;
  blur?: number;
  hueRotate?: number;
  dropShadow?: string;
  strokeDashoffset?: number;
  easing?: Easing;
  offsetDistance?: number;
  /**
   * CSS `clip-path` value applied at this keyframe — typically a
   * `polygon(x% y%, …)` produced from the custom-shape editor. Browsers
   * interpolate clip-path smoothly between adjacent keyframes only
   * when both sides use the same shape function and (for polygons)
   * the same vertex count; mismatched counts result in a hard cut at
   * the keyframe boundary, which the UI surface (Clip-path animation
   * card, step 5) warns about so users aren't surprised.
   *
   * Lottie has no animatable clip-path primitive in its standard
   * schema; that generator emits a one-line warning and drops the
   * field, same pattern it already uses for hue-rotate.
   */
  clipPath?: string;
};

export type EasingPreset =
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out';

export type StepsJump = 'start' | 'end' | 'none' | 'both';

export type Easing =
  | { kind: 'preset'; value: EasingPreset }
  | { kind: 'cubic'; v: [number, number, number, number] }
  | { kind: 'steps'; n: number; jump: StepsJump };

export type Direction =
  | 'normal'
  | 'reverse'
  | 'alternate'
  | 'alternate-reverse';

export type FillMode = 'none' | 'forwards' | 'backwards' | 'both';

export type OffsetPath = {
  d: string;
  rotate?: 'auto' | 'reverse' | number;
};

export type AnimationConfig = {
  target: TargetKind;
  selector: string;
  shape?: ShapeKind;
  svgPath?: string;
  text?: string;
  keyframes: Keyframe[];
  duration: number;
  delay: number;
  iterations: number | 'infinite';
  direction: Direction;
  fill: FillMode;
  easing: Easing;
  stagger?: { step: number };
  offsetPath?: OffsetPath;
};
