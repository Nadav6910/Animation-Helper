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
