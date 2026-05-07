export type Vec2 = [number, number];

export type ShapeKind =
  | 'square'
  | 'triangle'
  | 'circle'
  | 'star'
  | 'arrow'
  | 'message';

export type TargetKind = 'text' | 'shape' | 'svg';

export type Transform = {
  translate?: Vec2;
  rotate?: Vec2;
  skew?: Vec2;
  scale?: Vec2;
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
};

export type EasingPreset =
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out';

export type Easing =
  | { kind: 'preset'; value: EasingPreset }
  | { kind: 'cubic'; v: [number, number, number, number] };

export type Direction =
  | 'normal'
  | 'reverse'
  | 'alternate'
  | 'alternate-reverse';

export type FillMode = 'none' | 'forwards' | 'backwards' | 'both';

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
};
